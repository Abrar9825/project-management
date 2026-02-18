const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
    getMeetings,
    getUpcomingMeetings,
    getMeeting,
    createMeeting,
    updateMeeting,
    deleteMeeting
} = require('../controllers/meeting.controller');

const { protect, adminOnly, adminSubadminOnly } = require('../middleware/auth.middleware');
const { handleValidation } = require('../middleware/validation.middleware');

const createMeetingValidation = [
    body('project').notEmpty().withMessage('Project is required'),
    body('title').trim().notEmpty().withMessage('Meeting title is required'),
    body('scheduledAt').notEmpty().withMessage('Meeting date/time is required')
];

router.use(protect);

router.get('/project/:projectId', getMeetings);
router.get('/project/:projectId/upcoming', getUpcomingMeetings);

router.route('/')
    .post(adminSubadminOnly, createMeetingValidation, handleValidation, createMeeting);

router.route('/:id')
    .get(getMeeting)
    .put(adminSubadminOnly, updateMeeting)
    .delete(adminOnly, deleteMeeting);

module.exports = router;
