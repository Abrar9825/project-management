const nodemailer = require('nodemailer');

// Create transporter with Gmail credentials
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'abrarshaikh.imscit21@gmail.com',
        pass: process.env.EMAIL_PASS || 'reha evqo ququ ziwq'
    }
});

// Verify connection on startup
transporter.verify().then(() => {
    console.log('✅ Email service ready');
}).catch(err => {
    console.log('⚠️ Email service not available:', err.message);
});

// Base URL for links in emails
const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:5000';

// ======================== EMAIL TEMPLATES ========================

function getBaseStyles() {
    return `
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f0f4f8; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 40%, #3b7daa 70%, #4a9fd4 100%); padding: 32px 24px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 1px; }
        .header p { color: rgba(255,255,255,0.7); margin: 6px 0 0; font-size: 13px; }
        .body { padding: 32px 24px; }
        .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 16px 0; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .info-row:last-child { border-bottom: none; }
        .info-label { color: #64748b; font-weight: 500; }
        .info-value { color: #1e293b; font-weight: 600; }
        .btn { display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #1e3a5f, #3b7daa); color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px; margin: 16px 0; }
        .btn:hover { opacity: 0.9; }
        .priority-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
        .priority-low { background: #dcfce7; color: #166534; }
        .priority-medium { background: #fef9c3; color: #854d0e; }
        .priority-high { background: #fee2e2; color: #991b1b; }
        .priority-critical { background: #fecaca; color: #7f1d1d; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; }
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-approved { background: #d1fae5; color: #065f46; }
        .status-draft { background: #e0e7ff; color: #3730a3; }
        .status-final { background: #dbeafe; color: #1e40af; }
        .status-sent { background: #ccfbf1; color: #115e59; }
        .footer { background: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer p { color: #94a3b8; font-size: 12px; margin: 4px 0; }
        .footer a { color: #3b82f6; text-decoration: none; }
    `;
}

