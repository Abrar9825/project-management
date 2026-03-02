const Document = require('../models/Document.model');
const Project = require('../models/Project.model');
const { Activity } = require('../models/Activity.model');

// @desc    Get all documents for a project
// @route   GET /api/documents/project/:projectId
// @access  Private
exports.getDocuments = async (req, res) => {
    try {
        let query = { project: req.params.projectId };
        if (req.query.type) query.type = req.query.type;

        const documents = await Document.find(query)
            .populate('generatedBy', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: documents.length, data: documents });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Get single document
// @route   GET /api/documents/:id
// @access  Private
exports.getDocument = async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id)
            .populate('generatedBy', 'name')
            .populate('approvedBy', 'name');

        if (!doc) return res.status(404).json({ success: false, error: 'Document not found' });

        res.status(200).json({ success: true, data: doc });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Create document
// @route   POST /api/documents
// @access  Private/Admin/SubAdmin
exports.createDocument = async (req, res) => {
    try {
        const { project, type, title, content, fields, stage } = req.body;

        const projectDoc = await Project.findById(project);
        if (!projectDoc) return res.status(404).json({ success: false, error: 'Project not found' });

        const doc = await Document.create({
            project,
            projectName: projectDoc.name,
            type,
            title,
            content: content || '',
            fields: fields || {},
            stage: stage || '',
            generatedBy: req.user.id,
            generatedByName: req.user.name
        });

        // Log activity
        await Activity.create({
            project,
            user: req.user.id,
            userName: req.user.name,
            action: `created ${type} document: "${title}"`,
            icon: '📄',
            type: 'general'
        });

        res.status(201).json({ success: true, data: doc });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Update document
// @route   PUT /api/documents/:id
// @access  Private/Admin/SubAdmin
exports.updateDocument = async (req, res) => {
    try {
        let doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ success: false, error: 'Document not found' });

        doc = await Document.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

        res.status(200).json({ success: true, data: doc });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Approve document
// @route   PUT /api/documents/:id/approve
// @access  Private/Admin
exports.approveDocument = async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ success: false, error: 'Document not found' });

        doc.status = 'approved';
        doc.approvedBy = req.user.id;
        doc.approvedByName = req.user.name;
        doc.approvedAt = new Date();
        await doc.save();

        await Activity.create({
            project: doc.project,
            user: req.user.id,
            userName: req.user.name,
            action: `approved document: "${doc.title}"`,
            icon: '✅',
            type: 'general'
        });

        res.status(200).json({ success: true, data: doc });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private/Admin
exports.deleteDocument = async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ success: false, error: 'Document not found' });

        await doc.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Generate Quotation from project data
// @route   POST /api/documents/generate-quotation/:projectId
// @access  Private/Admin
exports.generateQuotation = async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

        const { items, tax, discount, validUntil, terms, notes } = req.body;

        const subtotal = (items || []).reduce((sum, item) => sum + (item.quantity * item.rate), 0);
        const total = subtotal + (tax || 0) - (discount || 0);

        const doc = await Document.create({
            project: project._id,
            projectName: project.name,
            type: 'quotation',
            title: `Quotation - ${project.name}`,
            status: 'draft',
            fields: {
                quotation: {
                    items: (items || []).map(i => ({ ...i, amount: i.quantity * i.rate })),
                    subtotal,
                    tax: tax || 0,
                    discount: discount || 0,
                    total,
                    validUntil: validUntil || null,
                    terms: terms || '',
                    notes: notes || ''
                }
            },
            stage: 'Requirement',
            generatedBy: req.user.id,
            generatedByName: req.user.name
        });

        await Activity.create({
            project: project._id,
            user: req.user.id,
            userName: req.user.name,
            action: `generated quotation for $${total.toLocaleString()}`,
            icon: '🧾',
            type: 'general'
        });

        res.status(201).json({ success: true, data: doc });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Generate Handover Document
// @route   POST /api/documents/generate-handover/:projectId
// @access  Private/Admin
exports.generateHandover = async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

        // Auto-populate from project stages
        const hostingStage = project.stages.find(s => s.name === 'Hosting & Deployment');
        const frontendStage = project.stages.find(s => s.name === 'Frontend');
        const backendStage = project.stages.find(s => s.name === 'Backend');

        const repoLinks = [];
        if (frontendStage && frontendStage.repoUrl) repoLinks.push(frontendStage.repoUrl);
        if (backendStage && backendStage.repoUrl) repoLinks.push(backendStage.repoUrl);

        const doc = await Document.create({
            project: project._id,
            projectName: project.name,
            type: 'handover',
            title: `Delivery Handover - ${project.name}`,
            status: 'draft',
            fields: {
                handover: {
                    hostingDetails: hostingStage ? (hostingStage.hostingProvider || '') : '',
                    domain: hostingStage ? (hostingStage.domainUrl || '') : '',
                    repoLinks,
                    credentials: req.body.credentials || [],
                    deploymentNotes: req.body.deploymentNotes || '',
                    techStack: req.body.techStack || [],
                    maintenanceInstructions: req.body.maintenanceInstructions || ''
                }
            },
            stage: 'Delivery',
            generatedBy: req.user.id,
            generatedByName: req.user.name
        });

        await Activity.create({
            project: project._id,
            user: req.user.id,
            userName: req.user.name,
            action: 'generated delivery handover document',
            icon: '📦',
            type: 'general'
        });

        res.status(201).json({ success: true, data: doc });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Generate document with AI from description
// @route   POST /api/documents/generate-ai
// @access  Private
exports.generateDocumentWithAI = async (req, res) => {
    try {
        const { project: projectId, type, description } = req.body;

        if (!projectId || !type || !description) {
            return res.status(400).json({ 
                success: false, 
                error: 'project, type, and description are required' 
            });
        }

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        // Import AI service
        const aiService = require('../services/aiService');

        // Generate document using AI from description
        const generatedContent = await aiService.generateDocumentFromDescription(type, description, project);

        if (!generatedContent) {
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to generate document with AI. Please try again.' 
            });
        }

        // Create document in database
        const title = generatedContent.title || type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ');
        
        const doc = await Document.create({
            project: projectId,
            projectName: project.name,
            type,
            title: title,
            content: JSON.stringify(generatedContent),
            status: 'draft',
            stage: 'Generated',
            generatedBy: req.user.id,
            generatedByName: req.user.name
        });

        // Log activity
        await Activity.create({
            project: projectId,
            user: req.user.id,
            userName: req.user.name,
            action: `generated ${type} document with AI: "${title}"`,
            icon: '🤖',
            type: 'general'
        });

        res.status(201).json({ success: true, data: doc });
    } catch (err) {
        console.error('AI Document Generation Error:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message || 'Failed to generate document with AI' 
        });
    }
};
