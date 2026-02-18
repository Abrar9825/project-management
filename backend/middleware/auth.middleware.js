const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

// Protect routes - verify token
exports.protect = async (req, res, next) => {
    let token;

    // Check for token in headers or cookies
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
        token = req.cookies.token;
    }

    // Make sure token exists
    if (!token) {
        console.log('[AUTH MIDDLEWARE] No token found in request');
        return res.status(401).json({
            success: false,
            error: 'Not authorized to access this route'
        });
    }

    try {
        console.log('[AUTH MIDDLEWARE] Verifying token:', token);
        console.log('[AUTH MIDDLEWARE] Using JWT_SECRET:', process.env.JWT_SECRET);
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('[AUTH MIDDLEWARE] Token decoded successfully:', decoded);

        // Get user from token
        req.user = await User.findById(decoded.id);
        console.log('[AUTH MIDDLEWARE] User found:', req.user?._id);

        if (!req.user) {
            console.log('[AUTH MIDDLEWARE] User not found in database');
            return res.status(401).json({
                success: false,
                error: 'User not found'
            });
        }

        if (!req.user.isActive) {
            console.log('[AUTH MIDDLEWARE] User is not active');
            return res.status(401).json({
                success: false,
                error: 'User account is deactivated'
            });
        }

        console.log('[AUTH MIDDLEWARE] Auth passed for user:', req.user._id);
        next();
    } catch (err) {
        console.error('[AUTH MIDDLEWARE] Token verification error:', err.message);
        return res.status(401).json({
            success: false,
            error: 'Not authorized to access this route',
            details: err.message
        });
    }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: `User role '${req.user.role}' is not authorized to access this route`
            });
        }
        next();
    };
};

// Admin only middleware
exports.adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Only admin can access this route'
        });
    }
    next();
};

// Admin and SubAdmin only middleware
exports.adminSubadminOnly = (req, res, next) => {
    if (!['admin', 'subadmin'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            error: 'Only admin and subadmin can access this route'
        });
    }
    next();
};
