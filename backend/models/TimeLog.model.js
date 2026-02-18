const mongoose = require('mongoose');

const TimeLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    task: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        required: true
    },
    taskName: {
        type: String,
        required: true
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    projectName: {
        type: String,
        required: true
    },
    duration: {
        type: Number, // in seconds
        required: [true, 'Please add duration'],
        min: [0, 'Duration cannot be negative']
    },
    date: {
        type: Date,
        default: Date.now
    },
    startTime: {
        type: Date
    },
    endTime: {
        type: Date
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot be more than 500 characters']
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

// Virtual for formatted duration
TimeLogSchema.virtual('formattedDuration').get(function() {
    const hours = Math.floor(this.duration / 3600);
    const minutes = Math.floor((this.duration % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
});

// Indexes for better query performance
TimeLogSchema.index({ user: 1, date: -1 });
TimeLogSchema.index({ project: 1, date: -1 });
TimeLogSchema.index({ task: 1, date: -1 });

module.exports = mongoose.model('TimeLog', TimeLogSchema);
