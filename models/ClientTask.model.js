const mongoose = require('mongoose');

const ClientTaskSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    phase: {
        type: String,
        enum: ['Requirement', 'Design', 'Frontend', 'Backend', 'QA', 'Hosting', 'Delivery'],
        required: true
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
        trim: true,
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    assignedBy: {
        type: String,
        enum: ['admin', 'client'],
        required: true
    },
    assignedByName: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed'],
        default: 'pending'
    },
    startedAt: {
        type: Date
    },
    completedAt: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ClientTask', ClientTaskSchema);
