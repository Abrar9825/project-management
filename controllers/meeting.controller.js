const Meeting = require('../models/Meeting.model');
const Project = require('../models/Project.model');
const { Activity } = require('../models/Activity.model');
const { sendMeetingScheduledEmail } = require('../services/emailService');

// @desc    Get all meetings for a project
// @route   GET /api/meetings/project/:projectId
// @access  Private
exports.getMeetings = async (req, res) => {
    try {
        let query = { project: req.params.projectId };
        if (req.query.status) query.status = req.query.status;

        const meetings = await Meeting.find(query)
            .populate('createdBy', 'name')
            .sort({ scheduledAt: -1 });

        res.status(200).json({ success: true, count: meetings.length, data: meetings });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Get upcoming meetings for a project
// @route   GET /api/meetings/project/:projectId/upcoming
// @access  Private
exports.getUpcomingMeetings = async (req, res) => {
    try {
        const meetings = await Meeting.find({
            project: req.params.projectId,
            status: 'scheduled',
            scheduledAt: { $gte: new Date() }
        }).sort({ scheduledAt: 1 }).limit(5);

        res.status(200).json({ success: true, count: meetings.length, data: meetings });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Get single meeting
// @route   GET /api/meetings/:id
// @access  Private
exports.getMeeting = async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id).populate('createdBy', 'name');
        if (!meeting) return res.status(404).json({ success: false, error: 'Meeting not found' });

        res.status(200).json({ success: true, data: meeting });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Get all meetings across user's projects
// @route   GET /api/meetings/my
// @access  Private
exports.getMyMeetings = async (req, res) => {
    try {
        // Find all projects the user is part of
        const projects = await Project.find({
            $or: [
                { 'team.user': req.user.id },
                { createdBy: req.user.id }
            ]
        }).select('_id');

        const projectIds = projects.map(p => p._id);

        const meetings = await Meeting.find({
            project: { $in: projectIds },
            status: { $in: ['scheduled', 'rescheduled'] }
        })
            .populate('createdBy', 'name')
            .sort({ scheduledAt: 1 });

        res.status(200).json({ success: true, count: meetings.length, data: meetings });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Create meeting
// @route   POST /api/meetings
// @access  Private/Admin/SubAdmin
exports.createMeeting = async (req, res) => {
    try {
        const { project, title, type, meetingLink, scheduledAt, duration, recurring, attendees, agenda, stage } = req.body;

        const projectDoc = await Project.findById(project);
        if (!projectDoc) return res.status(404).json({ success: false, error: 'Project not found' });

        const meeting = await Meeting.create({
            project,
            projectName: projectDoc.name,
            title,
            type: type || 'google-meet',
            meetingLink: meetingLink || '',
            scheduledAt,
            duration: duration || 30,
            recurring: recurring || { enabled: false },
            attendees: attendees || [],
            agenda: agenda || '',
            stage: stage || '',
            createdBy: req.user.id,
            createdByName: req.user.name
        });

        await Activity.create({
            project,
            user: req.user.id,
            userName: req.user.name,
            action: `scheduled meeting: "${title}"`,
            icon: '📅',
            type: 'general'
        });

        // ── Send meeting invite email to all attendees with an email ────
        if (meeting.attendees && meeting.attendees.length > 0) {
            const emailTargets = meeting.attendees.filter(a => a.email && a.email.trim());
            if (emailTargets.length > 0) {
                const meetingObj = meeting.toObject ? meeting.toObject() : meeting;
                Promise.allSettled(
                    emailTargets.map(a =>
                        sendMeetingScheduledEmail(a.email, a.name || 'Attendee', meetingObj, false)
                            .catch(e => console.error(`Email error (meeting) to ${a.email}:`, e.message))
                    )
                );
            }
        }
        // Also send to client if project has clientEmail but not in attendees list
        try {
            const proj = await Project.findById(project).select('clientAccess');
            if (proj?.clientAccess?.clientEmail) {
                const alreadyIncluded = (meeting.attendees || []).some(
                    a => a.email?.toLowerCase() === proj.clientAccess.clientEmail.toLowerCase()
                );
                if (!alreadyIncluded) {
                    const meetingObj = meeting.toObject ? meeting.toObject() : meeting;
                    sendMeetingScheduledEmail(
                        proj.clientAccess.clientEmail,
                        proj.clientAccess.clientName || 'Client',
                        meetingObj,
                        false
                    ).catch(e => console.error('Email error (meeting→client):', e.message));
                }
            }
        } catch (emailErr) {
            console.error('Meeting email lookup error:', emailErr.message);
        }
        // ────────────────────────────────────────────────────────────────

        res.status(201).json({ success: true, data: meeting });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Update meeting
// @route   PUT /api/meetings/:id
// @access  Private/Admin/SubAdmin
exports.updateMeeting = async (req, res) => {
    try {
        let meeting = await Meeting.findById(req.params.id);
        if (!meeting) return res.status(404).json({ success: false, error: 'Meeting not found' });

        meeting = await Meeting.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

        res.status(200).json({ success: true, data: meeting });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Delete meeting
// @route   DELETE /api/meetings/:id
// @access  Private/Admin
exports.deleteMeeting = async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id);
        if (!meeting) return res.status(404).json({ success: false, error: 'Meeting not found' });

        await meeting.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
