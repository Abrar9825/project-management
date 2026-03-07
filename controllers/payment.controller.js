const { ClientPayment, DeveloperPayment } = require('../models/Payment.model');
const Project = require('../models/Project.model');
const { Activity } = require('../models/Activity.model');
const { sendPaymentOverdueEmail } = require('../services/emailService');

// ==================== CLIENT PAYMENTS ====================

// @desc    Generate payment schedule for existing project
// @route   POST /api/payments/client/generate/:projectId
// @access  Private/Admin
exports.generatePaymentSchedule = async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

        // Check if payments already exist
        const existing = await ClientPayment.find({ project: project._id });
        if (existing.length > 0) {
            return res.status(400).json({ success: false, error: 'Payment records already exist for this project. Delete them first to regenerate.' });
        }

        const totalAmount = project.totalAmount || 0;
        if (totalAmount <= 0) {
            return res.status(400).json({ success: false, error: 'Project has no totalAmount set. Update the project first.' });
        }

        const advPct = project.advancePercent || 25;
        const numMilestones = project.milestones || 3;
        const advanceAmount = Math.round(totalAmount * advPct / 100);
        const remaining = totalAmount - advanceAmount;
        const milestoneAmount = Math.round(remaining / numMilestones);

        // Auto-calculate due dates based on payment terms (default 15 days after each milestone)
        const paymentTermsDaysAfter = 15; // Default: payments due 15 days after milestone start
        let paymentIndex = 0;

        const paymentRecords = [];
        
        // ===== ADVANCE PAYMENT - Due immediately (today or next day) =====
        const advanceDueDate = new Date();
        advanceDueDate.setDate(advanceDueDate.getDate() + 1);
        paymentRecords.push({
            project: project._id,
            projectName: project.name,
            label: 'Advance Payment',
            amount: advanceAmount,
            status: 'pending',
            dueDate: advanceDueDate,
            createdBy: req.user.id
        });

        // ===== MILESTONE PAYMENTS - Spaced evenly across project timeline =====
        const milestoneLabels = ['1st Milestone', '2nd Milestone', '3rd Milestone', '4th Milestone', '5th Milestone'];
        const projectDuration = project.dueDate ? Math.ceil((new Date(project.dueDate) - new Date(project.startDate || Date.now())) / (1000 * 60 * 60 * 24)) : 90;
        const daysPerMilestone = Math.ceil(projectDuration / numMilestones);

        for (let i = 0; i < numMilestones; i++) {
            const isLast = (i === numMilestones - 1);
            const amt = isLast ? (remaining - milestoneAmount * (numMilestones - 1)) : milestoneAmount;
            
            // Calculate due date: milestone start + 15 days
            const milestoneDueDate = new Date();
            milestoneDueDate.setDate(milestoneDueDate.getDate() + daysPerMilestone * (i + 1) + paymentTermsDaysAfter);

            paymentRecords.push({
                project: project._id,
                projectName: project.name,
                label: milestoneLabels[i] || 'Final Payment',
                amount: amt,
                status: 'pending',
                dueDate: milestoneDueDate,
                createdBy: req.user.id
            });
        }

        const payments = await ClientPayment.insertMany(paymentRecords);

        await Activity.create({
            project: project._id,
            user: req.user.id,
            userName: req.user.name,
            action: `generated payment schedule with auto due-dates (${payments.length} payments, total ₹${totalAmount})`,
            icon: '💳',
            type: 'payment'
        });

        res.status(201).json({ success: true, data: payments });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Get all client payments for a project
