const SupportTicket = require('../models/SupportTicket.model');
const Project = require('../models/Project.model');
const { Activity } = require('../models/Activity.model');

// @desc    Get tickets for a project
// @route   GET /api/tickets/project/:projectId
// @access  Private
exports.getTickets = async (req, res) => {
    try {
        let query = { project: req.params.projectId };
        if (req.query.status) query.status = req.query.status;
        if (req.user.role === 'developer') query.assignee = req.user.id;

        const tickets = await SupportTicket.find(query)
            .populate('assignee', 'name')
            .populate('reportedBy', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: tickets.length, data: tickets });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Get single ticket
// @route   GET /api/tickets/:id
// @access  Private
exports.getTicket = async (req, res) => {
    try {
        const ticket = await SupportTicket.findById(req.params.id)
            .populate('assignee', 'name email')
            .populate('reportedBy', 'name');

        if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });

        res.status(200).json({ success: true, data: ticket });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Create ticket
// @route   POST /api/tickets
// @access  Private
exports.createTicket = async (req, res) => {
    try {
        const { project, title, description, type, priority, assignee } = req.body;

        const projectDoc = await Project.findById(project);
        if (!projectDoc) return res.status(404).json({ success: false, error: 'Project not found' });

        // Check project is in maintenance mode
        if (projectDoc.mode !== 'maintenance') {
            return res.status(400).json({ success: false, error: 'Project must be in maintenance mode to create support tickets' });
        }

        let assigneeName = '';
        if (assignee) {
            const User = require('../models/User.model');
            const user = await User.findById(assignee);
            assigneeName = user ? user.name : '';
        }

        const ticket = await SupportTicket.create({
            project,
            projectName: projectDoc.name,
            title,
            description,
            type: type || 'support',
            priority: priority || 'medium',
            assignee,
            assigneeName,
            reportedBy: req.user.id,
            reportedByName: req.user.name
        });

        await Activity.create({
            project,
            user: req.user.id,
            userName: req.user.name,
            action: `created ${type || 'support'} ticket: "${title}"`,
            icon: '🎫',
            type: 'general'
        });

        res.status(201).json({ success: true, data: ticket });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Update ticket
// @route   PUT /api/tickets/:id
// @access  Private
exports.updateTicket = async (req, res) => {
    try {
        let ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });

        if (req.body.status === 'resolved' && ticket.status !== 'resolved') {
            req.body.resolvedAt = new Date();
        }
        if (req.body.status === 'closed' && ticket.status !== 'closed') {
            req.body.closedAt = new Date();
        }

        ticket = await SupportTicket.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

        if (req.body.status) {
            await Activity.create({
                project: ticket.project,
                user: req.user.id,
                userName: req.user.name,
                action: `updated ticket "${ticket.title}" to ${req.body.status}`,
                icon: '🎫',
                type: 'general'
            });
        }

        res.status(200).json({ success: true, data: ticket });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Add remark to ticket
// @route   POST /api/tickets/:id/remarks
// @access  Private
exports.addTicketRemark = async (req, res) => {
    try {
        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });

        ticket.remarks.push({
            user: req.user.id,
            userName: req.user.name,
            text: req.body.text
        });
        await ticket.save();

        res.status(200).json({ success: true, data: ticket });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Delete ticket
// @route   DELETE /api/tickets/:id
// @access  Private/Admin
exports.deleteTicket = async (req, res) => {
    try {
        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });

        await ticket.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Get ticket stats for a project
// @route   GET /api/tickets/project/:projectId/stats
// @access  Private
exports.getTicketStats = async (req, res) => {
    try {
        const stats = await SupportTicket.aggregate([
            { $match: { project: require('mongoose').Types.ObjectId(req.params.projectId) } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const formatted = { open: 0, 'in-progress': 0, resolved: 0, closed: 0, total: 0 };
        stats.forEach(s => { formatted[s._id] = s.count; formatted.total += s.count; });

        res.status(200).json({ success: true, data: formatted });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