function wrapEmail(title, subtitle, bodyContent) {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>${getBaseStyles()}</style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>${title}</h1>
        <p>${subtitle}</p>
    </div>
    <div class="body">
        ${bodyContent}
    </div>
    <div class="footer">
        <p>This is an automated notification from <strong>Project Management System</strong></p>
        <p><a href="${BASE_URL}">Open Dashboard</a></p>
    </div>
</div>
</body>
</html>`;
}

// ======================== SEND FUNCTIONS ========================

/**
 * Send email when a task is assigned to a developer
 */
async function sendTaskAssignedEmail(assigneeEmail, assigneeName, taskData) {
    try {
        const priorityClass = `priority-${taskData.priority || 'medium'}`;
        const deadlineStr = taskData.deadline ? new Date(taskData.deadline).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Not set';

        const body = `
            <p style="font-size:15px;color:#334155;">Hi <strong>${assigneeName}</strong>,</p>
            <p style="font-size:14px;color:#475569;">A new task has been assigned to you. Please review the details below:</p>
            
            <div class="info-card">
                <div class="info-row"><span class="info-label">Task</span><span class="info-value">${taskData.title}</span></div>
                <div class="info-row"><span class="info-label">Project</span><span class="info-value">${taskData.projectName}</span></div>
                <div class="info-row"><span class="info-label">Role</span><span class="info-value">${taskData.role}</span></div>
                <div class="info-row"><span class="info-label">Priority</span><span class="info-value"><span class="${priorityClass}">${(taskData.priority || 'medium').toUpperCase()}</span></span></div>
                <div class="info-row"><span class="info-label">Deadline</span><span class="info-value">${deadlineStr}</span></div>
                ${taskData.stageName ? `<div class="info-row"><span class="info-label">Stage</span><span class="info-value">${taskData.stageName}</span></div>` : ''}
                ${taskData.description ? `<div class="info-row"><span class="info-label">Description</span><span class="info-value">${taskData.description}</span></div>` : ''}
            </div>
            
            <div style="text-align:center;">
                <a href="${BASE_URL}/my-work" class="btn">View My Tasks</a>
            </div>
            
            <p style="font-size:13px;color:#94a3b8;margin-top:24px;">Please start working on this task before the deadline. If you have any questions, contact your project manager.</p>
        `;

        await transporter.sendMail({
            from: `"Project Management" <${process.env.EMAIL_USER || 'abrarshaikh.imscit21@gmail.com'}>`,
            to: assigneeEmail,
            subject: `📋 New Task Assigned: ${taskData.title} — ${taskData.projectName}`,
            html: wrapEmail('New Task Assigned', 'You have a new task to work on', body)
        });

        console.log(`📧 Task assignment email sent to ${assigneeEmail}`);
        return true;
    } catch (err) {
        console.error('❌ Email send failed (task):', err.message);
        return false;
    }
}

/**
 * Send email when a document is shared
 */
async function sendDocumentSharedEmail(recipientEmail, recipientName, docData) {
    try {
        const statusClass = `status-${docData.status || 'draft'}`;
        const createdDate = docData.createdAt ? new Date(docData.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Today';

        const body = `
            <p style="font-size:15px;color:#334155;">Hi <strong>${recipientName}</strong>,</p>
            <p style="font-size:14px;color:#475569;">A document has been shared with you. Please review it at your earliest convenience.</p>
            
            <div class="info-card">
                <div class="info-row"><span class="info-label">Document</span><span class="info-value">${docData.title}</span></div>
                <div class="info-row"><span class="info-label">Type</span><span class="info-value">${(docData.type || '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span></div>
                <div class="info-row"><span class="info-label">Project</span><span class="info-value">${docData.projectName}</span></div>
                <div class="info-row"><span class="info-label">Status</span><span class="info-value"><span class="${statusClass}">${(docData.status || 'draft').toUpperCase()}</span></span></div>
                <div class="info-row"><span class="info-label">Created</span><span class="info-value">${createdDate}</span></div>
                ${docData.sharedBy ? `<div class="info-row"><span class="info-label">Shared By</span><span class="info-value">${docData.sharedBy}</span></div>` : ''}
            </div>
            
            <div style="text-align:center;">
                <a href="${BASE_URL}/documents" class="btn">View Document</a>
            </div>
            
            <p style="font-size:13px;color:#94a3b8;margin-top:24px;">Click the button above to view and download the document from the dashboard.</p>
        `;

        await transporter.sendMail({
            from: `"Project Management" <${process.env.EMAIL_USER || 'abrarshaikh.imscit21@gmail.com'}>`,
            to: recipientEmail,
            subject: `📄 Document Shared: ${docData.title} — ${docData.projectName}`,
            html: wrapEmail('Document Shared With You', 'A new document is available for review', body)
        });

        console.log(`📧 Document share email sent to ${recipientEmail}`);
        return true;
    } catch (err) {
        console.error('❌ Email send failed (document):', err.message);
        return false;
    }
}

/**
 * Send a generic notification email
 */
async function sendNotificationEmail(recipientEmail, recipientName, notifData) {
    try {
        const body = `
            <p style="font-size:15px;color:#334155;">Hi <strong>${recipientName}</strong>,</p>
            <p style="font-size:14px;color:#475569;">${notifData.message}</p>
            
            ${notifData.details ? `
            <div class="info-card">
                ${Object.entries(notifData.details).map(([key, val]) => 
                    `<div class="info-row"><span class="info-label">${key}</span><span class="info-value">${val}</span></div>`
                ).join('')}
            </div>` : ''}
            
            ${notifData.link ? `
            <div style="text-align:center;">
                <a href="${notifData.link}" class="btn">${notifData.linkText || 'View Details'}</a>
            </div>` : ''}
        `;

        await transporter.sendMail({
            from: `"Project Management" <${process.env.EMAIL_USER || 'abrarshaikh.imscit21@gmail.com'}>`,
            to: recipientEmail,
            subject: notifData.subject || 'Notification — Project Management',
            html: wrapEmail(notifData.title || 'Notification', notifData.subtitle || '', body)
        });

        console.log(`📧 Notification email sent to ${recipientEmail}`);
        return true;
    } catch (err) {
        console.error('❌ Email send failed (notification):', err.message);
        return false;
    }
}

/**
 * Send email to client when a new project is created
 */
async function sendProjectCreatedEmail(clientEmail, clientName, projectData) {
    try {
        const startDate = projectData.startDate ? new Date(projectData.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'To be confirmed';
        const dueDate = projectData.dueDate ? new Date(projectData.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'To be confirmed';
        const priorityClass = `priority-${projectData.priority || 'medium'}`;

        const body = `
            <p style="font-size:15px;color:#334155;">Hi <strong>${clientName}</strong>,</p>
            <p style="font-size:14px;color:#475569;">We're excited to let you know that your project has been created and our team is getting started! Here are the details:</p>
            
            <div class="info-card">
                <div class="info-row"><span class="info-label">Project</span><span class="info-value">${projectData.name}</span></div>
                <div class="info-row"><span class="info-label">Type</span><span class="info-value">${(projectData.type || '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span></div>
                <div class="info-row"><span class="info-label">Priority</span><span class="info-value"><span class="${priorityClass}">${(projectData.priority || 'medium').toUpperCase()}</span></span></div>
                <div class="info-row"><span class="info-label">Start Date</span><span class="info-value">${startDate}</span></div>
                <div class="info-row"><span class="info-label">Due Date</span><span class="info-value">${dueDate}</span></div>
                ${projectData.totalAmount ? `<div class="info-row"><span class="info-label">Total Amount</span><span class="info-value">₹ ${projectData.totalAmount.toLocaleString()}</span></div>` : ''}
            </div>
            
            ${projectData.description ? `<p style="font-size:14px;color:#475569;margin-top:16px;"><strong>Description:</strong> ${projectData.description}</p>` : ''}
            
            <div style="text-align:center;margin-top:24px;">
                <a href="${BASE_URL}" class="btn">View Dashboard</a>
            </div>
            
            <p style="font-size:13px;color:#94a3b8;margin-top:24px;">We'll keep you updated on the progress. If you have any questions, feel free to reach out to us.</p>
        `;

        await transporter.sendMail({
            from: `"Project Management" <${process.env.EMAIL_USER || 'abrarshaikh.imscit21@gmail.com'}>`,
            to: clientEmail,
            subject: `🚀 Project Created: ${projectData.name}`,
            html: wrapEmail('Project Created Successfully', 'Your project is now live', body)
        });

        console.log(`📧 Project created email sent to ${clientEmail}`);
        return true;
    } catch (err) {
        console.error('❌ Email send failed (project created):', err.message);
        return false;
    }
}

// ======================== CLIENT TASK EMAIL ========================

/**
 * Send email when a client task is assigned (both directions)
 * direction: 'admin-to-client' | 'client-to-admin'
 */
async function sendClientTaskEmail(recipientEmail, recipientName, direction, taskData, projectData) {
    try {
        const isAdminToClient = direction === 'admin-to-client';
        const phaseColor = {
            'Requirement': '#6366f1', 'Design': '#ec4899', 'Frontend': '#3b82f6',
            'Backend': '#10b981', 'QA': '#f59e0b', 'Hosting': '#8b5cf6', 'Delivery': '#14b8a6'
        }[taskData.phase] || '#3b7daa';

        const title = isAdminToClient
            ? 'New Task Assigned to You'
            : '📬 Client Submitted a New Task';
        const subtitle = isAdminToClient
            ? 'Your project team has assigned you a task'
            : `${taskData.assignedByName || 'Client'} has created a task that needs your attention`;

        const body = `
            <p style="font-size:15px;color:#334155;margin:0 0 6px;">Hi <strong>${recipientName}</strong>,</p>
            <p style="font-size:14px;color:#475569;margin:0 0 20px;">
                ${isAdminToClient
                    ? 'A task has been assigned to you by your project team. Please review the details and complete it at your earliest convenience.'
                    : `<strong>${taskData.assignedByName || 'The client'}</strong> has submitted a new task for your project. Please review and take action.`
                }
            </p>

            <div style="background:linear-gradient(135deg,${phaseColor}15,${phaseColor}05);border:1.5px solid ${phaseColor}40;border-left:4px solid ${phaseColor};border-radius:12px;padding:20px;margin:0 0 20px;">
                <div style="display:flex;align-items:center;margin-bottom:14px;">
                    <span style="background:${phaseColor};color:#fff;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:4px 12px;border-radius:20px;">${taskData.phase || 'General'}</span>
                </div>
                <p style="font-size:15px;font-weight:600;color:#1e293b;margin:0 0 16px;line-height:1.5;">${taskData.description}</p>
                <table style="width:100%;border-collapse:collapse;">
                    <tr>
                        <td style="padding:7px 0;border-bottom:1px solid ${phaseColor}20;font-size:13px;color:#64748b;font-weight:500;width:40%;">Project</td>
                        <td style="padding:7px 0;border-bottom:1px solid ${phaseColor}20;font-size:13px;color:#1e293b;font-weight:600;">${projectData.name}</td>
                    </tr>
                    <tr>
                        <td style="padding:7px 0;border-bottom:1px solid ${phaseColor}20;font-size:13px;color:#64748b;font-weight:500;">Phase</td>
                        <td style="padding:7px 0;border-bottom:1px solid ${phaseColor}20;font-size:13px;color:#1e293b;font-weight:600;">${taskData.phase}</td>
                    </tr>
                    <tr>
                        <td style="padding:7px 0;font-size:13px;color:#64748b;font-weight:500;">${isAdminToClient ? 'Assigned By' : 'Submitted By'}</td>
                        <td style="padding:7px 0;font-size:13px;color:#1e293b;font-weight:600;">${isAdminToClient ? (taskData.adminName || 'Project Team') : (taskData.assignedByName || 'Client')}</td>
                    </tr>
                </table>
            </div>

            <div style="text-align:center;margin:24px 0;">
                <a href="${BASE_URL}/${isAdminToClient ? 'client-portal' : 'project-detail/' + projectData.id}" 
                   style="display:inline-block;padding:13px 32px;background:linear-gradient(135deg,#1e3a5f,#3b7daa);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;letter-spacing:0.3px;">
                    ${isAdminToClient ? 'View Task in Client Portal' : 'View in Dashboard'}
                </a>
            </div>

            <p style="font-size:12px;color:#94a3b8;margin:20px 0 0;text-align:center;">
                ${isAdminToClient
                    ? 'Please log into the client portal to review and update the task status.'
                    : 'Please log into the dashboard to review and act on this task.'}
            </p>
        `;

        await transporter.sendMail({
            from: `"Project Management" <${process.env.EMAIL_USER || 'abrarshaikh.imscit21@gmail.com'}>`,
            to: recipientEmail,
            subject: isAdminToClient
                ? `📋 New Task for You — ${projectData.name} (${taskData.phase})`
                : `📬 Client Task Submitted — ${projectData.name} (${taskData.phase})`,
            html: wrapEmail(title, subtitle, body)
        });

        console.log(`📧 Client task email sent to ${recipientEmail} [${direction}]`);
        return true;
    } catch (err) {
        console.error('❌ Email send failed (client-task):', err.message);
        return false;
    }
}

// ======================== STAGE COMPLETION EMAIL ========================

/**
 * Send email to client when a project stage is completed
 */
async function sendStageCompletionEmail(clientEmail, clientName, stageData, projectData) {
    try {
        const stageIcons = {
            'Requirement': '📋', 'Design': '🎨', 'Frontend': '💻',
            'Backend': '⚙️', 'QA Testing': '🔍', 'Hosting & Deployment': '☁️', 'Delivery': '🚀'
        };
        const icon = stageData.icon || stageIcons[stageData.name] || '✅';
        const progressMap = {
            'Requirement': 14, 'Design': 28, 'Frontend': 43, 'Backend': 57,
            'QA Testing': 71, 'Hosting & Deployment': 86, 'Delivery': 100
        };
        const progress = progressMap[stageData.name] || 50;
        const completedDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

        const body = `
            <p style="font-size:15px;color:#334155;margin:0 0 6px;">Hi <strong>${clientName}</strong>,</p>
            <p style="font-size:14px;color:#475569;margin:0 0 24px;">
                Great news! We've completed another milestone on your project. Here's a summary of what was accomplished:
            </p>

            <!-- Stage Completion Banner -->
            <div style="background:linear-gradient(135deg,#0f7b0f15,#16a34a08);border:1.5px solid #16a34a40;border-radius:14px;padding:24px;margin:0 0 20px;text-align:center;">
                <div style="font-size:40px;margin-bottom:10px;">${icon}</div>
                <h2 style="font-size:22px;font-weight:800;color:#166534;margin:0 0 6px;">${stageData.name}</h2>
                <p style="font-size:13px;color:#166534;margin:0;">
                    <span style="background:#bbf7d0;color:#166534;padding:3px 10px;border-radius:20px;font-weight:700;">✅ COMPLETED</span>
                </p>
                <p style="font-size:12px;color:#4ade80;margin:10px 0 0;">Completed on ${completedDate}</p>
            </div>

            <!-- Project Progress Bar -->
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:0 0 20px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                    <span style="font-size:13px;color:#64748b;font-weight:500;">Project Progress</span>
                    <span style="font-size:13px;color:#1e293b;font-weight:700;">${progress}%</span>
                </div>
                <div style="background:#e2e8f0;border-radius:999px;height:10px;overflow:hidden;">
                    <div style="background:linear-gradient(135deg,#16a34a,#4ade80);height:10px;width:${progress}%;border-radius:999px;"></div>
                </div>
                <p style="font-size:12px;color:#94a3b8;margin:10px 0 0;text-align:center;">
                    ${progress === 100 ? '🎉 Project is fully complete!' : `Your project is ${progress}% complete`}
                </p>
            </div>

            <!-- Project Info -->
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:0 0 24px;">
                <table style="width:100%;border-collapse:collapse;">
                    <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;font-weight:500;">Project</td>
                        <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#1e293b;font-weight:600;">${projectData.name}</td>
                    </tr>
                    <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;font-weight:500;">Stage Completed</td>
                        <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#1e293b;font-weight:600;">${stageData.name}</td>
                    </tr>
                    ${stageData.summary ? `
                    <tr>
                        <td style="padding:8px 0;font-size:13px;color:#64748b;font-weight:500;vertical-align:top;">Summary</td>
                        <td style="padding:8px 0;font-size:13px;color:#1e293b;">${stageData.summary}</td>
                    </tr>` : ''}
                </table>
            </div>

            <div style="text-align:center;margin:24px 0;">
                <a href="${BASE_URL}/client-portal"
                   style="display:inline-block;padding:13px 32px;background:linear-gradient(135deg,#166534,#16a34a);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">
                    View Project Progress
                </a>
            </div>

            <p style="font-size:12px;color:#94a3b8;text-align:center;margin-top:20px;">
                Our team is already working on the next phase. We'll keep you posted!
            </p>
        `;

        await transporter.sendMail({
            from: `"Project Management" <${process.env.EMAIL_USER || 'abrarshaikh.imscit21@gmail.com'}>`,
            to: clientEmail,
            subject: `✅ Stage Completed: ${stageData.name} — ${projectData.name}`,
            html: wrapEmail('Stage Completed! 🎉', `${stageData.name} phase is now complete`, body)
        });

        console.log(`📧 Stage completion email sent to ${clientEmail} for stage: ${stageData.name}`);
        return true;
    } catch (err) {
        console.error('❌ Email send failed (stage-completion):', err.message);
        return false;
    }
}

// ======================== PAYMENT OVERDUE EMAIL ========================

/**
 * Send payment overdue reminder email to client
 */
async function sendPaymentOverdueEmail(clientEmail, clientName, paymentData, projectData) {
    try {
        const amount = paymentData.amount ? `₹ ${Number(paymentData.amount).toLocaleString('en-IN')}` : 'N/A';
        const dueDateStr = paymentData.dueDate
            ? new Date(paymentData.dueDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
            : 'Past due';
        const daysOverdue = paymentData.dueDate
            ? Math.max(0, Math.floor((Date.now() - new Date(paymentData.dueDate)) / 86400000))
            : null;

        const body = `
            <p style="font-size:15px;color:#334155;margin:0 0 6px;">Hi <strong>${clientName}</strong>,</p>
            <p style="font-size:14px;color:#475569;margin:0 0 20px;">
                This is a friendly reminder that a payment for your project is currently overdue. Please review the details below and complete the payment at the earliest to avoid any project delays.
            </p>

            <!-- Alert Banner -->
            <div style="background:linear-gradient(135deg,#fef2f2,#fee2e2);border:1.5px solid #fca5a5;border-left:5px solid #dc2626;border-radius:12px;padding:18px 20px;margin:0 0 20px;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <span style="font-size:24px;">⚠️</span>
                    <div>
                        <p style="font-size:15px;font-weight:700;color:#991b1b;margin:0 0 3px;">Payment Overdue</p>
                        <p style="font-size:13px;color:#b91c1c;margin:0;">
                            ${daysOverdue !== null && daysOverdue > 0 ? `This payment is <strong>${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue</strong>` : 'This payment is past its due date'}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Payment Details -->
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:0 0 20px;">
                <table style="width:100%;border-collapse:collapse;">
                    <tr>
                        <td style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;font-weight:500;width:45%;">Project</td>
                        <td style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#1e293b;font-weight:600;">${projectData.name}</td>
                    </tr>
                    <tr>
                        <td style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;font-weight:500;">Payment Label</td>
                        <td style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#1e293b;font-weight:600;">${paymentData.label || 'Payment'}</td>
                    </tr>
                    <tr>
                        <td style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;font-weight:500;">Amount Due</td>
                        <td style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:20px;color:#dc2626;font-weight:800;">${amount}</td>
                    </tr>
                    <tr>
                        <td style="padding:9px 0;font-size:13px;color:#64748b;font-weight:500;">Due Date</td>
                        <td style="padding:9px 0;font-size:13px;color:#dc2626;font-weight:600;">${dueDateStr}</td>
                    </tr>
                    ${paymentData.note ? `
                    <tr>
                        <td style="padding:9px 0;border-top:1px solid #f1f5f9;font-size:13px;color:#64748b;font-weight:500;vertical-align:top;">Note</td>
                        <td style="padding:9px 0;border-top:1px solid #f1f5f9;font-size:13px;color:#475569;">${paymentData.note}</td>
                    </tr>` : ''}
                </table>
            </div>

            <!-- Policy Notice -->
            ${projectData.latePaymentPolicy ? `
            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 16px;margin:0 0 20px;">
                <p style="font-size:12px;color:#92400e;margin:0;"><strong>⚖️ Late Payment Policy:</strong> ${projectData.latePaymentPolicy}</p>
            </div>` : ''}

            <div style="text-align:center;margin:24px 0;">
                <a href="${BASE_URL}/client-portal"
                   style="display:inline-block;padding:13px 32px;background:linear-gradient(135deg,#dc2626,#ef4444);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">
                    View Payment Details
                </a>
            </div>

            <p style="font-size:12px;color:#94a3b8;text-align:center;margin-top:20px;">
                If you've already made the payment, please ignore this email or contact us to confirm receipt.
            </p>
        `;

        await transporter.sendMail({
            from: `"Project Management" <${process.env.EMAIL_USER || 'abrarshaikh.imscit21@gmail.com'}>`,
            to: clientEmail,
            subject: `⚠️ Payment Overdue: ${paymentData.label || 'Payment'} — ${projectData.name}`,
            html: wrapEmail('Payment Overdue Reminder', 'Action required — please clear your pending payment', body)
        });

        console.log(`📧 Payment overdue email sent to ${clientEmail}`);
        return true;
    } catch (err) {
        console.error('❌ Email send failed (payment-overdue):', err.message);
        return false;
    }
}

// ======================== MEETING SCHEDULED EMAIL ========================

/**
 * Send meeting schedule email to attendees
 */
async function sendMeetingScheduledEmail(attendeeEmail, attendeeName, meetingData, isUpdate = false) {
    try {
        const meetingDate = meetingData.scheduledAt
            ? new Date(meetingData.scheduledAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
            : 'TBD';
        const meetingTime = meetingData.scheduledAt
            ? new Date(meetingData.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
            : 'TBD';
        const durationLabel = meetingData.duration
            ? (meetingData.duration >= 60 ? `${Math.floor(meetingData.duration / 60)}h ${meetingData.duration % 60 > 0 ? meetingData.duration % 60 + 'm' : ''}`.trim() : `${meetingData.duration}m`)
            : '30m';

        const typeIcons = {
            'google-meet': '🟢', 'zoom': '🔵', 'teams': '🟣',
            'phone-call': '📞', 'in-person': '🏢', 'other': '📅'
        };
        const typeLabel = {
            'google-meet': 'Google Meet', 'zoom': 'Zoom', 'teams': 'Microsoft Teams',
            'phone-call': 'Phone Call', 'in-person': 'In Person', 'other': 'Meeting'
        };
        const meetIcon = typeIcons[meetingData.type] || '📅';
        const meetTypeLabel = typeLabel[meetingData.type] || meetingData.type || 'Meeting';

        const title = isUpdate ? '📅 Meeting Rescheduled' : '📅 Meeting Scheduled';
        const subtitle = isUpdate
            ? `Your meeting has been updated — check the new details`
            : `A new meeting has been scheduled for your project`;

        const body = `
            <p style="font-size:15px;color:#334155;margin:0 0 6px;">Hi <strong>${attendeeName}</strong>,</p>
            <p style="font-size:14px;color:#475569;margin:0 0 20px;">
                ${isUpdate
                    ? `Your meeting "<strong>${meetingData.title}</strong>" has been updated. Please see the revised details below.`
                    : `You've been invited to a meeting for <strong>${meetingData.projectName}</strong>. Please save this to your calendar.`
                }
            </p>

            <!-- Meeting Card -->
            <div style="background:linear-gradient(135deg,#eff6ff,#dbeafe);border:1.5px solid #93c5fd;border-radius:14px;padding:24px;margin:0 0 20px;">
                <div style="text-align:center;margin-bottom:16px;">
                    <span style="font-size:36px;">${meetIcon}</span>
                    <h2 style="font-size:20px;font-weight:800;color:#1e3a5f;margin:8px 0 4px;">${meetingData.title}</h2>
                    <span style="background:#dbeafe;color:#1e40af;font-size:12px;font-weight:700;padding:3px 12px;border-radius:20px;">${meetTypeLabel}</span>
                </div>

                <!-- Date/Time Highlight -->
                <div style="display:flex;gap:12px;margin:16px 0;justify-content:center;flex-wrap:wrap;">
                    <div style="background:#fff;border:1px solid #bfdbfe;border-radius:10px;padding:14px 20px;text-align:center;min-width:120px;flex:1;">
                        <p style="font-size:11px;color:#3b82f6;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Date</p>
                        <p style="font-size:14px;font-weight:700;color:#1e293b;margin:0;">${meetingDate}</p>
                    </div>
                    <div style="background:#fff;border:1px solid #bfdbfe;border-radius:10px;padding:14px 20px;text-align:center;min-width:100px;flex:1;">
                        <p style="font-size:11px;color:#3b82f6;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Time</p>
                        <p style="font-size:18px;font-weight:800;color:#1e3a5f;margin:0;">${meetingTime}</p>
                    </div>
                    <div style="background:#fff;border:1px solid #bfdbfe;border-radius:10px;padding:14px 20px;text-align:center;min-width:80px;flex:1;">
                        <p style="font-size:11px;color:#3b82f6;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Duration</p>
                        <p style="font-size:14px;font-weight:700;color:#1e293b;margin:0;">${durationLabel}</p>
                    </div>
                </div>

                <table style="width:100%;border-collapse:collapse;">
                    <tr>
                        <td style="padding:8px 0;border-top:1px solid #bfdbfe;font-size:13px;color:#3b82f6;font-weight:600;width:40%;">Project</td>
                        <td style="padding:8px 0;border-top:1px solid #bfdbfe;font-size:13px;color:#1e293b;font-weight:600;">${meetingData.projectName}</td>
                    </tr>
                    ${meetingData.stage ? `
                    <tr>
                        <td style="padding:8px 0;border-top:1px solid #bfdbfe;font-size:13px;color:#3b82f6;font-weight:600;">Stage</td>
                        <td style="padding:8px 0;border-top:1px solid #bfdbfe;font-size:13px;color:#1e293b;font-weight:600;">${meetingData.stage}</td>
                    </tr>` : ''}
                    <tr>
                        <td style="padding:8px 0;border-top:1px solid #bfdbfe;font-size:13px;color:#3b82f6;font-weight:600;">Organized By</td>
                        <td style="padding:8px 0;border-top:1px solid #bfdbfe;font-size:13px;color:#1e293b;font-weight:600;">${meetingData.createdByName || 'Project Team'}</td>
                    </tr>
                </table>
            </div>

            ${meetingData.agenda ? `
            <!-- Agenda -->
            <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:16px;margin:0 0 20px;">
                <p style="font-size:13px;font-weight:700;color:#166534;margin:0 0 8px;">📋 Meeting Agenda</p>
                <p style="font-size:13px;color:#334155;margin:0;line-height:1.6;">${meetingData.agenda}</p>
            </div>` : ''}

            ${meetingData.meetingLink ? `
            <!-- Join Link -->
            <div style="text-align:center;margin:20px 0;">
                <a href="${meetingData.meetingLink}"
                   style="display:inline-block;padding:13px 36px;background:linear-gradient(135deg,#1e3a5f,#3b7daa);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">
                    ${meetIcon} Join Meeting
                </a>
                <p style="font-size:12px;color:#94a3b8;margin:10px 0 0;">
                    Or copy link: <a href="${meetingData.meetingLink}" style="color:#3b82f6;">${meetingData.meetingLink}</a>
                </p>
            </div>` : `
            <div style="text-align:center;margin:20px 0;">
                <a href="${BASE_URL}/project-detail/${meetingData.project || ''}"
                   style="display:inline-block;padding:13px 32px;background:linear-gradient(135deg,#1e3a5f,#3b7daa);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">
                    View Meeting Details
                </a>
            </div>`}

            <p style="font-size:12px;color:#94a3b8;text-align:center;margin-top:20px;">
                Please add this meeting to your calendar. For any changes, contact your project manager.
            </p>
        `;

        await transporter.sendMail({
            from: `"Project Management" <${process.env.EMAIL_USER || 'abrarshaikh.imscit21@gmail.com'}>`,
            to: attendeeEmail,
            subject: isUpdate
                ? `📅 Meeting Updated: ${meetingData.title} — ${meetingDate} at ${meetingTime}`
                : `📅 Meeting Scheduled: ${meetingData.title} — ${meetingDate} at ${meetingTime}`,
            html: wrapEmail(title, subtitle, body)
        });

        console.log(`📧 Meeting email sent to ${attendeeEmail} for: ${meetingData.title}`);
        return true;
    } catch (err) {
        console.error('❌ Email send failed (meeting):', err.message);
        return false;
    }
}

// ======================== ASSET REQUEST EMAIL ========================

/**
 * Send email to client when an asset request is created
 */
async function sendAssetRequestEmail(clientEmail, clientName, assetData, stageData, projectData) {
    try {
        const assetTypeLabel = (assetData.type || 'other').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const requestedDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

        const body = `
            <p style="font-size:15px;color:#334155;margin:0 0 6px;">Hi <strong>${clientName}</strong>,</p>
            <p style="font-size:14px;color:#475569;margin:0 0 20px;">
                We need your help! Please provide the following asset for the <strong>${stageData.name}</strong> stage of your project. This asset is important for us to proceed with the next phase.
            </p>

            <!-- Asset Request Card -->
            <div style="background:linear-gradient(135deg,#fef3c7,#fef9c3);border:1.5px solid #fcd34d;border-left:5px solid #f59e0b;border-radius:14px;padding:24px;margin:0 0 20px;">
                <div style="display:flex;align-items:flex-start;gap:12px;">
                    <span style="font-size:28px;">📎</span>
                    <div style="flex:1;">
                        <h2 style="font-size:18px;font-weight:800;color:#92400e;margin:0 0 8px;">${assetData.label}</h2>
                        <p style="font-size:13px;color:#b45309;margin:0;"><strong>Type:</strong> ${assetTypeLabel}</p>
                    </div>
                </div>

                <!-- Asset Details -->
                <table style="width:100%;border-collapse:collapse;margin-top:16px;">
                    <tr>
                        <td style="padding:8px 0;border-top:1px solid #fcd34d;font-size:13px;color:#92400e;font-weight:600;width:35%;">Project</td>
                        <td style="padding:8px 0;border-top:1px solid #fcd34d;font-size:13px;color:#78350f;font-weight:600;">${projectData.name}</td>
                    </tr>
                    <tr>
                        <td style="padding:8px 0;border-top:1px solid #fcd34d;font-size:13px;color:#92400e;font-weight:600;">Stage</td>
                        <td style="padding:8px 0;border-top:1px solid #fcd34d;font-size:13px;color:#78350f;font-weight:600;">${stageData.name}</td>
                    </tr>
                    <tr>
                        <td style="padding:8px 0;border-top:1px solid #fcd34d;font-size:13px;color:#92400e;font-weight:600;">Asset Type</td>
                        <td style="padding:8px 0;border-top:1px solid #fcd34d;font-size:13px;color:#78350f;font-weight:600;">${assetTypeLabel}</td>
                    </tr>
                    <tr>
                        <td style="padding:8px 0;border-top:1px solid #fcd34d;font-size:13px;color:#92400e;font-weight:600;">Requested On</td>
                        <td style="padding:8px 0;border-top:1px solid #fcd34d;font-size:13px;color:#78350f;font-weight:600;">${requestedDate}</td>
                    </tr>
                </table>

                ${assetData.note ? `
                <div style="margin-top:14px;padding-top:14px;border-top:1px solid #fcd34d;">
                    <p style="font-size:13px;color:#92400e;margin:0 0 6px;"><strong>📝 Instructions:</strong></p>
                    <p style="font-size:13px;color:#78350f;margin:0;line-height:1.6;">${assetData.note}</p>
                </div>` : ''}
            </div>

            <!-- How to Submit -->
            <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:16px;margin:0 0 20px;">
                <p style="font-size:13px;font-weight:700;color:#166534;margin:0 0 8px;">📤 How to Submit the Asset:</p>
                <ol style="font-size:13px;color:#334155;margin:0;padding-left:20px;line-height:1.8;">
                    <li>Log in to your Client Portal</li>
                    <li>Navigate to the <strong>${projectData.name}</strong> project</li>
                    <li>Go to the <strong>${stageData.name}</strong> stage</li>
                    <li>Find this asset request and upload the file</li>
                    <li>Click "Mark as Submitted"</li>
                </ol>
            </div>

            <div style="text-align:center;margin:24px 0;">
                <a href="${BASE_URL}/client-portal"
                   style="display:inline-block;padding:13px 32px;background:linear-gradient(135deg,#f59e0b,#f97316);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">
                    📝 Submit Asset in Portal
                </a>
            </div>

            <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:10px;padding:14px 16px;margin:0 0 20px;">
                <p style="font-size:12px;color:#92400e;margin:0;"><strong>⏰ Priority Note:</strong> Please submit this asset as soon as possible so we can continue with the project on schedule.</p>
            </div>

            <p style="font-size:12px;color:#94a3b8;text-align:center;margin-top:20px;">
                If you have any questions about this asset or need clarification, please reach out to us.
            </p>
        `;

        await transporter.sendMail({
            from: `"Project Management" <${process.env.EMAIL_USER || 'abrarshaikh.imscit21@gmail.com'}>`,
            to: clientEmail,
            subject: `📎 Asset Needed: ${assetData.label} — ${projectData.name}`,
            html: wrapEmail('Asset Request', `Please provide: ${assetData.label}`, body)
        });

        console.log(`📧 Asset request email sent to ${clientEmail} for: ${assetData.label}`);
        return true;
    } catch (err) {
        console.error('❌ Email send failed (asset-request):', err.message);
        return false;
    }
}

module.exports = {
    sendTaskAssignedEmail,
    sendDocumentSharedEmail,
    sendNotificationEmail,
    sendProjectCreatedEmail,
    sendClientTaskEmail,
    sendStageCompletionEmail,
    sendPaymentOverdueEmail,
    sendMeetingScheduledEmail,
    sendAssetRequestEmail,
    transporter
};
