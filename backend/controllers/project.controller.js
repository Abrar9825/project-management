const Project = require('../models/Project.model');
const { Activity, Remark } = require('../models/Activity.model');
const { ClientPayment } = require('../models/Payment.model');
const AutomationEngine = require('../services/automationEngine');

// Default stages template
const defaultStages = [
    { name: 'Requirement', status: 'pending', type: 'checklist', icon: '📋', order: 1, gradient: 'stage-gradient-1', items: [
        { text: 'Gather client requirements', done: false },
        { text: 'Create requirement document', done: false },
        { text: 'Get client approval', done: false },
        { text: 'Define technical specifications', done: false }
    ]},
    { name: 'Design', status: 'pending', type: 'checklist', icon: '🎨', order: 2, gradient: 'stage-gradient-2', items: [
        { text: 'Create wireframes', done: false },
        { text: 'Design UI mockups', done: false },
        { text: 'Create design system', done: false },
        { text: 'Get design approval', done: false }
    ]},
    { name: 'Frontend', status: 'pending', type: 'development', icon: '💻', order: 3, gradient: 'stage-gradient-3' },
    { name: 'Backend', status: 'pending', type: 'development', icon: '⚙️', order: 4, gradient: 'stage-gradient-4' },
    { name: 'QA Testing', status: 'pending', type: 'checklist', icon: '🔍', order: 5, gradient: 'stage-gradient-5', items: [
        { text: 'Create test cases', done: false },
        { text: 'Functional testing', done: false },
        { text: 'Performance testing', done: false },
        { text: 'Security testing', done: false },
        { text: 'UAT with client', done: false }
    ]},
    { name: 'Hosting & Deployment', status: 'pending', type: 'hosting', icon: '☁️', order: 6, gradient: 'stage-gradient-6' },
    { name: 'Delivery', status: 'pending', type: 'delivery', icon: '🚀', order: 7, gradient: 'stage-gradient-7', deliveries: [
        { name: 'Beta Release', approved: false },
        { name: 'Final Release', approved: false },
        { name: 'Production Deploy', approved: false }
    ]}
];

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private/Admin/SubAdmin
exports.getProjects = async (req, res) => {
    try {
        let query = {};

        // Filter by status
        if (req.query.status) {
            query.status = req.query.status;
        }

        // Filter by priority
        if (req.query.priority) {
            query.priority = req.query.priority;
        }

        // Search by name or client
        if (req.query.search) {
            query.$text = { $search: req.query.search };
        }

        const projects = await Project.find(query)
            .populate('team.user', 'name email')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: projects.length,
            data: projects
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('team.user', 'name email')
            .populate('stages.assigned', 'name email')
            .populate('createdBy', 'name');

        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        res.status(200).json({
            success: true,
            data: project
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Create project
// @route   POST /api/projects
// @access  Private/Admin
exports.createProject = async (req, res) => {
    try {
        const {
            name,
            client,
            type,
            priority,
            dueDate,
            team,
            totalAmount,
            advancePercent,
            milestones,
            description
        } = req.body;

        // Create project with default stages
        const project = await Project.create({
            name,
            client,
            type,
            priority,
            dueDate,
            team,
            totalAmount,
            advancePercent,
            milestones,
            description,
            stages: defaultStages,
            createdBy: req.user.id
        });

        // Auto-create client payment records based on totalAmount, advancePercent, milestones
        if (totalAmount && totalAmount > 0) {
            const advPct = advancePercent || 25;
            const numMilestones = milestones || 3;
            const advanceAmount = Math.round(totalAmount * advPct / 100);
            const remaining = totalAmount - advanceAmount;
            const milestoneAmount = Math.round(remaining / numMilestones);

            const paymentRecords = [];
            // Advance payment
            paymentRecords.push({
                project: project._id,
                projectName: project.name,
                label: 'Advance Payment',
                amount: advanceAmount,
                status: 'pending',
                createdBy: req.user.id
            });
            // Milestone payments
            const milestoneLabels = ['1st Milestone', '2nd Milestone', '3rd Milestone', '4th Milestone', '5th Milestone'];
            for (let i = 0; i < numMilestones; i++) {
                const isLast = (i === numMilestones - 1);
                const amt = isLast ? (remaining - milestoneAmount * (numMilestones - 1)) : milestoneAmount;
                paymentRecords.push({
                    project: project._id,
                    projectName: project.name,
                    label: milestoneLabels[i] || 'Final Payment',
                    amount: amt,
                    status: 'pending',
                    createdBy: req.user.id
                });
            }
            await ClientPayment.insertMany(paymentRecords);
        }

        // Log activity
        await Activity.create({
            project: project._id,
            user: req.user.id,
            userName: req.user.name,
            action: 'created the project',
            icon: '🚀',
            type: 'general'
        });

        res.status(201).json({
            success: true,
            data: project
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private/Admin
exports.updateProject = async (req, res) => {
    try {
        let project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        project = await Project.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        // Log activity
        await Activity.create({
            project: project._id,
            user: req.user.id,
            userName: req.user.name,
            action: 'updated project details',
            icon: '✏️',
            type: 'general'
        });

        res.status(200).json({
            success: true,
            data: project
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private/Admin
exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        await project.deleteOne();

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

// @desc    Update project stage
// @route   PUT /api/projects/:id/stages/:stageId
// @access  Private/Admin/SubAdmin
exports.updateStage = async (req, res) => {
    try {
        console.log('📍 updateStage called - ProjectID:', req.params.id, 'StageID:', req.params.stageId, 'Body:', req.body);
        const project = await Project.findById(req.params.id);

        if (!project) {
            console.log('❌ Project not found');
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        // Find stage by ID (handle both string and ObjectId formats)
        const stage = project.stages.find(s => {
            const match = s._id.toString() === req.params.stageId || s.id === req.params.stageId;
            if (match) console.log('✅ Stage found:', s.name, 'Current status:', s.status);
            return match;
        });

        if (!stage) {
            console.log('❌ Stage not found. Available stages:', project.stages.map(s => ({ name: s.name, id: s._id.toString() })));
            return res.status(404).json({
                success: false,
                error: 'Stage not found'
            });
        }

        // Update stage fields - use set() for proper Mongoose dirty tracking
        console.log('📝 Updating stage with:', req.body);
        const allowedFields = ['status', 'health', 'approved', 'repoUrl', 'liveUrl', 'linkedBackend', 'hostingProvider', 'domainUrl', 'sslStatus', 'summary', 'assigned', 'assignedName', 'deadline', 'deliveries', 'clientVisible', 'linkedPaymentMilestone'];
        for (const key of Object.keys(req.body)) {
            if (allowedFields.includes(key)) {
                stage[key] = req.body[key];
            }
        }
        project.markModified('stages');
        console.log('✏️ Stage after update:', { name: stage.name, status: stage.status, health: stage.health });

        // Update current stage if this is now in progress
        if (req.body.status === 'in-progress') {
            project.currentStage = stage.name;
        }

        await project.save();
        console.log('💾 Project saved successfully');

        // Log activity
        await Activity.create({
            project: project._id,
            user: req.user.id,
            userName: req.user.name,
            action: `updated ${stage.name} stage`,
            icon: '📋',
            type: 'stage'
        });

        console.log('✅ updateStage success - returning updated project');
        res.status(200).json({
            success: true,
            data: project
        });
    } catch (err) {
        console.error('❌ updateStage error:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Update stage checklist item
// @route   PUT /api/projects/:id/stages/:stageId/items/:itemId
// @access  Private/Admin/SubAdmin
exports.updateStageItem = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        // Find stage by ID (handle both string and ObjectId formats)
        const stage = project.stages.find(s => s._id.toString() === req.params.stageId || s.id === req.params.stageId);

        if (!stage || !stage.items) {
            return res.status(404).json({
                success: false,
                error: 'Stage or items not found'
            });
        }

        const item = stage.items.id(req.params.itemId);

        if (!item) {
            return res.status(404).json({
                success: false,
                error: 'Item not found'
            });
        }

        item.done = req.body.done;
        await project.save();

        res.status(200).json({
            success: true,
            data: project
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Add project activity
// @route   POST /api/projects/:id/activities
// @access  Private
exports.addActivity = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        const activity = await Activity.create({
            project: project._id,
            user: req.user.id,
            userName: req.user.name,
            action: req.body.action,
            icon: req.body.icon || '📌',
            type: req.body.type || 'general'
        });

        res.status(201).json({
            success: true,
            data: activity
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Get project activities
// @route   GET /api/projects/:id/activities
// @access  Private
exports.getActivities = async (req, res) => {
    try {
        const activities = await Activity.find({ project: req.params.id })
            .populate('user', 'name')
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json({
            success: true,
            count: activities.length,
            data: activities
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Add project remark
// @route   POST /api/projects/:id/remarks
// @access  Private
exports.addRemark = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        const remark = await Remark.create({
            project: project._id,
            user: req.user.id,
            userName: req.user.name,
            text: req.body.text
        });

        res.status(201).json({
            success: true,
            data: remark
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Get project remarks
// @route   GET /api/projects/:id/remarks
// @access  Private
exports.getRemarks = async (req, res) => {
    try {
        const remarks = await Remark.find({ project: req.params.id })
            .populate('user', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: remarks.length,
            data: remarks
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Get project stats
// @route   GET /api/projects/stats
// @access  Private/Admin
exports.getProjectStats = async (req, res) => {
    try {
        const stats = await Project.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const formattedStats = {
            total: 0,
            success: 0,  // On Track
            warning: 0,  // At Risk
            danger: 0,   // Blocked
            info: 0      // In Progress
        };

        stats.forEach(stat => {
            formattedStats[stat._id] = stat.count;
            formattedStats.total += stat.count;
        });

        res.status(200).json({
            success: true,
            data: formattedStats
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// ==================== BLOCKER ENGINE ====================
// @desc    Compute blockers for all stages of a project
// @route   GET /api/projects/:id/blockers
// @access  Private
exports.computeBlockers = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

        const payments = await ClientPayment.find({ project: project._id });
        const pendingPayments = payments.filter(p => p.status === 'pending');

        const stageBlockers = [];

        for (const stage of project.stages) {
            const blockers = [];

            // Check payment pending
            if (stage.linkedPaymentMilestone) {
                const linkedPayment = payments.find(p => p.label === stage.linkedPaymentMilestone);
                if (linkedPayment && linkedPayment.status === 'pending') {
                    blockers.push({ type: 'payment-pending', label: `Payment "${stage.linkedPaymentMilestone}" is pending`, severity: 'blocked' });
                }
            }

            // Check client approval
            if (stage.type === 'checklist' && !stage.approved && stage.status !== 'pending') {
                const approvalItem = (stage.items || []).find(i => i.text && i.text.toLowerCase().includes('approval') && !i.done);
                if (approvalItem) {
                    blockers.push({ type: 'client-approval', label: 'Client approval is missing', severity: 'waiting' });
                }
            }

            // Check asset requests
            if (stage.assetRequests && stage.assetRequests.length > 0) {
                const pendingAssets = stage.assetRequests.filter(a => a.status === 'pending');
                if (pendingAssets.length > 0) {
                    blockers.push({ type: 'assets-missing', label: `${pendingAssets.length} requested asset(s) not received`, severity: 'waiting' });
                }
            }

            // Check repo URL for dev stages
            if (stage.type === 'development' && stage.status === 'in-progress' && !stage.repoUrl) {
                blockers.push({ type: 'repo-empty', label: 'Repository URL is empty', severity: 'info' });
            }

            // Update stage blockerReasons
            stage.blockerReasons = blockers;

            // Auto-update status based on blockers
            if (blockers.some(b => b.severity === 'blocked') && stage.status !== 'completed') {
                stage.status = 'blocked';
            } else if (blockers.some(b => b.severity === 'waiting') && stage.status !== 'completed') {
                stage.status = 'waiting-client';
            }

            stageBlockers.push({
                stageId: stage._id,
                stageName: stage.name,
                status: stage.status,
                blockers
            });
        }

        await project.save();

        res.status(200).json({ success: true, data: stageBlockers });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// ==================== APPROVAL WORKFLOW ====================
// @desc    Submit stage for approval
// @route   PUT /api/projects/:id/stages/:stageId/submit-approval
// @access  Private/SubAdmin+
exports.submitStageForApproval = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

        const stage = project.stages.find(s => s._id.toString() === req.params.stageId || s.id === req.params.stageId);
        if (!stage) return res.status(404).json({ success: false, error: 'Stage not found' });

        stage.approvalWorkflow = {
            submittedBy: req.user.id,
            submittedByName: req.user.name,
            submittedAt: new Date(),
            subadminReview: { status: 'pending' },
            adminApproval: { status: 'pending' }
        };

        await project.save();

        await Activity.create({
            project: project._id,
            user: req.user.id,
            userName: req.user.name,
            action: `submitted ${stage.name} Stage for approval`,
            icon: '📤',
            type: 'stage'
        });

        res.status(200).json({ success: true, data: project });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    SubAdmin review stage
// @route   PUT /api/projects/:id/stages/:stageId/subadmin-review
// @access  Private/SubAdmin+
exports.subadminReviewStage = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

        const stage = project.stages.find(s => s._id.toString() === req.params.stageId || s.id === req.params.stageId);
        if (!stage) return res.status(404).json({ success: false, error: 'Stage not found' });

        if (!stage.approvalWorkflow || !stage.approvalWorkflow.submittedAt) {
            return res.status(400).json({ success: false, error: 'Stage has not been submitted for approval' });
        }

        stage.approvalWorkflow.subadminReview = {
            status: req.body.status || 'approved',
            reviewedBy: req.user.id,
            reviewedByName: req.user.name,
            reviewedAt: new Date(),
            comment: req.body.comment || ''
        };

        await project.save();

        await Activity.create({
            project: project._id,
            user: req.user.id,
            userName: req.user.name,
            action: `${req.body.status || 'approved'} ${stage.name} Stage (SubAdmin review)`,
            icon: req.body.status === 'rejected' ? '❌' : '✅',
            type: 'stage'
        });

        res.status(200).json({ success: true, data: project });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Admin final approval
// @route   PUT /api/projects/:id/stages/:stageId/admin-approve
// @access  Private/Admin
exports.adminApproveStage = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

        const stage = project.stages.find(s => s._id.toString() === req.params.stageId || s.id === req.params.stageId);
        if (!stage) return res.status(404).json({ success: false, error: 'Stage not found' });

        if (!stage.approvalWorkflow || 
            !stage.approvalWorkflow.subadminReview || 
            stage.approvalWorkflow.subadminReview.status !== 'approved') {
            return res.status(400).json({ success: false, error: 'SubAdmin review must be approved first' });
        }

        stage.approvalWorkflow.adminApproval = {
            status: req.body.status || 'approved',
            approvedBy: req.user.id,
            approvedByName: req.user.name,
            approvedAt: new Date(),
            comment: req.body.comment || ''
        };

        if (req.body.status === 'approved' || !req.body.status) {
            stage.approved = true;
            stage.status = 'completed';

            // Auto-move to next stage
            const currentOrder = stage.order;
            const nextStage = project.stages.find(s => s.order === currentOrder + 1);
            if (nextStage && nextStage.status === 'pending') {
                nextStage.status = 'in-progress';
                project.currentStage = nextStage.name;
            }
        }

        await project.save();

        await Activity.create({
            project: project._id,
            user: req.user.id,
            userName: req.user.name,
            action: `${stage.name} Stage Approved by ${req.user.name} (Admin Final Approval)`,
            icon: '🏆',
            type: 'stage'
        });

        // AUTOMATION: Trigger stage approval automation
        if (req.body.status === 'approved' || !req.body.status) {
            await AutomationEngine.onStageApproved(project, stage, req.user);
        }

        res.status(200).json({ success: true, data: project });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// ==================== MAINTENANCE MODE ====================
// @desc    Enter maintenance mode
// @route   PUT /api/projects/:id/maintenance
// @access  Private/Admin
exports.enterMaintenanceMode = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

        // Check if Delivery stage is approved
        const deliveryStage = project.stages.find(s => s.name === 'Delivery');
        if (!deliveryStage || !deliveryStage.approved) {
            return res.status(400).json({ success: false, error: 'Delivery stage must be approved before entering maintenance mode' });
        }

        project.mode = 'maintenance';
        project.maintenanceStartedAt = new Date();
        project.maintenanceNotes = req.body.notes || '';
        project.currentStage = 'Maintenance';

        // Add maintenance stage if not exists
        const hasMaintenanceStage = project.stages.find(s => s.name === 'Maintenance');
        if (!hasMaintenanceStage) {
            project.stages.push({
                name: 'Maintenance',
                status: 'in-progress',
                type: 'maintenance',
                icon: '🔧',
                order: 8,
                gradient: 'stage-gradient-8'
            });
        }

        await project.save();

        await Activity.create({
            project: project._id,
            user: req.user.id,
            userName: req.user.name,
            action: 'Project entered Maintenance Mode',
            icon: '🔧',
            type: 'stage'
        });

        res.status(200).json({ success: true, data: project });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// ==================== PROJECT HEALTH ====================
// @desc    Calculate project health
// @route   GET /api/projects/:id/health
// @access  Private
exports.getProjectHealth = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

        const payments = await ClientPayment.find({ project: project._id });
        const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
        const receivedPayments = payments.filter(p => p.status === 'received').reduce((sum, p) => sum + p.amount, 0);
        const pendingPayments = payments.filter(p => p.status === 'pending');

        // Check for overdue payments
        const overduePayments = pendingPayments.filter(p => {
            if (!p.date) return false;
            return new Date(p.date) < new Date();
        });

        // Payment health
        let paymentHealth = 'healthy';
        if (overduePayments.length > 0) paymentHealth = 'danger';
        else if (receivedPayments < totalPayments * 0.5) paymentHealth = 'warning';

        // Client pending items
        let clientPending = 0;
        project.stages.forEach(stage => {
            if (stage.assetRequests) {
                clientPending += stage.assetRequests.filter(a => a.status === 'pending').length;
            }
            if (stage.type === 'checklist' && stage.items) {
                clientPending += stage.items.filter(i => !i.done && i.text && i.text.toLowerCase().includes('client')).length;
            }
        });

        // Developer assignment
        const assignedCount = project.team ? project.team.length : 0;
        let developerAssignment = 'none';
        if (assignedCount >= 3) developerAssignment = 'full';
        else if (assignedCount >= 1) developerAssignment = 'partial';

        // QA Status
        const qaStage = project.stages.find(s => s.name === 'QA Testing');
        let qaStatus = 'not-started';
        if (qaStage) {
            if (qaStage.status === 'completed') qaStatus = 'passed';
            else if (qaStage.status === 'in-progress') qaStatus = 'in-progress';
            else if (qaStage.health === 'danger') qaStatus = 'failed';
        }

        // Deadline risk
        let deadlineRisk = 'on-track';
        if (project.dueDate) {
            const daysLeft = Math.ceil((new Date(project.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
            if (daysLeft < 0) deadlineRisk = 'overdue';
            else if (daysLeft < 14 && project.progress < 70) deadlineRisk = 'at-risk';
        }

        // Overall score
        let score = 50;
        if (paymentHealth === 'healthy') score += 15; else if (paymentHealth === 'danger') score -= 15;
        if (clientPending === 0) score += 10; else score -= clientPending * 3;
        if (developerAssignment === 'full') score += 10;
        if (qaStatus === 'passed') score += 10;
        if (deadlineRisk === 'on-track') score += 10; else if (deadlineRisk === 'overdue') score -= 20;
        score = Math.max(0, Math.min(100, score));

        const health = {
            payment: paymentHealth,
            clientPending,
            developerAssignment,
            qaStatus,
            deadlineRisk,
            overallScore: score,
            // Extra details for display
            paymentDetails: { total: totalPayments, received: receivedPayments, overdue: overduePayments.length },
            overduePaymentsExist: overduePayments.length > 0
        };

        // Save health to project
        project.health = health;
        await project.save();

        // Auto-pause if overdue payments
        if (overduePayments.length > 0 && project.mode === 'active') {
            project.mode = 'paused';
            await project.save();
        }

        res.status(200).json({ success: true, data: health });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// ==================== ASSET REQUESTS ====================
// @desc    Add asset request to a stage
// @route   POST /api/projects/:id/stages/:stageId/asset-requests
// @access  Private/Admin/SubAdmin
exports.addAssetRequest = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

        const stage = project.stages.find(s => s._id.toString() === req.params.stageId || s.id === req.params.stageId);
        if (!stage) return res.status(404).json({ success: false, error: 'Stage not found' });

        const { label, type, note } = req.body;

        if (!stage.assetRequests) stage.assetRequests = [];
        stage.assetRequests.push({
            label: label || 'Client Asset',
            type: type || 'other',
            status: 'pending',
            note: note || '',
            requestedAt: new Date()
        });

        await project.save();

        await Activity.create({
            project: project._id,
            user: req.user.id,
            userName: req.user.name,
            action: `requested "${label}" from client for ${stage.name} stage`,
            icon: '📎',
            type: 'stage'
        });

        res.status(200).json({ success: true, data: project });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Update asset request status
// @route   PUT /api/projects/:id/stages/:stageId/asset-requests/:assetId
// @access  Private/Admin/SubAdmin
exports.updateAssetRequest = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

        const stage = project.stages.find(s => s._id.toString() === req.params.stageId || s.id === req.params.stageId);
        if (!stage) return res.status(404).json({ success: false, error: 'Stage not found' });

        const asset = stage.assetRequests ? stage.assetRequests.find(a => a._id.toString() === req.params.assetId || a.id === req.params.assetId) : null;
        if (!asset) return res.status(404).json({ success: false, error: 'Asset request not found' });

        // Handle file upload
        if (req.file) {
            asset.fileName = req.file.originalname;
            asset.fileUrl = '/uploads/' + req.file.filename;
            asset.status = 'received';
            asset.receivedAt = new Date();
        } else {
            Object.assign(asset, req.body);
        }

        if (req.body.status === 'received') {
            asset.receivedAt = new Date();

            // Auto-update corresponding checklist item
            if (stage.items) {
                const matchingItem = stage.items.find(i => 
                    i.text && i.text.toLowerCase().includes(asset.label.toLowerCase())
                );
                if (matchingItem) matchingItem.done = true;
            }
        }

        await project.save();

        await Activity.create({
            project: project._id,
            user: req.user.id,
            userName: req.user.name,
            action: `marked asset "${asset.label}" as ${req.body.status}`,
            icon: req.body.status === 'received' ? '✅' : '📎',
            type: 'stage'
        });

        res.status(200).json({ success: true, data: project });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Delete asset request from a stage
// @route   DELETE /api/projects/:id/stages/:stageId/asset-requests/:assetId
// @access  Private/Admin/SubAdmin
exports.deleteAssetRequest = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

        const stage = project.stages.find(s => s._id.toString() === req.params.stageId || s.id === req.params.stageId);
        if (!stage) return res.status(404).json({ success: false, error: 'Stage not found' });

        const assetIdx = stage.assetRequests ? stage.assetRequests.findIndex(a => a._id.toString() === req.params.assetId || a.id === req.params.assetId) : -1;
        if (assetIdx === -1) return res.status(404).json({ success: false, error: 'Asset request not found' });

        const removed = stage.assetRequests[assetIdx];

        // Delete uploaded file if exists
        if (removed.fileUrl) {
            const filePath = require('path').join(__dirname, '..', 'public', removed.fileUrl);
            const fs = require('fs');
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        stage.assetRequests.splice(assetIdx, 1);
        await project.save();

        await Activity.create({
            project: project._id,
            user: req.user.id,
            userName: req.user.name,
            action: `deleted asset request "${removed.label}" from ${stage.name}`,
            icon: '🗑️',
            type: 'stage'
        });

        res.status(200).json({ success: true, data: project });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// ==================== STAGE PDF DATA ====================
// @desc    Get stage data for PDF generation
// @route   GET /api/projects/:id/stages/:stageId/pdf-data
// @access  Private
exports.getStagePdfData = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id).populate('team.user', 'name email designation');
        if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

        const stage = project.stages.find(s => s._id.toString() === req.params.stageId || s.id === req.params.stageId);
        if (!stage) return res.status(404).json({ success: false, error: 'Stage not found' });

        const pdfType = req.query.type || 'technical'; // technical, client, handover

        const stageTeam = project.team.filter(m => {
            if (stage.assignedMembers && stage.assignedMembers.length > 0) {
                return stage.assignedMembers.some(am => String(am.user) === String(m.user._id || m.user));
            }
            return true;
        });

        let pdfData = {
            projectName: project.name,
            clientName: project.client,
            stageName: stage.name,
            stageStatus: stage.status,
            stageIcon: stage.icon,
            generatedAt: new Date().toISOString(),
            type: pdfType
        };

        if (pdfType === 'technical') {
            pdfData = {
                ...pdfData,
                team: stageTeam.map(m => ({ name: m.name, role: m.role })),
                deadline: stage.deadline,
                repoUrl: stage.repoUrl || 'N/A',
                liveUrl: stage.liveUrl || 'N/A',
                health: stage.health || 'pending',
                checklist: (stage.items || []).map(i => ({ text: i.text, done: i.done })),
                completionRate: stage.items && stage.items.length > 0 
                    ? Math.round(stage.items.filter(i => i.done).length / stage.items.length * 100) 
                    : 0,
                blockers: stage.blockerReasons || [],
                remarks: stage.summary || 'No remarks'
            };
        } else if (pdfType === 'client') {
            pdfData = {
                ...pdfData,
                progress: project.progress,
                deliverables: (stage.items || []).map(i => i.text),
                completedItems: (stage.items || []).filter(i => i.done).map(i => i.text),
                pendingFromClient: (stage.assetRequests || []).filter(a => a.status === 'pending').map(a => a.label)
            };
        } else if (pdfType === 'handover') {
            const hostingStage = project.stages.find(s => s.name === 'Hosting & Deployment');
            pdfData = {
                ...pdfData,
                hostingProvider: hostingStage ? hostingStage.hostingProvider : 'N/A',
                domain: hostingStage ? hostingStage.domainUrl : 'N/A',
                sslStatus: hostingStage ? hostingStage.sslStatus : 'N/A',
                repoLinks: project.stages.filter(s => s.repoUrl).map(s => ({ stage: s.name, url: s.repoUrl })),
                deploymentNotes: stage.summary || ''
            };
        }

        res.status(200).json({ success: true, data: pdfData });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// ==================== CLIENT SIDE VIEW ====================
// @desc    Get project data for client panel (limited)
// @route   GET /api/projects/:id/client-view
// @access  Private
exports.getClientView = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

        const payments = await ClientPayment.find({ project: project._id });
        const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
        const receivedPayments = payments.filter(p => p.status === 'received').reduce((sum, p) => sum + p.amount, 0);

        // Filter stages to only client-visible ones (show all if none explicitly set)
        let filteredStages = project.stages.filter(s => s.clientVisible);
        if (filteredStages.length === 0) filteredStages = project.stages; // fallback: show all
        const visibleStages = filteredStages
            .map(s => ({
                name: s.name,
                status: s.status,
                icon: s.icon,
                order: s.order,
                approved: s.approved,
                deadline: s.deadline,
                type: s.type || 'checklist',
                repoUrl: s.repoUrl || '',
                liveUrl: s.liveUrl || '',
                health: s.health || 'pending',
                hostingProvider: s.hostingProvider || '',
                domainUrl: s.domainUrl || '',
                sslStatus: s.sslStatus || 'pending',
                completionRate: s.items && s.items.length > 0 
                    ? Math.round(s.items.filter(i => i.done).length / s.items.length * 100) 
                    : s.status === 'completed' ? 100 : 0
            }));

        // Client deliverables tracker
        const pendingFromClient = [];
        const completedByClient = [];
        project.stages.forEach(stage => {
            (stage.assetRequests || []).forEach(asset => {
                if (asset.status === 'pending') pendingFromClient.push({ stageName: stage.name, stageId: stage._id, assetId: asset._id, label: asset.label, type: asset.type });
                else if (asset.status === 'received') completedByClient.push({ stageName: stage.name, label: asset.label, receivedAt: asset.receivedAt, fileName: asset.fileName || '', fileUrl: asset.fileUrl || '' });
            });
        });

        // Work blocker reasons
        const blockerReasons = [];
        project.stages.forEach(stage => {
            (stage.blockerReasons || []).forEach(b => {
                blockerReasons.push({ stageName: stage.name, ...b });
            });
        });

        // Overdue payment check
        const overduePayments = payments.filter(p => p.status === 'pending' && p.date && new Date(p.date) < new Date());

        const clientView = {
            projectName: project.name,
            client: project.client,
            progress: project.progress,
            mode: project.mode,
            currentStage: project.currentStage,
            dueDate: project.dueDate,
            phases: visibleStages,
            payments: {
                total: totalPayments,
                received: receivedPayments,
                pending: totalPayments - receivedPayments,
                isOverdue: overduePayments.length > 0,
                overdueCount: overduePayments.length,
                details: payments.map(p => ({ label: p.label, amount: p.amount, status: p.status, date: p.date }))
            },
            pendingFromClient,
            completedByClient,
            blockerReasons,
            isPaused: project.mode === 'paused'
        };

        res.status(200).json({ success: true, data: clientView });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// ==================== STAGE VISIBILITY TOGGLE ====================
// @desc    Toggle stage client visibility
// @route   PUT /api/projects/:id/stages/:stageId/visibility
// @access  Private/Admin
exports.toggleStageVisibility = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

        const stage = project.stages.find(s => s._id.toString() === req.params.stageId || s.id === req.params.stageId);
        if (!stage) return res.status(404).json({ success: false, error: 'Stage not found' });

        stage.clientVisible = req.body.clientVisible !== undefined ? req.body.clientVisible : !stage.clientVisible;
        await project.save();

        res.status(200).json({ success: true, data: project });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Link payment milestone to stage
// @route   PUT /api/projects/:id/stages/:stageId/link-payment
// @access  Private/Admin
exports.linkPaymentToStage = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

        const stage = project.stages.find(s => s._id.toString() === req.params.stageId || s.id === req.params.stageId);
        if (!stage) return res.status(404).json({ success: false, error: 'Stage not found' });

        stage.linkedPaymentMilestone = req.body.linkedPaymentMilestone || '';
        await project.save();

        await Activity.create({
            project: project._id,
            user: req.user.id,
            userName: req.user.name,
            action: `linked ${stage.name} stage to "${req.body.linkedPaymentMilestone}" payment`,
            icon: '🔗',
            type: 'stage'
        });

        res.status(200).json({ success: true, data: project });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
