const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true,
        maxlength: [50, 'Name cannot be more than 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        lowercase: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    role: {
        type: String,
        enum: ['admin', 'subadmin', 'developer', 'client'],
        default: 'developer'
    },
    avatar: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        default: ''
    },
    designation: {
        type: String,
        default: ''
    },
    skills: [{
        type: String
    }],
    hourRate: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    canDelete: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
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

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
    console.log('[USER MODEL] Generating JWT token for user:', this._id);
    console.log('[USER MODEL] Using JWT_SECRET:', process.env.JWT_SECRET);
    console.log('[USER MODEL] Using JWT_EXPIRE:', process.env.JWT_EXPIRE);
    
    const token = jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
    
    console.log('[USER MODEL] Token generated:', token);
    return token;
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Get user initials
UserSchema.virtual('initials').get(function() {
    return this.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase();
});

module.exports = mongoose.model('User', UserSchema);
