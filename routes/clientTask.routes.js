const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
    getClientTasks,
    createClientTask,
    startClientTask,
    completeClientTask,
    deleteClientTask
} = require('../controllers/clientTask.controller');

router.get('/:projectId', protect, getClientTasks);
router.post('/:projectId', protect, createClientTask);
router.put('/:id/start', protect, startClientTask);
router.put('/:id/complete', protect, completeClientTask);
router.delete('/:id', protect, deleteClientTask);

module.exports = router;
