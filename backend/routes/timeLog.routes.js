const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
    getTimeLogs,
    createTimeLog,
    getMyTimeLogs,
    getMyTimeStats,
    deleteTimeLog,
    getProjectTimeStats
} = require('../controllers/timeLog.controller');

const { protect, adminSubadminOnly } = require('../middleware/auth.middleware');
const { handleValidation } = require('../middleware/validation.middleware');

// Validation rules
const createTimeLogValidation = [
    body('task').notEmpty().withMessage('Task is required'),
    body('duration').isNumeric().withMessage('Valid duration is required')
];

// Apply protect middleware to all routes
router.use(protect);

// My time log routes
router.get('/my', getMyTimeLogs);
router.get('/my/stats', getMyTimeStats);

// General routes
router.route('/')
    .get(getTimeLogs)
    .post(createTimeLogValidation, handleValidation, createTimeLog);

router.delete('/:id', deleteTimeLog);

// Project time stats (Admin/SubAdmin only)
router.get('/project/:projectId/stats', adminSubadminOnly, getProjectTimeStats);

module.exports = router;
