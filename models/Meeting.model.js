const mongoose = require('mongoose');

const MeetingSchema = new mongoose.Schema({
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
        required: [true, 'Please add a meeting title'],
        trim: true,
        maxlength: [200, 'Title cannot be more than 200 characters']
    },
    type: {
        type: String,
        enum: ['google-meet', 'zoom', 'teams', 'phone-call', 'in-person', 'other'],
        default: 'google-meet'
    },
    meetingLink: {
        type: String,
        default: ''
    },
    scheduledAt: {
        type: Date,
        required: [true, 'Please add a meeting date/time']
    },
    duration: {
        type: Number, // in minutes
        default: 30
    },
    recurring: {
        enabled: { type: Boolean, default: false },
        frequency: { 
            type: String, 
            enum: ['daily', 'weekly', 'biweekly', 'monthly'], 
            default: 'weekly' 
        },
        endDate: Date,
        dayOfWeek: { type: Number, min: 0, max: 6 } // 0=Sunday
    },
    attendees: [{
        name: String,
        email: String,
        role: { type: String, enum: ['client', 'admin', 'subadmin', 'developer'], default: 'developer' }
    }],
    agenda: {
        type: String,
        default: ''
    },
    notes: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
        default: 'scheduled'
    },
    stage: {
        type: String,
        default: ''
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdByName: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual: next occurrence for recurring meetings
MeetingSchema.virtual('nextOccurrence').get(function() {
    if (!this.recurring || !this.recurring.enabled) return this.scheduledAt;
    const now = new Date();
    if (this.scheduledAt > now) return this.scheduledAt;
    
    const freq = this.recurring.frequency;
    let next = new Date(this.scheduledAt);
    
    while (next <= now) {
        if (freq === 'daily') next.setDate(next.getDate() + 1);
        else if (freq === 'weekly') next.setDate(next.getDate() + 7);
        else if (freq === 'biweekly') next.setDate(next.getDate() + 14);
        else if (freq === 'monthly') next.setMonth(next.getMonth() + 1);
    }
    
    if (this.recurring.endDate && next > this.recurring.endDate) return null;
    return next;
});

MeetingSchema.index({ project: 1, scheduledAt: -1 });
MeetingSchema.index({ project: 1, status: 1 });

module.exports = mongoose.model('Meeting', MeetingSchema);
