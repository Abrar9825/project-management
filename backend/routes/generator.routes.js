const express = require('express');
const router = express.Router();

const {
    generateDocument,
    generateAll,
    regenerateDocument,
    getDocumentCenter,
    sendToClient,
    getClientDocuments,
    generateMonthlyReportRecord,
    getMonthlyReports
} = require('../controllers/generator.controller');

const { protect, adminOnly, adminSubadminOnly } = require('../middleware/auth.middleware');

router.use(protect);

// Document Center - All documents for a project
router.get('/:projectId/documents', getDocumentCenter);

// Client-visible documents
router.get('/:projectId/client-documents', getClientDocuments);

// Monthly reports
router.get('/:projectId/monthly-reports', getMonthlyReports);
router.post('/:projectId/monthly-report', adminSubadminOnly, generateMonthlyReportRecord);

// Generate specific document type
router.post('/:projectId/generate/:docType', adminSubadminOnly, generateDocument);

// Generate ALL documents
router.post('/:projectId/generate-all', adminOnly, generateAll);

// Regenerate a document type
router.post('/:projectId/regenerate/:docType', adminSubadminOnly, regenerateDocument);

// Send document to client
router.put('/documents/:docId/send-to-client', adminSubadminOnly, sendToClient);

module.exports = router;
