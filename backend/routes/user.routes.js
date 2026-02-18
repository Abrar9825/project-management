const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    getUsersByRole,
    getUserStats,
    getDevelopers
} = require('../controllers/user.controller');

const { protect, adminOnly, adminSubadminOnly } = require('../middleware/auth.middleware');
const { handleValidation } = require('../middleware/validation.middleware');

// Validation rules
const createUserValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please add a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['admin', 'subadmin', 'developer']).withMessage('Invalid role')
];

// Apply protect middleware to all routes
router.use(protect);

// Admin only routes
router.route('/')
    .get(adminOnly, getUsers)
    .post(adminOnly, createUserValidation, handleValidation, createUser);

router.get('/stats', adminOnly, getUserStats);
router.get('/developers', adminSubadminOnly, getDevelopers);
router.get('/role/:role', adminOnly, getUsersByRole);

router.route('/:id')
    .get(adminOnly, getUser)
    .put(adminOnly, updateUser)
    .delete(adminOnly, deleteUser);

module.exports = router;
