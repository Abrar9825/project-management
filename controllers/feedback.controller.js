const Feedback = require('../models/Feedback.model');
const Project = require('../models/Project.model');
const { Activity } = require('../models/Activity.model');

// @desc    Get all feedback for a project
// @route   GET /api/feedback/project/:projectId
// @access  Private
exports.getFeedbacks = async (req, res) => {
    try {
        let query = { project: req.params.projectId };
        if (req.query.stage) query.stage = req.query.stage;
        if (req.query.type) query.type = req.query.type;

        const feedbacks = await Feedback.find(query)
            .populate('submittedByUser', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: feedbacks.length, data: feedbacks });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Get feedback stats for a project
// @route   GET /api/feedback/project/:projectId/stats
// @access  Private
exports.getFeedbackStats = async (req, res) => {
    try {
        const feedbacks = await Feedback.find({ project: req.params.projectId });

        const stats = {
            total: feedbacks.length,
            averageRating: feedbacks.length > 0
                ? Math.round(feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length * 10) / 10
                : 0,
            averageCommunication: feedbacks.length > 0
                ? Math.round(feedbacks.reduce((s, f) => s + f.communication, 0) / feedbacks.length * 10) / 10
                : 0,
            averageQuality: feedbacks.length > 0
                ? Math.round(feedbacks.reduce((s, f) => s + f.quality, 0) / feedbacks.length * 10) / 10
                : 0,
            averageTimeliness: feedbacks.length > 0
                ? Math.round(feedbacks.reduce((s, f) => s + f.timeliness, 0) / feedbacks.length * 10) / 10
                : 0,
            byStage: {},
            byType: {}
        };

        feedbacks.forEach(f => {
            if (f.stage) {
                if (!stats.byStage[f.stage]) stats.byStage[f.stage] = { count: 0, totalRating: 0 };
                stats.byStage[f.stage].count++;
                stats.byStage[f.stage].totalRating += f.rating;
            }
            if (!stats.byType[f.type]) stats.byType[f.type] = 0;
            stats.byType[f.type]++;
        });

        // Calculate averages per stage
        Object.keys(stats.byStage).forEach(stage => {
            stats.byStage[stage].avgRating = Math.round(stats.byStage[stage].totalRating / stats.byStage[stage].count * 10) / 10;
        });

        res.status(200).json({ success: true, data: stats });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Get single feedback
// @route   GET /api/feedback/:id
// @access  Private
exports.getFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.findById(req.params.id)
            .populate('submittedByUser', 'name')
            .populate('response.respondedBy', 'name');

        if (!feedback) return res.status(404).json({ success: false, error: 'Feedback not found' });

        res.status(200).json({ success: true, data: feedback });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Submit feedback
// @route   POST /api/feedback
// @access  Private (Client or Admin)
exports.submitFeedback = async (req, res) => {
    try {
        const { project, stage, stageId, type, rating, communication, quality, timeliness, comments, suggestions, submittedBy } = req.body;

        const projectDoc = await Project.findById(project);
        if (!projectDoc) return res.status(404).json({ success: false, error: 'Project not found' });

        const feedback = await Feedback.create({
            project,
            projectName: projectDoc.name,
            stage: stage || '',
            stageId: stageId || null,
            type: type || 'general',
            rating,
            communication: communication || 3,
            quality: quality || 3,
            timeliness: timeliness || 3,
            comments: comments || '',
            suggestions: suggestions || '',
            submittedBy: submittedBy || req.user.name,
            submittedByUser: req.user.id,
            isClientFeedback: req.user.role === 'client',
            status: 'submitted'
        });

        await Activity.create({
            project,
            user: req.user.id,
            userName: req.user.name,
            action: `submitted feedback${stage ? ` for ${stage} stage` : ''} (Rating: ${rating}/5)`,
            icon: '⭐',
            type: 'general'
        });

        res.status(201).json({ success: true, data: feedback });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Respond to feedback
// @route   PUT /api/feedback/:id/respond
// @access  Private/Admin/SubAdmin
exports.respondToFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.findById(req.params.id);
        if (!feedback) return res.status(404).json({ success: false, error: 'Feedback not found' });

        feedback.response = {
            text: req.body.text,
            respondedBy: req.user.id,
            respondedByName: req.user.name,
            respondedAt: new Date()
        };
        feedback.status = 'acknowledged';
        await feedback.save();

        res.status(200).json({ success: true, data: feedback });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Delete feedback
// @route   DELETE /api/feedback/:id
// @access  Private/Admin
exports.deleteFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.findById(req.params.id);
        if (!feedback) return res.status(404).json({ success: false, error: 'Feedback not found' });

        await feedback.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
