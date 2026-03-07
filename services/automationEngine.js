/**
 * AUTOMATION RULES ENGINE
 * Handles automatic actions based on project state changes
 */

const Project = require('../models/Project.model');
const { ClientPayment } = require('../models/Payment.model');
const Document = require('../models/Document.model');
const Feedback = require('../models/Feedback.model');
const { Activity } = require('../models/Activity.model');
const DocumentGenerator = require('../services/documentGenerator');
const { sendPaymentOverdueEmail } = require('../services/emailService');

class AutomationEngine {

    /**
     * Run after stage approval - auto-generate stage summary PDF
     */
    static async onStageApproved(project, stage, user) {
        try {
            // Generate Stage Summary document automatically
            await DocumentGenerator.generateStageSummary(project, stage._id, user);

            await Activity.create({
                project: project._id,
                user: user._id || user.id,
                userName: user.name,
                action: `[AUTO] Stage "${stage.name}" approved → Stage Summary generated`,
                icon: '🤖',
                type: 'stage'
            });

            // Check if this is the final delivery stage
            if (stage.name === 'Delivery') {
                await this.onFinalDeliveryApproved(project, user);
            }
        } catch (err) {
            console.error('[AUTOMATION] onStageApproved error:', err.message);
        }
    }

    /**
     * Run when payment is overdue - auto set project status to On Hold
     */
    static async checkPaymentOverdue(projectId) {
        try {
            const project = await Project.findById(projectId);
            if (!project) return;

            const payments = await ClientPayment.find({ project: projectId, status: 'pending' });
            const overduePayments = payments.filter(p => p.date && new Date(p.date) < new Date());

            if (overduePayments.length > 0 && project.mode === 'active') {
                project.mode = 'paused';
                project.status = 'danger';
                await project.save();

                await Activity.create({
                    project: project._id,
                    user: project.createdBy,
                    userName: 'System',
                    action: `[AUTO] Payment overdue → Project status set to On Hold (${overduePayments.length} overdue payment(s))`,
                    icon: '🚨',
                    type: 'payment'
                });
            }
        } catch (err) {
            console.error('[AUTOMATION] checkPaymentOverdue error:', err.message);
        }
    }

    /**
     * Run when client asset is missing - auto set stage to Waiting Client
     */
    static async onAssetMissing(project, stage) {
        try {
            const pendingAssets = (stage.assetRequests || []).filter(a => a.status === 'pending');
            
            if (pendingAssets.length > 0 && stage.status !== 'completed') {
                stage.status = 'waiting-client';
                await project.save();

                await Activity.create({
                    project: project._id,
                    user: project.createdBy,
                    userName: 'System',
                    action: `[AUTO] ${pendingAssets.length} asset(s) missing in "${stage.name}" → Status set to Waiting Client`,
                    icon: '⏳',
                    type: 'stage'
                });
            }
        } catch (err) {
            console.error('[AUTOMATION] onAssetMissing error:', err.message);
        }
    }

    /**
     * Run when final delivery is approved
     * Auto-generates: Handover Kit, Maintenance Agreement, Feedback Request
     */
    static async onFinalDeliveryApproved(project, user) {
        try {
            // Generate Handover Kit
            await DocumentGenerator.generateHandoverKit(project, user);

            // Generate Maintenance Agreement
            await DocumentGenerator.generateMaintenanceAgreement(project, user);

            // Create a feedback request document
            const feedbackContent = {
                title: `Feedback Request - ${project.name}`,
                generatedDate: new Date().toISOString(),
                sections: {
                    message: `Dear ${project.clientDetails?.name || project.client}, we have completed the delivery of ${project.name}. We would love to hear your feedback.`,
                    ratingCategories: [
                        { category: 'Overall Satisfaction', description: 'How satisfied are you with the project delivery?' },
                        { category: 'Communication', description: 'How was the communication throughout the project?' },
                        { category: 'Quality', description: 'How do you rate the quality of the deliverables?' },
                        { category: 'Timeliness', description: 'Was the project delivered on time?' }
                    ],
                    projectName: project.name,
                    completionDate: new Date()
                }
            };

            await Document.create({
                project: project._id,
                projectName: project.name,
                type: 'feedback-request',
                title: feedbackContent.title,
                status: 'draft',
                content: JSON.stringify(feedbackContent),
                stage: 'Delivery',
                generatedBy: user._id || user.id,
                generatedByName: user.name
            });

            await Activity.create({
                project: project._id,
                user: user._id || user.id,
                userName: user.name,
                action: '[AUTO] Final Delivery approved → Handover Kit + Maintenance Agreement + Feedback Request generated',
                icon: '🎉',
                type: 'general'
            });
        } catch (err) {
            console.error('[AUTOMATION] onFinalDeliveryApproved error:', err.message);
        }
    }