// @route   GET /api/payments/client/:projectId
// @access  Private/Admin
exports.getClientPayments = async (req, res) => {
    try {
        const payments = await ClientPayment.find({ project: req.params.projectId })
            .populate('receivedBy', 'name')
            .sort({ createdAt: -1 });

        const total = payments.reduce((sum, p) => sum + (p.status === 'received' ? p.amount : 0), 0);

        res.status(200).json({
            success: true,
            count: payments.length,
            total,
            data: payments
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Add client payment
// @route   POST /api/payments/client
// @access  Private/Admin
exports.addClientPayment = async (req, res) => {
    try {
        const { project, label, amount, date, dueDate, note } = req.body;

        // Get project details
        const projectDoc = await Project.findById(project);
        if (!projectDoc) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        const payment = await ClientPayment.create({
            project,
            projectName: projectDoc.name,
            label,
            amount,
            date: date || new Date(),
            dueDate: dueDate || null,
            status: 'received',
            note,
            receivedBy: req.user.id,
            createdBy: req.user.id
        });

        // Log activity
        await Activity.create({
            project,
            user: req.user.id,
            userName: req.user.name,
            action: `received ${label} of $${amount}`,
            icon: '💰',
            type: 'payment'
        });

        res.status(201).json({
            success: true,
            data: payment
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Update client payment status
// @route   PUT /api/payments/client/:id
// @access  Private/Admin
exports.updateClientPayment = async (req, res) => {
    try {
        let payment = await ClientPayment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({
                success: false,
                error: 'Payment not found'
            });
        }

        payment = await ClientPayment.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: payment
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Send payment overdue notice email to client
// @route   POST /api/payments/client/:id/overdue-notice
// @access  Private/Admin
exports.sendOverdueNotice = async (req, res) => {
    try {
        const payment = await ClientPayment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ success: false, error: 'Payment not found' });
        }

        const project = await Project.findById(payment.project);
        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        const clientEmail = project.clientAccess?.clientEmail;
        if (!clientEmail) {
            return res.status(400).json({ success: false, error: 'No client email found for this project. Please set it in project settings.' });
        }

        const clientName = project.clientAccess?.clientName || project.client;

        await sendPaymentOverdueEmail(
            clientEmail,
            clientName,
            {
                label: payment.label,
                amount: payment.amount,
                dueDate: req.body.dueDate || payment.dueDate || null,
                note: payment.note
            },
            {
                name: project.name,
                latePaymentPolicy: project.latePaymentPolicy
            }
        );

        // Log activity
        await Activity.create({
            project: payment.project,
            user: req.user.id,
            userName: req.user.name,
            action: `sent payment overdue notice to client for "${payment.label}" (₹${payment.amount})`,
            icon: '⚠️',
            type: 'payment'
        });

        res.status(200).json({ success: true, message: `Overdue notice sent to ${clientEmail}` });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Delete client payment
// @route   DELETE /api/payments/client/:id
// @access  Private/Admin
exports.deleteClientPayment = async (req, res) => {
    try {
        const payment = await ClientPayment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({
                success: false,
                error: 'Payment not found'
            });
        }

        await payment.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// ==================== DEVELOPER PAYMENTS ====================

// @desc    Get all developer payments for a project
// @route   GET /api/payments/developer/project/:projectId
// @access  Private/Admin
exports.getDeveloperPaymentsByProject = async (req, res) => {
    try {
        const payments = await DeveloperPayment.find({ project: req.params.projectId })
            .populate('developer', 'name email')
            .sort({ date: -1 });

        const total = payments.reduce((sum, p) => sum + p.amount, 0);

        res.status(200).json({
            success: true,
            count: payments.length,
            total,
            data: payments
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Get my payments (for developers)
// @route   GET /api/payments/developer/my
// @access  Private
exports.getMyPayments = async (req, res) => {
    try {
        const payments = await DeveloperPayment.find({ developer: req.user.id })
            .populate('project', 'name client')
            .sort({ date: -1 });

        const total = payments.reduce((sum, p) => sum + p.amount, 0);

        res.status(200).json({
            success: true,
            count: payments.length,
            total,
            data: payments
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Add developer payment
// @route   POST /api/payments/developer
// @access  Private/Admin
exports.addDeveloperPayment = async (req, res) => {
    try {
        const { project, developer, role, amount, date, note } = req.body;

        // Get project details
        const projectDoc = await Project.findById(project);
        if (!projectDoc) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        // Get developer details
        const User = require('../models/User.model');
        const developerDoc = await User.findById(developer);
        if (!developerDoc) {
            return res.status(404).json({
                success: false,
                error: 'Developer not found'
            });
        }

        const payment = await DeveloperPayment.create({
            project,
            projectName: projectDoc.name,
            developer,
            developerName: developerDoc.name,
            role,
            amount,
            date: date || new Date(),
            note,
            status: 'paid',
            createdBy: req.user.id
        });

        // Log activity
        await Activity.create({
            project,
            user: req.user.id,
            userName: req.user.name,
            action: `paid $${amount} to ${developerDoc.name}`,
            icon: '💵',
            type: 'payment'
        });

        res.status(201).json({
            success: true,
            data: payment
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Update developer payment
// @route   PUT /api/payments/developer/:id
// @access  Private/Admin
exports.updateDeveloperPayment = async (req, res) => {
    try {
        let payment = await DeveloperPayment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({
                success: false,
                error: 'Payment not found'
            });
        }

        payment = await DeveloperPayment.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: payment
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Delete developer payment
// @route   DELETE /api/payments/developer/:id
// @access  Private/Admin
exports.deleteDeveloperPayment = async (req, res) => {
    try {
        const payment = await DeveloperPayment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({
                success: false,
                error: 'Payment not found'
            });
        }

        await payment.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Get payment stats for a developer
// @route   GET /api/payments/developer/:developerId/stats
// @access  Private
exports.getDeveloperPaymentStats = async (req, res) => {
    try {
        const developerId = req.params.developerId || req.user.id;

        // Check authorization
        if (req.user.role === 'developer' && developerId !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized'
            });
        }

        const payments = await DeveloperPayment.find({ developer: developerId });

        const total = payments.reduce((sum, p) => sum + p.amount, 0);

        // Group by project
        const byProject = {};
        payments.forEach(p => {
            if (!byProject[p.projectName]) {
                byProject[p.projectName] = 0;
            }
            byProject[p.projectName] += p.amount;
        });

        res.status(200).json({
            success: true,
            data: {
                total,
                count: payments.length,
                byProject
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};
