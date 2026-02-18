const Document = require('../models/Document.model');
const Project = require('../models/Project.model');
const { ClientPayment } = require('../models/Payment.model');
const Task = require('../models/Task.model');
const TimeLog = require('../models/TimeLog.model');
const Feedback = require('../models/Feedback.model');
const Meeting = require('../models/Meeting.model');
const MonthlyReport = require('../models/MonthlyReport.model');
const { Activity } = require('../models/Activity.model');
const DocumentGenerator = require('../services/documentGenerator');

// @desc    Generate a specific document type
// @route   POST /api/generator/:projectId/generate/:docType
// @access  Private/Admin/SubAdmin
exports.generateDocument = async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId)
            .populate('team.user', 'name email');
        if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

        const docType = req.params.docType;
        let doc;

        switch (docType) {
            case 'contract':
                doc = await DocumentGenerator.generateContract(project, req.user);
                break;
            case 'welcome-doc':
                doc = await DocumentGenerator.generateWelcomeDoc(project, req.user);
                break;
            case 'payment-plan':
                doc = await DocumentGenerator.generatePaymentPlan(project, req.user);
                break;
            case 'client-access-sheet':
                doc = await DocumentGenerator.generateClientAccessSheet(project, req.user);
                break;
            case 'fulfillment-plan':
                doc = await DocumentGenerator.generateFulfillmentPlan(project, req.user);
                break;
            case 'tracking-sheet':
                doc = await DocumentGenerator.generateTrackingSheet(project, req.user);
                break;
            case 'monthly-report':
                doc = await DocumentGenerator.generateMonthlyReport(project, req.user, req.body.month, req.body.year);
                break;
            case 'stage-summary':
                if (!req.body.stageId) return res.status(400).json({ success: false, error: 'stageId is required' });
                doc = await DocumentGenerator.generateStageSummary(project, req.body.stageId, req.user);
                break;
            case 'handover':
                doc = await DocumentGenerator.generateHandoverKit(project, req.user);
                break;
            case 'maintenance-agreement':
                doc = await DocumentGenerator.generateMaintenanceAgreement(project, req.user);
                break;
            default:
                return res.status(400).json({ success: false, error: `Unknown document type: ${docType}` });
        }

        res.status(201).json({ success: true, data: doc });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Generate ALL documents for a project
// @route   POST /api/generator/:projectId/generate-all
// @access  Private/Admin
exports.generateAll = async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId)
            .populate('team.user', 'name email');
        if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

        const results = await DocumentGenerator.generateAll(project, req.user);

        res.status(201).json({ success: true, data: results });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Regenerate a document (delete old + create new)
// @route   POST /api/generator/:projectId/regenerate/:docType
// @access  Private/Admin/SubAdmin
exports.regenerateDocument = async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId)
            .populate('team.user', 'name email');
        if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

        const docType = req.params.docType;

        // Delete existing documents of this type
        await Document.deleteMany({ project: project._id, type: docType });

        // Generate new one
        let doc;
        switch (docType) {
            case 'contract':
                doc = await DocumentGenerator.generateContract(project, req.user);
                break;
            case 'welcome-doc':
                doc = await DocumentGenerator.generateWelcomeDoc(project, req.user);
                break;
            case 'payment-plan':
                doc = await DocumentGenerator.generatePaymentPlan(project, req.user);
                break;
            case 'client-access-sheet':
                doc = await DocumentGenerator.generateClientAccessSheet(project, req.user);
                break;
            case 'fulfillment-plan':
                doc = await DocumentGenerator.generateFulfillmentPlan(project, req.user);
                break;
            case 'tracking-sheet':
                doc = await DocumentGenerator.generateTrackingSheet(project, req.user);
                break;
            case 'monthly-report':
                doc = await DocumentGenerator.generateMonthlyReport(project, req.user, req.body.month, req.body.year);
                break;
            case 'handover':
                doc = await DocumentGenerator.generateHandoverKit(project, req.user);
                break;
            case 'maintenance-agreement':
                doc = await DocumentGenerator.generateMaintenanceAgreement(project, req.user);
                break;
            default:
                return res.status(400).json({ success: false, error: `Unknown document type: ${docType}` });
        }

        res.status(201).json({ success: true, data: doc });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Get all generated documents for a project (Document Center)
