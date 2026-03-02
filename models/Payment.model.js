const mongoose = require('mongoose');

// Client Payment Schema
const ClientPaymentSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    projectName: {
        type: String,
        required: true
    },
    label: {
        type: String,
        required: [true, 'Please add a payment label'],
        enum: ['Advance Payment', '1st Milestone', '2nd Milestone', '3rd Milestone', '4th Milestone', '5th Milestone', 'Final Payment', 'Other']
    },
    amount: {
        type: Number,
        required: [true, 'Please add an amount'],
        min: [0, 'Amount cannot be negative']
    },
    date: {
        type: Date
    },
    status: {
        type: String,
        enum: ['pending', 'received', 'cancelled'],
        default: 'pending'
    },
    note: {
        type: String,
        maxlength: [500, 'Note cannot be more than 500 characters']
    },
    receivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
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
    timestamps: true
});

// Developer Payment Schema
const DeveloperPaymentSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    projectName: {
        type: String,
        required: true
    },
    developer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    developerName: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: ''
    },
    amount: {
        type: Number,
        required: [true, 'Please add an amount'],
        min: [0, 'Amount cannot be negative']
    },
    date: {
        type: Date,
        default: Date.now
    },
    note: {
        type: String,
        maxlength: [500, 'Note cannot be more than 500 characters']
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'cancelled'],
        default: 'paid'
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
    timestamps: true
});

// Indexes
ClientPaymentSchema.index({ project: 1, status: 1 });
DeveloperPaymentSchema.index({ project: 1, developer: 1 });
DeveloperPaymentSchema.index({ developer: 1, date: -1 });

const ClientPayment = mongoose.model('ClientPayment', ClientPaymentSchema);
const DeveloperPayment = mongoose.model('DeveloperPayment', DeveloperPaymentSchema);

module.exports = { ClientPayment, DeveloperPayment };
