const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    projectName: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['requirement', 'quotation', 'agreement', 'design-brief', 'handover', 'contract', 'welcome-doc', 'payment-plan', 'fulfillment-plan', 'tracking-sheet', 'monthly-report', 'maintenance-agreement', 'client-access-sheet', 'feedback-request', 'stage-summary'],
        required: true
    },
    title: {
        type: String,
        required: [true, 'Please add a document title'],
        trim: true
    },
    status: {
        type: String,
        enum: ['draft', 'final', 'approved', 'sent'],
        default: 'draft'
    },
    content: {
        type: String,
        default: ''
    },
    // Structured fields for different document types
    fields: {
        // Quotation fields
        quotation: {
            items: [{
                description: String,
                quantity: { type: Number, default: 1 },
                rate: { type: Number, default: 0 },
                amount: { type: Number, default: 0 }
            }],
            subtotal: { type: Number, default: 0 },
            tax: { type: Number, default: 0 },
            discount: { type: Number, default: 0 },
            total: { type: Number, default: 0 },
            validUntil: Date,
            terms: String,
            notes: String
        },
        // Requirement document fields
        requirement: {
            objectives: [String],
            scope: String,
            deliverables: [String],
            timeline: String,
            constraints: [String],
            assumptions: [String]
        },
        // Agreement fields
        agreement: {
            clientName: String,
            clientAddress: String,
            startDate: Date,
            endDate: Date,
            paymentTerms: String,
            scope: String,
            terms: [String]
        },
        // Design Brief fields
        designBrief: {
            brandColors: [String],
            typography: String,
            targetAudience: String,
            competitors: [String],
            references: [String],
            requirements: [String]
        },
        // Handover fields
        handover: {
            hostingDetails: String,
            domain: String,
            repoLinks: [String],
            credentials: [{
                service: String,
                username: String,
                note: String
            }],
            deploymentNotes: String,
            techStack: [String],
            maintenanceInstructions: String
        }
    },
    stage: {
        type: String,
        default: ''
    },
    linkedPayment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClientPayment'
    },
    generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    generatedByName: String,
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedByName: String,
    approvedAt: Date,
    version: {
        type: Number,
        default: 1
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

DocumentSchema.index({ project: 1, type: 1 });
DocumentSchema.index({ project: 1, createdAt: -1 });

module.exports = mongoose.model('Document', DocumentSchema);
