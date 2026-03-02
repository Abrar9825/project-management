const TimeLog = require('../models/TimeLog.model');
const Task = require('../models/Task.model');

// @desc    Get all time logs
// @route   GET /api/timelogs
// @access  Private
exports.getTimeLogs = async (req, res) => {
    try {
        let query = {};

        // If developer, only show their logs
        if (req.user.role === 'developer') {
            query.user = req.user.id;
        }

        // Filter by project
        if (req.query.project) {
            query.project = req.query.project;
        }

        // Filter by user
        if (req.query.user && req.user.role !== 'developer') {
            query.user = req.query.user;
        }

        // Filter by date range
        if (req.query.startDate && req.query.endDate) {
            query.date = {
                $gte: new Date(req.query.startDate),
                $lte: new Date(req.query.endDate)
            };
        }

        const timeLogs = await TimeLog.find(query)
            .populate('user', 'name')
            .populate('task', 'title')
            .populate('project', 'name')
            .sort({ date: -1 });

        res.status(200).json({
            success: true,
            count: timeLogs.length,
            data: timeLogs
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Create time log
// @route   POST /api/timelogs
// @access  Private
exports.createTimeLog = async (req, res) => {
    try {
        const { task, duration, date, startTime, endTime, description } = req.body;

        // Get task details
        const taskDoc = await Task.findById(task);
        if (!taskDoc) {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
            });
        }

        const timeLog = await TimeLog.create({
            user: req.user.id,
            userName: req.user.name,
            task,
            taskName: taskDoc.title,
            project: taskDoc.project,
            projectName: taskDoc.projectName,
            duration,
            date: date || new Date(),
            startTime,
            endTime,
            description
        });

        // Update task time spent
        taskDoc.timeSpent += duration;
        await taskDoc.save();

        res.status(201).json({
            success: true,
            data: timeLog
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Get my time logs
// @route   GET /api/timelogs/my
// @access  Private
exports.getMyTimeLogs = async (req, res) => {
    try {
        const timeLogs = await TimeLog.find({ user: req.user.id })
            .populate('task', 'title')
            .populate('project', 'name')
            .sort({ date: -1 })
            .limit(100);

        res.status(200).json({
            success: true,
            count: timeLogs.length,
            data: timeLogs
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Get my time stats
// @route   GET /api/timelogs/my/stats
// @access  Private
exports.getMyTimeStats = async (req, res) => {
    try {
        // Today's time
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayLogs = await TimeLog.find({
            user: req.user.id,
            date: { $gte: today, $lt: tomorrow }
        });
        const todayTime = todayLogs.reduce((sum, log) => sum + log.duration, 0);

        // This week's time
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        
        const weekLogs = await TimeLog.find({
            user: req.user.id,
            date: { $gte: weekStart }
        });
        const weekTime = weekLogs.reduce((sum, log) => sum + log.duration, 0);

        // Time by project
        const projectStats = await TimeLog.aggregate([
            { $match: { user: req.user._id } },
            {
                $group: {
                    _id: '$projectName',
                    totalTime: { $sum: '$duration' }
                }
            },
            { $sort: { totalTime: -1 } }
        ]);

        // Daily time for the week
        const dailyStats = await TimeLog.aggregate([
            { 
                $match: { 
                    user: req.user._id,
                    date: { $gte: weekStart }
                } 
            },
            {
                $group: {
                    _id: { $dayOfWeek: '$date' },
                    totalTime: { $sum: '$duration' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                todayTime,
                weekTime,
                projectStats,
                dailyStats
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Delete time log
// @route   DELETE /api/timelogs/:id
// @access  Private
exports.deleteTimeLog = async (req, res) => {
    try {
        const timeLog = await TimeLog.findById(req.params.id);

        if (!timeLog) {
            return res.status(404).json({
                success: false,
                error: 'Time log not found'
            });
        }

        // Check authorization
        if (req.user.role === 'developer' && timeLog.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized'
            });
        }

        // Update task time spent
        const task = await Task.findById(timeLog.task);
        if (task) {
            task.timeSpent = Math.max(0, task.timeSpent - timeLog.duration);
            await task.save();
        }

        await timeLog.deleteOne();

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

// @desc    Get project time stats
// @route   GET /api/timelogs/project/:projectId/stats
// @access  Private/Admin/SubAdmin
exports.getProjectTimeStats = async (req, res) => {
    try {
        const projectId = req.params.projectId;

        // Total time
        const logs = await TimeLog.find({ project: projectId });
        const totalTime = logs.reduce((sum, log) => sum + log.duration, 0);

        // Time by user
        const userStats = await TimeLog.aggregate([
            { $match: { project: require('mongoose').Types.ObjectId(projectId) } },
            {
                $group: {
                    _id: '$userName',
                    totalTime: { $sum: '$duration' }
                }
            },
            { $sort: { totalTime: -1 } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalTime,
                userStats
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};
