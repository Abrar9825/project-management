const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
    createLead,
    getLeads,
    getLead,
    updateLead,
    deleteLead,
    uploadDocument,
    deleteDocument,
    convertToProject,
    uploadMiddleware
} = require('../controllers/lead.controller');

// Protect all routes
router.use(protect);

// ======================== LEAD CRUD ROUTES ========================

// @route   POST /api/leads
// @desc    Create new lead (with optional file upload)
// @access  Private/Admin
router.post('/', uploadMiddleware, createLead);

// @route   GET /api/leads
// @desc    Get all leads with filtering
// @access  Private/Admin
router.get('/', getLeads);

// @route   GET /api/leads/:id
// @desc    Get single lead
// @access  Private
router.get('/:id', getLead);

// @route   PUT /api/leads/:id
// @desc    Update lead
// @access  Private/Admin
router.put('/:id', updateLead);

// @route   DELETE /api/leads/:id
// @desc    Delete lead
// @access  Private/Admin
router.delete('/:id', deleteLead);

// ======================== DOCUMENT ROUTES ========================

// @route   POST /api/leads/:id/upload
// @desc    Upload document(s) to lead
// @access  Private
router.post('/:id/upload', uploadMiddleware, uploadDocument);

// @route   DELETE /api/leads/:id/documents/:docId
// @desc    Delete document from lead
// @access  Private/Admin
router.delete('/:id/documents/:docId', deleteDocument);

// ======================== CONVERSION ROUTES ========================

// @route   POST /api/leads/:id/convert-to-project
// @desc    Convert lead to project
// @access  Private/Admin
router.post('/:id/convert-to-project', convertToProject);

module.exports = router;
