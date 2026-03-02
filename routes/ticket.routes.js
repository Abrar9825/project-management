const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
    getTickets,
    getTicket,
    createTicket,
    updateTicket,
    addTicketRemark,
    deleteTicket,
    getTicketStats
} = require('../controllers/ticket.controller');

const { protect, adminOnly, adminSubadminOnly } = require('../middleware/auth.middleware');
const { handleValidation } = require('../middleware/validation.middleware');

const createTicketValidation = [
    body('project').notEmpty().withMessage('Project is required'),
    body('title').trim().notEmpty().withMessage('Ticket title is required'),
    body('type').isIn(['bug-fix', 'support', 'feature-request', 'version-update', 'general']).withMessage('Invalid ticket type')
];

router.use(protect);

router.get('/project/:projectId', getTickets);
router.get('/project/:projectId/stats', getTicketStats);

router.route('/')
    .post(createTicketValidation, handleValidation, createTicket);

router.route('/:id')
    .get(getTicket)
    .put(updateTicket)
    .delete(adminOnly, deleteTicket);

router.post('/:id/remarks', body('text').trim().notEmpty().withMessage('Remark text is required'), handleValidation, addTicketRemark);

module.exports = router;
