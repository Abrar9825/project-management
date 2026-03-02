const mongoose = require('mongoose');

const MonthlyReportSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    projectName: {
        type: String,
        required: true
    },
    reportMonth: {
        type: Number, // 1-12
        required: true
    },
    reportYear: {
        type: Number,
        required: true
    },
    period: {
        startDate: Date,
        endDate: Date
    },
    // Stage Progress
    stageProgress: [{
        stageName: String,
        status: String,
        progressPercent: Number,
        notes: String
    }],
    overallProgress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    // Tasks Summary
    tasksSummary: {
        total: { type: Number, default: 0 },
        completed: { type: Number, default: 0 },
        inProgress: { type: Number, default: 0 },
        pending: { type: Number, default: 0 },
        blocked: { type: Number, default: 0 }
    },
    completedTasks: [{
        title: String,
        completedAt: Date,
        assignee: String
    }],
    // Hours Logged
    hoursSummary: {
        totalHours: { type: Number, default: 0 },
        byMember: [{
            name: String,
            hours: Number,
            role: String
        }]
    },
    // Payment Summary
    paymentSummary: {
        totalAmount: { type: Number, default: 0 },
        received: { type: Number, default: 0 },
        pending: { type: Number, default: 0 },
        overdue: { type: Number, default: 0 },
        payments: [{
            label: String,
            amount: Number,
            status: String,
            date: Date
        }]
    },
    // Blockers
    blockers: [{
        description: String,
        stage: String,
        severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
        resolvedAt: Date
    }],
    // Upcoming Work
    upcomingWork: [{
        title: String,
        stage: String,
        deadline: Date,
        assignee: String
    }],
    // Key Achievements
    achievements: [{
        title: String,
        date: Date
    }],
    // Client Actions Required
    clientActions: [{
        action: String,
        deadline: Date,
        status: { type: String, enum: ['pending', 'completed'], default: 'pending' }
    }],
    // Metadata
    status: {
        type: String,
        enum: ['draft', 'final', 'sent-to-client'],
        default: 'draft'
    },
    sentToClientAt: Date,
    generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    generatedByName: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual: report label
MonthlyReportSchema.virtual('reportLabel').get(function() {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[this.reportMonth - 1]} ${this.reportYear}`;
});

MonthlyReportSchema.index({ project: 1, reportYear: -1, reportMonth: -1 });
MonthlyReportSchema.index({ project: 1, createdAt: -1 });

module.exports = mongoose.model('MonthlyReport', MonthlyReportSchema);
