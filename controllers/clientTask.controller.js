const ClientTask = require('../models/ClientTask.model');
const Project = require('../models/Project.model');
const User = require('../models/User.model');
const { sendClientTaskEmail } = require('../services/emailService');

// @desc    Get all client tasks for a project
// @route   GET /api/client-tasks/:projectId
exports.getClientTasks = async (req, res) => {
    try {
        const tasks = await ClientTask.find({ project: req.params.projectId })
            .sort({ createdAt: -1 });
        res.json({ success: true, data: tasks });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Create a client task
// @route   POST /api/client-tasks/:projectId
exports.createClientTask = async (req, res) => {
    try {
        const { phase, description, assignedBy } = req.body;
        if (!phase || !description) {
            return res.status(400).json({ success: false, error: 'Phase and description are required' });
        }

        const task = await ClientTask.create({
            project: req.params.projectId,
            phase,
            description,
            assignedBy: assignedBy || 'admin',
            assignedByName: req.user ? req.user.name : (req.body.assignedByName || 'Client')
        });

        // ── Email notification ──────────────────────────────────────────
        try {
            const project = await Project.findById(req.params.projectId).populate('createdBy', 'name email');
            if (project) {
                const direction = (assignedBy || 'admin') === 'admin' ? 'admin-to-client' : 'client-to-admin';

                if (direction === 'admin-to-client' && project.clientAccess?.clientEmail) {
                    // Admin assigned task → notify client
                    sendClientTaskEmail(
                        project.clientAccess.clientEmail,
                        project.clientAccess.clientName || project.client,
                        'admin-to-client',
                        { phase, description, adminName: req.user?.name || 'Project Team' },
                        { name: project.name, id: project._id }
                    ).catch(e => console.error('Email error (admin→client task):', e.message));

                } else if (direction === 'client-to-admin') {
                    // Client submitted task → notify admin via project creator or first admin user
                    const adminEmail = project.createdBy?.email;
                    const adminName  = project.createdBy?.name;
                    if (adminEmail) {
                        sendClientTaskEmail(
                            adminEmail,
                            adminName || 'Admin',
                            'client-to-admin',
                            {
                                phase,
                                description,
                                assignedByName: task.assignedByName || (req.user?.name) || 'Client'
                            },
                            { name: project.name, id: project._id }
                        ).catch(e => console.error('Email error (client→admin task):', e.message));
                    }
                }
            }
        } catch (emailErr) {
            console.error('Email lookup error (client-task):', emailErr.message);
        }
        // ────────────────────────────────────────────────────────────────

        res.status(201).json({ success: true, data: task });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Start a client task
// @route   PUT /api/client-tasks/:id/start
exports.startClientTask = async (req, res) => {
    try {
        const task = await ClientTask.findById(req.params.id);
        if (!task) return res.status(404).json({ success: false, error: 'Task not found' });

        task.status = 'in-progress';
        task.startedAt = new Date();
        await task.save();

        res.json({ success: true, data: task });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Complete a client task
// @route   PUT /api/client-tasks/:id/complete
exports.completeClientTask = async (req, res) => {
    try {
        const task = await ClientTask.findById(req.params.id);
        if (!task) return res.status(404).json({ success: false, error: 'Task not found' });

        task.status = 'completed';
        task.completedAt = new Date();
        await task.save();

        res.json({ success: true, data: task });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Delete a client task
// @route   DELETE /api/client-tasks/:id
exports.deleteClientTask = async (req, res) => {
    try {
        const task = await ClientTask.findById(req.params.id);
        if (!task) return res.status(404).json({ success: false, error: 'Task not found' });

        await task.deleteOne();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
