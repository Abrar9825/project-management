const Task = require('../models/Task.model');
const Project = require('../models/Project.model');
const { Activity } = require('../models/Activity.model');

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res) => {
    try {
        let query = {};

        // If developer, only show their tasks
        if (req.user.role === 'developer') {
            query.assignee = req.user.id;
        }

        // Filter by project
        if (req.query.project) {
            query.project = req.query.project;
        }

        // Filter by status
        if (req.query.status) {
            query.status = req.query.status;
        }

        // Filter by assignee
        if (req.query.assignee) {
            query.assignee = req.query.assignee;
        }

        const tasks = await Task.find(query)
            .populate('project', 'name client gradient')
            .populate('assignee', 'name email')
            .populate('createdBy', 'name')
            .sort({ deadline: 1 });

        res.status(200).json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('project', 'name client')
            .populate('assignee', 'name email')
            .populate('createdBy', 'name');

        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
            });
        }

        // Check if developer can access this task
        if (req.user.role === 'developer' && task.assignee._id.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to access this task'
            });
        }

        res.status(200).json({
            success: true,
            data: task
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Create task
// @route   POST /api/tasks
// @access  Private/Admin/SubAdmin
exports.createTask = async (req, res) => {
    try {
        const { project, title, description, role, assignee, deadline, priority, stageName } = req.body;

        // Get project details
        const projectDoc = await Project.findById(project);
        if (!projectDoc) {
            return res.status(404).json({
                success: false,
                error: 'Project not found'
            });
        }

        // Get assignee name if provided
        let assigneeName = '';
        if (assignee) {
            const User = require('../models/User.model');
            const user = await User.findById(assignee);
            assigneeName = user ? user.name : '';
        }

        const task = await Task.create({
            project,
            projectName: projectDoc.name,
            title,
            description,
            role,
            assignee,
            assigneeName,
            deadline,
            priority: priority || 'medium',
            stageName: stageName || projectDoc.currentStage,
            gradient: projectDoc.gradient,
            createdBy: req.user.id
        });

        // Log activity
        await Activity.create({
            project,
            user: req.user.id,
            userName: req.user.name,
            action: `assigned task "${title}" to ${assigneeName || role}`,
            icon: '📋',
            type: 'task'
        });

        res.status(201).json({
            success: true,
            data: task
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
    try {
        let task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
            });
        }

        // Check authorization
        if (req.user.role === 'developer' && task.assignee.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to update this task'
            });
        }

        // If marking as in-progress, set startedAt
        if (req.body.status === 'in-progress' && task.status !== 'in-progress') {
            req.body.startedAt = new Date();
        }

        // If marking as completed, set completedAt
        if (req.body.status === 'completed' && task.status !== 'completed') {
            req.body.completedAt = new Date();
        }

        // If reverting from completed/in-progress back to pending, clear times
        if (req.body.status === 'pending') {
            req.body.startedAt = null;
            req.body.completedAt = null;
        }

        task = await Task.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        // Log activity if status changed
        if (req.body.status) {
            await Activity.create({
                project: task.project,
                user: req.user.id,
                userName: req.user.name,
                action: `marked "${task.title}" as ${req.body.status}`,
                icon: req.body.status === 'completed' ? '✅' : '🔄',
                type: 'task'
            });
        }

        res.status(200).json({
            success: true,
            data: task
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private/Admin
exports.deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
            });
        }

        await task.deleteOne();

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

// @desc    Get my tasks (for developers)
// @route   GET /api/tasks/my
// @access  Private
exports.getMyTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ 
            assignee: req.user.id,
            status: { $ne: 'completed' }
        })
            .populate('project', 'name client gradient')
            .sort({ deadline: 1 });

        res.status(200).json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Get my completed tasks
// @route   GET /api/tasks/my/completed
// @access  Private
exports.getMyCompletedTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ 
            assignee: req.user.id,
            status: 'completed'
        })
            .populate('project', 'name client')
            .sort({ completedAt: -1 });

        res.status(200).json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Start a task (pending -> in-progress)
// @route   PUT /api/tasks/:id/start
// @access  Private
exports.startTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
            });
        }

        if (task.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: 'Only pending tasks can be started'
            });
        }

        task.status = 'in-progress';
        task.startedAt = new Date();
        await task.save();

        // Log activity
        await Activity.create({
            project: task.project,
            user: req.user.id,
            userName: req.user.name,
            action: `started working on "${task.title}"`,
            icon: '▶️',
            type: 'task'
        });

        res.status(200).json({
            success: true,
            data: task
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Complete a task (in-progress -> completed)
// @route   PUT /api/tasks/:id/complete
// @access  Private
exports.completeTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                error: 'Task not found'
            });
        }

        task.status = 'completed';
        task.completedAt = new Date();
        // If task was never started, set startedAt to now too
        if (!task.startedAt) {
            task.startedAt = new Date();
        }
        await task.save();

        // Log activity
        await Activity.create({
            project: task.project,
            user: req.user.id,
            userName: req.user.name,
            action: `completed "${task.title}"`,
            icon: '✅',
            type: 'task'
        });

        res.status(200).json({
            success: true,
            data: task
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Get task stats
// @route   GET /api/tasks/stats
// @access  Private
exports.getTaskStats = async (req, res) => {
    try {
        let matchQuery = {};

        // If developer, only show their stats
        if (req.user.role === 'developer') {
            matchQuery.assignee = req.user._id;
        }

        const stats = await Task.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const formattedStats = {
            pending: 0,
            'in-progress': 0,
            completed: 0,
            blocked: 0,
            total: 0
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
