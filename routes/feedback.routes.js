const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
    getFeedbacks,
    getFeedbackStats,
    getFeedback,
    submitFeedback,
    respondToFeedback,
    deleteFeedback
} = require('../controllers/feedback.controller');

const { protect, adminOnly, adminSubadminOnly } = require('../middleware/auth.middleware');
const { handleValidation } = require('../middleware/validation.middleware');

const submitFeedbackValidation = [
    body('project').notEmpty().withMessage('Project is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')
];

router.use(protect);

router.get('/project/:projectId', getFeedbacks);
router.get('/project/:projectId/stats', getFeedbackStats);

router.route('/')
    .post(submitFeedbackValidation, handleValidation, submitFeedback);

router.route('/:id')
    .get(getFeedback)
    .delete(adminOnly, deleteFeedback);

router.put('/:id/respond', adminSubadminOnly, respondToFeedback);

module.exports = router;
