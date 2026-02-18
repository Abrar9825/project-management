const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    projectName: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: [true, 'Please add a task title'],
        trim: true,
        maxlength: [200, 'Title cannot be more than 200 characters']
    },
    description: {
        type: String,
        maxlength: [1000, 'Description cannot be more than 1000 characters']
    },
    role: {
        type: String,
        enum: ['Frontend Dev', 'Backend Dev', 'Designer', 'QA', 'DevOps', 'Project Manager'],
        required: true
    },
    assignee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    assigneeName: {
        type: String
    },
    deadline: {
        type: Date,
        required: [true, 'Please add a deadline']
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'blocked'],
        default: 'pending'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    stageName: {
        type: String
    },
    startedAt: {
        type: Date
    },
    completedAt: {
        type: Date
    },
    gradient: {
        type: String,
        default: 'card-gradient-1'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for days until deadline
TaskSchema.virtual('daysUntilDeadline').get(function() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(this.deadline);
    return Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
});

// Virtual for in-progress duration (seconds)
TaskSchema.virtual('duration').get(function() {
    if (!this.startedAt) return 0;
    const end = this.completedAt || new Date();
    return Math.floor((end - this.startedAt) / 1000);
});

// Virtual for formatted duration
TaskSchema.virtual('formattedDuration').get(function() {
    const totalSec = this.duration;
    if (totalSec <= 0) return '—';
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
});

// Index for better query performance
TaskSchema.index({ project: 1, status: 1 });
TaskSchema.index({ assignee: 1, status: 1 });
TaskSchema.index({ deadline: 1 });

module.exports = mongoose.model('Task', TaskSchema);
