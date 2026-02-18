const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
    getTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,
    getMyTasks,
    getMyCompletedTasks,
    startTask,
    completeTask,
    getTaskStats
} = require('../controllers/task.controller');

const { protect, adminOnly, adminSubadminOnly } = require('../middleware/auth.middleware');
const { handleValidation } = require('../middleware/validation.middleware');

// Validation rules
const createTaskValidation = [
    body('project').notEmpty().withMessage('Project is required'),
    body('title').trim().notEmpty().withMessage('Task title is required'),
    body('role').isIn(['Frontend Dev', 'Backend Dev', 'Designer', 'QA', 'DevOps', 'Project Manager']).withMessage('Invalid role'),
    body('deadline').isISO8601().withMessage('Valid deadline is required')
];

// Apply protect middleware to all routes
router.use(protect);

// My tasks routes (for all users)
router.get('/my', getMyTasks);
router.get('/my/completed', getMyCompletedTasks);

// Stats route
router.get('/stats', getTaskStats);

// Task CRUD routes
router.route('/')
    .get(getTasks)
    .post(adminSubadminOnly, createTaskValidation, handleValidation, createTask);

router.route('/:id')
    .get(getTask)
    .put(updateTask)
    .delete(adminOnly, deleteTask);

// Start / Complete task
router.put('/:id/start', startTask);
router.put('/:id/complete', completeTask);

module.exports = router;
