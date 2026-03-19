const express = require('express');
const router = express.Router();
const {
    getClientTasks,
    createClientTask,
    startClientTask,
    completeClientTask,
    deleteClientTask
} = require('../controllers/clientTask.controller');

router.get('/:projectId', getClientTasks);
router.post('/:projectId', createClientTask);
router.put('/:id/start', startClientTask);
router.put('/:id/complete', completeClientTask);
router.delete('/:id', deleteClientTask);

module.exports = router;
