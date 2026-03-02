const mongoose = require('mongoose');

const FulfillmentItemSchema = new mongoose.Schema({
    stageName: {
        type: String,
        required: true
    },
    stageId: {
        type: mongoose.Schema.Types.ObjectId
    },
    deliverables: [{
        title: String,
        description: String,
        status: { type: String, enum: ['pending', 'in-progress', 'completed', 'blocked'], default: 'pending' },
        completedAt: Date
    }],
    responsibleMember: {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        role: String
    },
    expectedStartDate: Date,
    expectedCompletionDate: Date,
    actualCompletionDate: Date,
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'blocked', 'waiting-client'],
        default: 'pending'
    },
    progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    notes: String
});

const FulfillmentSchema = new mongoose.Schema({
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
        default: 'Fulfillment Plan'
    },
    version: {
        type: Number,
        default: 1
    },
    items: [FulfillmentItemSchema],
    overallProgress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    startDate: Date,
    targetEndDate: Date,
    status: {
        type: String,
        enum: ['draft', 'active', 'completed', 'on-hold'],
        default: 'draft'
    },
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

// Calculate overall progress from items
FulfillmentSchema.methods.calculateProgress = function() {
    if (!this.items || this.items.length === 0) return 0;
    const total = this.items.reduce((sum, item) => sum + item.progress, 0);
    return Math.round(total / this.items.length);
};

FulfillmentSchema.pre('save', function(next) {
    this.overallProgress = this.calculateProgress();
    next();
});

FulfillmentSchema.index({ project: 1, createdAt: -1 });

module.exports = mongoose.model('Fulfillment', FulfillmentSchema);