    /**
     * Run all automation checks for a project
     */
    static async runAllChecks(projectId) {
        try {
            await this.checkPaymentOverdue(projectId);
            
            const project = await Project.findById(projectId);
            if (!project) return;

            // Check each stage for asset issues
            for (const stage of project.stages) {
                if (stage.status !== 'completed' && stage.assetRequests && stage.assetRequests.length > 0) {
                    const pendingAssets = stage.assetRequests.filter(a => a.status === 'pending');
                    if (pendingAssets.length > 0) {
                        await this.onAssetMissing(project, stage);
                    }
                }
            }
        } catch (err) {
            console.error('[AUTOMATION] runAllChecks error:', err.message);
        }
    }

    /**
     * [SCHEDULER JOB] Check all overdue payments and send automated emails
     * Runs daily (via cron in server.js)
     */
    static async checkAndEmailOverduePayments() {
        try {
            console.log('[SCHEDULER] 📧 Running overdue payment checker...');
            
            // Find all pending payments with a due date that has passed
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const overduePayments = await ClientPayment.find({
                status: 'pending',
                dueDate: { $lt: today }
            }).populate('project', 'name client clientAccess latePaymentPolicy createdBy');
            
            console.log(`[SCHEDULER] Found ${overduePayments.length} overdue payments to notify`);
            
            let sentCount = 0;
            for (const payment of overduePayments) {
                try {
                    const project = payment.project;
                    if (!project) continue;
                    
                    const clientEmail = project.clientAccess?.clientEmail;
                    const clientName = project.clientAccess?.clientName || project.client;
                    
                    if (!clientEmail) {
                        console.log(`[SCHEDULER] ⏭️  Skipping payment "${payment.label}" - no client email`);
                        continue;
                    }
                    
                    // Check if we've already sent an email for this payment today
                    // (simple check - we could improve this with a sentDate field later)
                    const recentActivity = await Activity.findOne({
                        project: project._id,
                        userName: 'System',
                        action: new RegExp(`sent overdue notice.*${payment.label}`),
                        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                    });
                    
                    if (recentActivity) {
                        console.log(`[SCHEDULER] ⏭️  Email for "${payment.label}" already sent today`);
                        continue;
                    }
                    
                    // Send email
                    await sendPaymentOverdueEmail(
                        clientEmail,
                        clientName,
                        {
                            label: payment.label,
                            amount: payment.amount,
                            dueDate: payment.dueDate,
                            note: payment.note
                        },
                        {
                            name: project.name,
                            latePaymentPolicy: project.latePaymentPolicy
                        }
                    );
                    
                    // Log activity
                    await Activity.create({
                        project: project._id,
                        user: project.createdBy,
                        userName: 'System',
                        action: `[AUTO SCHEDULER] sent overdue notice for "${payment.label}" (₹${payment.amount}) to ${clientName}`,
                        icon: '⏰',
                        type: 'payment'
                    });
                    
                    sentCount++;
                    console.log(`[SCHEDULER] ✅ Overdue email sent for "${payment.label}" (${payment.amount}) → ${clientEmail}`);
                } catch (err) {
                    console.error(`[SCHEDULER] ❌ Error processing payment "${payment.label}":`, err.message);
                }
            }
            
            console.log(`[SCHEDULER] 📧 Overdue checker complete - ${sentCount} email(s) sent`);
            return { checked: overduePayments.length, sent: sentCount };
        } catch (err) {
            console.error('[SCHEDULER] checkAndEmailOverduePayments error:', err.message);
            return { error: err.message };
        }
    }
}

module.exports = AutomationEngine;
