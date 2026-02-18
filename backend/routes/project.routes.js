const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    updateStage,
    updateStageItem,
    addActivity,
    getActivities,
    addRemark,
    getRemarks,
    getProjectStats,
    // New features
    computeBlockers,
    submitStageForApproval,
    subadminReviewStage,
    adminApproveStage,
    enterMaintenanceMode,
    getProjectHealth,
    addAssetRequest,
    updateAssetRequest,
    getStagePdfData,
    getClientView,
    toggleStageVisibility,
    linkPaymentToStage
} = require('../controllers/project.controller');

const { protect, adminOnly, adminSubadminOnly } = require('../middleware/auth.middleware');
const { handleValidation } = require('../middleware/validation.middleware');

// Validation rules
const createProjectValidation = [
    body('name').trim().notEmpty().withMessage('Project name is required'),
    body('client').trim().notEmpty().withMessage('Client name is required'),
    body('type').isIn(['web', 'mobile', 'desktop', 'ecommerce', 'crm', 'api', 'other']).withMessage('Invalid project type'),
    body('priority').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority')
];

// Apply protect middleware to all routes
router.use(protect);

// Project routes
router.route('/')
    .get(adminSubadminOnly, getProjects)
    .post(adminOnly, createProjectValidation, handleValidation, createProject);

router.get('/stats', adminOnly, getProjectStats);

router.route('/:id')
    .get(getProject)
    .put(adminOnly, updateProject)
    .delete(adminOnly, deleteProject);

// Stage routes
router.put('/:id/stages/:stageId', adminSubadminOnly, updateStage);
router.put('/:id/stages/:stageId/items/:itemId', adminSubadminOnly, updateStageItem);

// Activity routes
router.route('/:id/activities')
    .get(getActivities)
    .post(addActivity);

// Remark routes
router.route('/:id/remarks')
    .get(getRemarks)
    .post(body('text').trim().notEmpty().withMessage('Remark text is required'), handleValidation, addRemark);

// ===== NEW: Blocker Engine =====
router.get('/:id/blockers', computeBlockers);

// ===== NEW: Project Health =====
router.get('/:id/health', getProjectHealth);

// ===== NEW: Client View =====
router.get('/:id/client-view', getClientView);

// ===== NEW: Approval Workflow =====
router.put('/:id/stages/:stageId/submit-approval', adminSubadminOnly, submitStageForApproval);
router.put('/:id/stages/:stageId/subadmin-review', adminSubadminOnly, subadminReviewStage);
router.put('/:id/stages/:stageId/admin-approve', adminOnly, adminApproveStage);

// ===== NEW: Stage Visibility & Payment Linking =====
router.put('/:id/stages/:stageId/visibility', adminOnly, toggleStageVisibility);
router.put('/:id/stages/:stageId/link-payment', adminOnly, linkPaymentToStage);

// ===== NEW: Asset Requests =====
router.post('/:id/stages/:stageId/asset-requests', adminSubadminOnly, addAssetRequest);
router.put('/:id/stages/:stageId/asset-requests/:assetId', adminSubadminOnly, updateAssetRequest);

// ===== NEW: Stage PDF Data =====
router.get('/:id/stages/:stageId/pdf-data', getStagePdfData);

// ===== NEW: Maintenance Mode =====
router.put('/:id/maintenance', adminOnly, enterMaintenanceMode);

module.exports = router;
