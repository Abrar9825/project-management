const mongoose = require('mongoose');

const SupportTicketSchema = new mongoose.Schema({
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
        required: [true, 'Please add a ticket title'],
        trim: true,
        maxlength: [200, 'Title cannot be more than 200 characters']
    },
    description: {
        type: String,
        maxlength: [2000, 'Description cannot be more than 2000 characters']
    },
    type: {
        type: String,
        enum: ['bug-fix', 'support', 'feature-request', 'version-update', 'general'],
        default: 'support'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['open', 'in-progress', 'resolved', 'closed'],
        default: 'open'
    },
    assignee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    assigneeName: String,
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reportedByName: String,
    resolution: {
        type: String,
        maxlength: [2000, 'Resolution cannot be more than 2000 characters']
    },
    resolvedAt: Date,
    closedAt: Date,
    remarks: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        userName: String,
        text: String,
        createdAt: { type: Date, default: Date.now }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

SupportTicketSchema.index({ project: 1, status: 1 });
SupportTicketSchema.index({ assignee: 1, status: 1 });

module.exports = mongoose.model('SupportTicket', SupportTicketSchema);
