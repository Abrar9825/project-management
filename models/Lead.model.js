const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
    // Basic Lead Information
    firstName: {
        type: String,
        required: [true, 'Please add first name'],
        trim: true
    },
    lastName: {
        type: String,
        trim: true
    },
    company: {
        type: String,
        required: [true, 'Please add company name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please add email'],
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    phone: {
        type: String,
        trim: true
    },
    
    // Project/Lead Details
    description: {
        type: String,
        maxlength: [2000, 'Description cannot be more than 2000 characters']
    },
    projectType: {
        type: String,
        enum: ['web', 'mobile', 'desktop', 'ecommerce', 'crm', 'api', 'other'],
        default: 'web'
    },
    budget: {
        type: Number,
        min: 0
    },
    leadSource: {
        type: String,
        enum: ['manual', 'form', 'email', 'phone', 'referral', 'other'],
        default: 'manual'
    },
    
    // Status Tracking
    status: {
        type: String,
        enum: ['new', 'contacted', 'quoted', 'converted', 'rejected'],
        default: 'new'
    },
    lastStatusChange: {
        type: Date,
        default: Date.now
    },
    
    // Assignment
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    assignedByName: {
        type: String
    },
    assignedDate: {
        type: Date
    },
    
    // Conversion to Project
    convertedToProjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    },
    convertedDate: {
        type: Date
    },
    
    // Document Attachments
    attachments: [
        {
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                auto: true
            },
            filename: {
                type: String,
                required: true
            },
            originalName: {
                type: String,
                required: true
            },
            mimeType: {
                type: String
            },
            size: {
                type: Number
            },
            filePath: {
                type: String,
                required: true
            },
            uploadedAt: {
                type: Date,
                default: Date.now
            },
            uploadedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        }
    ],
    
    // Metadata
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for full name
LeadSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName || ''}`.trim();
});

// Index for faster queries
LeadSchema.index({ company: 'text', email: 'text' });
LeadSchema.index({ status: 1 });
LeadSchema.index({ createdAt: -1 });
LeadSchema.index({ convertedToProjectId: 1 });

module.exports = mongoose.model('Lead', LeadSchema);
