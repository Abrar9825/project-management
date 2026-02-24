const mongoose = require('mongoose');

const StageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        enum: ['Requirement', 'Design', 'Frontend', 'Backend', 'QA Testing', 'Hosting & Deployment', 'Delivery', 'Maintenance']
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'blocked', 'active', 'approved', 'waiting-client'],
        default: 'pending'
    },
    assigned: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    assignedName: String,
    assignedMembers: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        role: String
    }],
    deadline: Date,
    summary: String,
    type: {
        type: String,
        enum: ['checklist', 'development', 'hosting', 'delivery', 'maintenance'],
        default: 'checklist'
    },
    approved: {
        type: Boolean,
        default: false
    },
    items: [{
        text: String,
        done: { type: Boolean, default: false }
    }],
    repoUrl: String,
    liveUrl: String,
    linkedBackend: String,
    health: {
        type: String,
        enum: ['success', 'warning', 'danger', 'pending'],
        default: 'pending'
    },
    hostingProvider: String,
    domainUrl: String,
    sslStatus: {
        type: String,
        enum: ['active', 'expired', 'pending'],
        default: 'pending'
    },
    deliveries: [{
        name: String,
        date: Date,
        approved: { type: Boolean, default: false }
    }],
    gradient: {
        type: String,
        default: 'stage-gradient-1'
    },
    icon: String,
    order: Number,

    // ===== NEW: Client Visibility Toggle =====
    clientVisible: {
        type: Boolean,
        default: true
    },

    // ===== NEW: Linked Payment Milestone =====
    linkedPaymentMilestone: {
        type: String,
        enum: ['', 'Advance Payment', 'Design Payment', 'Development Payment', 'Final Payment', '1st Milestone', '2nd Milestone', '3rd Milestone'],
        default: ''
    },

    // ===== NEW: Blocker Reasons (auto-computed) =====
    blockerReasons: [{
        type: { type: String, enum: ['payment-pending', 'client-approval', 'assets-missing', 'repo-empty'] },
        label: String,
        severity: { type: String, enum: ['blocked', 'waiting', 'info'], default: 'blocked' }
    }],

    // ===== NEW: Approval Workflow =====
    approvalWorkflow: {
        submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        submittedByName: String,
        submittedAt: Date,
        subadminReview: {
            status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
            reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            reviewedByName: String,
            reviewedAt: Date,
            comment: String
        },
        adminApproval: {
            status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
            approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            approvedByName: String,
            approvedAt: Date,
            comment: String
        }
    },

    // ===== NEW: Asset Requests (for Requirement & Design stages) =====
    assetRequests: [{
        label: String,
        type: { type: String, enum: ['logo', 'content', 'brand-guide', 'api-keys', 'approval', 'other'], default: 'other' },
        status: { type: String, enum: ['pending', 'received', 'rejected'], default: 'pending' },
        fileName: String,
        fileUrl: String,
        requestedAt: { type: Date, default: Date.now },
        receivedAt: Date,
        note: String
    }]
});

const TeamMemberSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['Project Manager', 'Designer', 'Frontend Dev', 'Backend Dev', 'QA Engineer', 'DevOps'],
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    name: String
});

const ProjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a project name'],
        trim: true,
        maxlength: [100, 'Name cannot be more than 100 characters']
    },
    client: {
        type: String,
        required: [true, 'Please add a client name'],
        trim: true
    },
    type: {
        type: String,
        enum: ['web', 'mobile', 'desktop', 'ecommerce', 'crm', 'api', 'other'],
        default: 'web'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['success', 'warning', 'danger', 'info'],
        default: 'info'
    },
    progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    currentStage: {
        type: String,
        default: 'Requirement'
    },
    dueDate: {
        type: Date
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    team: [TeamMemberSchema],
    stages: [StageSchema],
    totalAmount: {
        type: Number,
        default: 0
    },
    advancePercent: {
        type: Number,
        default: 25
    },
    milestones: {
        type: Number,
        default: 3
    },
    gradient: {
        type: String,
        default: 'card-gradient-1'
    },
    description: String,
    isActive: {
        type: Boolean,
        default: true
    },

    // ===== NEW: Project Mode =====
    mode: {
        type: String,
        enum: ['active', 'paused', 'maintenance', 'completed'],
        default: 'active'
    },

    // ===== NEW: Maintenance Mode Fields =====
    maintenanceStartedAt: Date,
    maintenanceNotes: String,

    // ===== NEW: Project Health (auto-computed) =====
    health: {
        payment: { type: String, enum: ['healthy', 'warning', 'danger', 'pending'], default: 'pending' },
        clientPending: { type: Number, default: 0 },
        developerAssignment: { type: String, enum: ['full', 'partial', 'none'], default: 'none' },
        qaStatus: { type: String, enum: ['passed', 'in-progress', 'not-started', 'failed'], default: 'not-started' },
        deadlineRisk: { type: String, enum: ['on-track', 'at-risk', 'overdue'], default: 'on-track' },
        overallScore: { type: Number, min: 0, max: 100, default: 0 }
    },

    // ===== NEW: Client Panel Data =====
    clientAccess: {
        enabled: { type: Boolean, default: false },
        clientName: String,
        clientEmail: String,
        clientPhone: String,
        allowedStages: [String],
        lastViewed: Date
    },

    // ===== NEW: Document Links =====
    documents: [{
        type: { type: String, enum: ['requirement', 'quotation', 'agreement', 'design-brief', 'handover', 'contract', 'welcome-doc', 'payment-plan', 'fulfillment-plan', 'tracking-sheet', 'monthly-report', 'maintenance-agreement', 'client-access-sheet', 'feedback-request', 'stage-summary'] },
        title: String,
        generatedAt: { type: Date, default: Date.now },
        generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        generatedByName: String,
        content: String,
        status: { type: String, enum: ['draft', 'final', 'approved', 'sent'], default: 'draft' }
    }],

    // ===== AGENCY LIFECYCLE: Extended Project Fields =====
    scopeOfWork: {
        type: String,
        default: ''
    },
    deliverables: [{
        title: String,
        description: String,
        stage: String,
        dueDate: Date,
        status: { type: String, enum: ['pending', 'in-progress', 'delivered', 'approved'], default: 'pending' }
    }],
    paymentTerms: {
        type: String,
        default: ''
    },
    paymentMedium: {
        type: String,
        enum: ['bank-transfer', 'upi', 'paypal', 'stripe', 'cash', 'other'],
        default: 'bank-transfer'
    },
    latePaymentPolicy: {
        type: String,
        default: 'Payment overdue by 7 days will result in project pause.'
    },
    milestonesData: [{
        title: String,
        description: String,
        dueDate: Date,
        linkedStage: String,
        linkedPayment: String,
        status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' }
    }],
    clientDetails: {
        name: String,
        email: String,
        phone: String,
        company: String,
        address: String,
        contactPerson: String
    },
    communicationChannels: {
        primary: { type: String, default: 'email' },
        secondary: { type: String, default: '' },
        meetingSchedule: { type: String, default: 'Weekly' },
        supportEmail: { type: String, default: '' },
        supportPhone: { type: String, default: '' }
    },
    contractSigned: {
        type: Boolean,
        default: false
    },
    contractSignedAt: Date,
    terminationClause: {
        type: String,
        default: 'Either party may terminate this agreement with 30 days written notice.'
    },
    confidentialityClause: {
        type: String,
        default: 'Both parties agree to maintain confidentiality of all shared information.'
    },
    responsibilities: {
        agency: [{ type: String }],
        client: [{ type: String }]
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
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for team size
ProjectSchema.virtual('teamSize').get(function() {
    return this.team ? this.team.length : 0;
});

// Calculate progress based on completed stages
ProjectSchema.methods.calculateProgress = function() {
    if (!this.stages || this.stages.length === 0) return 0;
    const completedStages = this.stages.filter(s => s.status === 'completed').length;
    return Math.round((completedStages / this.stages.length) * 100);
};

// Pre-save hook to update progress
ProjectSchema.pre('save', function(next) {
    this.progress = this.calculateProgress();
    next();
});

// Index for better query performance
ProjectSchema.index({ name: 'text', client: 'text' });
ProjectSchema.index({ status: 1, priority: 1 });
ProjectSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Project', ProjectSchema);
