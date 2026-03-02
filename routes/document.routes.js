const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
    getDocuments,
    getDocument,
    createDocument,
    updateDocument,
    approveDocument,
    deleteDocument,
    generateQuotation,
    generateHandover,
    generateDocumentWithAI
} = require('../controllers/document.controller');

const { protect, adminOnly, adminSubadminOnly } = require('../middleware/auth.middleware');
const { handleValidation } = require('../middleware/validation.middleware');

const createDocValidation = [
    body('project').notEmpty().withMessage('Project is required'),
    body('type').isIn(['requirement', 'quotation', 'agreement', 'design-brief', 'handover']).withMessage('Invalid document type'),
    body('title').trim().notEmpty().withMessage('Document title is required')
];

router.use(protect);

router.get('/project/:projectId', getDocuments);
router.post('/generate-ai', generateDocumentWithAI);
router.post('/generate-quotation/:projectId', adminOnly, generateQuotation);
router.post('/generate-handover/:projectId', adminOnly, generateHandover);

router.route('/')
    .post(adminSubadminOnly, createDocValidation, handleValidation, createDocument);

router.route('/:id')
    .get(getDocument)
    .put(adminSubadminOnly, updateDocument)
    .delete(adminOnly, deleteDocument);

router.put('/:id/approve', adminOnly, approveDocument);

module.exports = router;