// @route   GET /api/generator/:projectId/documents
// @access  Private
exports.getDocumentCenter = async (req, res) => {
    try {
        const documents = await Document.find({ project: req.params.projectId })
            .populate('generatedBy', 'name')
            .sort({ createdAt: -1 });

        // Group by type
        const grouped = {};
        documents.forEach(doc => {
            if (!grouped[doc.type]) grouped[doc.type] = [];
            grouped[doc.type].push(doc);
        });

        res.status(200).json({
            success: true,
            count: documents.length,
            data: documents,
            grouped
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Send document to client (mark as sent)
// @route   PUT /api/generator/documents/:docId/send-to-client
// @access  Private/Admin/SubAdmin
exports.sendToClient = async (req, res) => {
    try {
        const doc = await Document.findById(req.params.docId);
        if (!doc) return res.status(404).json({ success: false, error: 'Document not found' });

        doc.status = 'sent';
        await doc.save();

        await Activity.create({
            project: doc.project,
            user: req.user.id,
            userName: req.user.name,
            action: `sent "${doc.title}" to client`,
            icon: '📧',
            type: 'general'
        });

        res.status(200).json({ success: true, data: doc });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Get client-visible documents for a project
// @route   GET /api/generator/:projectId/client-documents
// @access  Private
exports.getClientDocuments = async (req, res) => {
    try {
        const documents = await Document.find({
            project: req.params.projectId,
            status: { $in: ['sent', 'approved', 'final'] },
            type: { $in: ['contract', 'welcome-doc', 'payment-plan', 'monthly-report', 'fulfillment-plan', 'tracking-sheet', 'handover', 'maintenance-agreement', 'client-access-sheet'] }
        }).sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: documents.length, data: documents });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Generate a Monthly Report and save to MonthlyReport collection
// @route   POST /api/generator/:projectId/monthly-report
// @access  Private/Admin/SubAdmin
exports.generateMonthlyReportRecord = async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

        const now = new Date();
        const month = req.body.month || now.getMonth() + 1;
        const year = req.body.year || now.getFullYear();

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        // Get tasks
        const tasks = await Task.find({ project: project._id });
        const completedTasks = tasks.filter(t => t.status === 'completed' && t.completedAt >= startDate && t.completedAt <= endDate);

        // Get time logs
        const timeLogs = await TimeLog.find({ project: project._id, date: { $gte: startDate, $lte: endDate } });
        const totalHours = timeLogs.reduce((sum, tl) => sum + tl.duration, 0) / 3600;
        const hoursByMember = {};
        timeLogs.forEach(tl => {
            if (!hoursByMember[tl.userName]) hoursByMember[tl.userName] = 0;
            hoursByMember[tl.userName] += tl.duration / 3600;
        });

        // Get payments
        const payments = await ClientPayment.find({ project: project._id });
        const totalReceived = payments.filter(p => p.status === 'received').reduce((s, p) => s + p.amount, 0);
        const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);

        const report = await MonthlyReport.create({
            project: project._id,
            projectName: project.name,
            reportMonth: month,
            reportYear: year,
            period: { startDate, endDate },
            stageProgress: project.stages.map(s => ({
                stageName: s.name,
                status: s.status,
                progressPercent: s.items && s.items.length > 0
                    ? Math.round(s.items.filter(i => i.done).length / s.items.length * 100)
                    : s.status === 'completed' ? 100 : 0
            })),
            overallProgress: project.progress,
            tasksSummary: {
                total: tasks.length,
                completed: tasks.filter(t => t.status === 'completed').length,
                inProgress: tasks.filter(t => t.status === 'in-progress').length,
                pending: tasks.filter(t => t.status === 'pending').length,
                blocked: tasks.filter(t => t.status === 'blocked').length
            },
            completedTasks: completedTasks.map(t => ({ title: t.title, completedAt: t.completedAt, assignee: t.assigneeName })),
            hoursSummary: {
                totalHours: Math.round(totalHours * 10) / 10,
                byMember: Object.entries(hoursByMember).map(([name, hours]) => ({ name, hours: Math.round(hours * 10) / 10 }))
            },
            paymentSummary: {
                totalAmount: project.totalAmount,
                received: totalReceived,
                pending: totalPending,
                overdue: payments.filter(p => p.status === 'pending' && p.date && new Date(p.date) < now).length,
                payments: payments.map(p => ({ label: p.label, amount: p.amount, status: p.status, date: p.date }))
            },
            generatedBy: req.user.id,
            generatedByName: req.user.name
        });

        // Also generate the document version
        await DocumentGenerator.generateMonthlyReport(project, req.user, month, year);

        res.status(201).json({ success: true, data: report });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Get monthly reports for a project
// @route   GET /api/generator/:projectId/monthly-reports
// @access  Private
exports.getMonthlyReports = async (req, res) => {
    try {
        const reports = await MonthlyReport.find({ project: req.params.projectId })
            .sort({ reportYear: -1, reportMonth: -1 });

        res.status(200).json({ success: true, count: reports.length, data: reports });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
