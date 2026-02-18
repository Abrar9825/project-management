const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: [true, 'Please add an action description'],
        maxlength: [200, 'Action cannot be more than 200 characters']
    },
    icon: {
        type: String,
        default: '📌'
    },
    type: {
        type: String,
        enum: ['task', 'payment', 'stage', 'general', 'remark'],
        default: 'general'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const RemarkSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: [true, 'Please add remark text'],
        maxlength: [1000, 'Remark cannot be more than 1000 characters']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes
ActivitySchema.index({ project: 1, createdAt: -1 });
RemarkSchema.index({ project: 1, createdAt: -1 });

const Activity = mongoose.model('Activity', ActivitySchema);
const Remark = mongoose.model('Remark', RemarkSchema);

module.exports = { Activity, Remark };
