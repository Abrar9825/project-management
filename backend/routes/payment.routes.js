const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
    getClientPayments,
    addClientPayment,
    updateClientPayment,
    deleteClientPayment,
    generatePaymentSchedule,
    getDeveloperPaymentsByProject,
    getMyPayments,
    addDeveloperPayment,
    updateDeveloperPayment,
    deleteDeveloperPayment,
    getDeveloperPaymentStats
} = require('../controllers/payment.controller');

const { protect, adminOnly } = require('../middleware/auth.middleware');
const { handleValidation } = require('../middleware/validation.middleware');

// Validation rules
const clientPaymentValidation = [
    body('project').notEmpty().withMessage('Project is required'),
    body('label').notEmpty().withMessage('Payment label is required'),
    body('amount').isNumeric().withMessage('Valid amount is required')
];

const developerPaymentValidation = [
    body('project').notEmpty().withMessage('Project is required'),
    body('developer').notEmpty().withMessage('Developer is required'),
    body('amount').isNumeric().withMessage('Valid amount is required')
];

// Apply protect middleware to all routes
router.use(protect);

// Client payment routes (Admin only)
router.get('/client/:projectId', adminOnly, getClientPayments);
router.post('/client/generate/:projectId', adminOnly, generatePaymentSchedule);
router.post('/client', adminOnly, clientPaymentValidation, handleValidation, addClientPayment);
router.put('/client/:id', adminOnly, updateClientPayment);
router.delete('/client/:id', adminOnly, deleteClientPayment);

// Developer payment routes
router.get('/developer/my', getMyPayments);
router.get('/developer/project/:projectId', adminOnly, getDeveloperPaymentsByProject);
router.get('/developer/:developerId/stats', getDeveloperPaymentStats);
router.post('/developer', adminOnly, developerPaymentValidation, handleValidation, addDeveloperPayment);
router.put('/developer/:id', adminOnly, updateDeveloperPayment);
router.delete('/developer/:id', adminOnly, deleteDeveloperPayment);

module.exports = router;
