const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    projectName: {
        type: String,
        required: true
    },
    stage: {
        type: String,
        default: ''
    },
    stageId: {
        type: mongoose.Schema.Types.ObjectId
    },
    type: {
        type: String,
        enum: ['stage-completion', 'milestone', 'delivery', 'general', 'maintenance'],
        default: 'general'
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: [true, 'Please add a rating']
    },
    communication: {
        type: Number,
        min: 1,
        max: 5,
        default: 3
    },
    quality: {
        type: Number,
        min: 1,
        max: 5,
        default: 3
    },
    timeliness: {
        type: Number,
        min: 1,
        max: 5,
        default: 3
    },
    comments: {
        type: String,
        maxlength: [2000, 'Comments cannot be more than 2000 characters'],
        default: ''
    },
    suggestions: {
        type: String,
        maxlength: [2000, 'Suggestions cannot be more than 2000 characters'],
        default: ''
    },
    submittedBy: {
        type: String, // client name or email
        default: ''
    },
    submittedByUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isClientFeedback: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        enum: ['pending', 'submitted', 'reviewed', 'acknowledged'],
        default: 'submitted'
    },
    response: {
        text: String,
        respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        respondedByName: String,
        respondedAt: Date
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

// Virtual: average score
FeedbackSchema.virtual('averageScore').get(function() {
    const scores = [this.rating, this.communication, this.quality, this.timeliness];
    return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
});

FeedbackSchema.index({ project: 1, createdAt: -1 });
FeedbackSchema.index({ project: 1, stage: 1 });

module.exports = mongoose.model('Feedback', FeedbackSchema);
