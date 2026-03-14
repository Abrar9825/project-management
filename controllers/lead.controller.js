const Lead = require('../models/Lead.model');
const Project = require('../models/Project.model');
const User = require('../models/User.model');
const { Activity } = require('../models/Activity.model');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ======================== MULTER CONFIGURATION ========================

// Ensure lead uploads directory exists
const leadUploadsDir = path.join(__dirname, '../public/uploads/leads');
if (!fs.existsSync(leadUploadsDir)) {
    fs.mkdirSync(leadUploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, leadUploadsDir);
    },
    filename: (req, file, cb) => {
        const leadId = req.params.id || 'new';
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `${leadId}_${timestamp}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMimes = ['application/msword', 
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                         'application/pdf',
                         'text/plain'];
    const allowedExts = ['.doc', '.docx', '.pdf', '.txt'];
    
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Only DOC, DOCX, PDF, and TXT files are allowed'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

exports.uploadMiddleware = upload.array('documents', 10); // Max 10 files

// ======================== CONTROLLER FUNCTIONS ========================

// @desc    Create a new lead
// @route   POST /api/leads
// @access  Private/Admin
exports.createLead = async (req, res) => {
    try {
        const { firstName, lastName, company, email, phone, description, projectType, budget, leadSource } = req.body;

        // Validate required fields
        if (!firstName || !company || !email) {
            return res.status(400).json({
                success: false,
                error: 'firstName, company, and email are required'
            });
        }

        // Process uploaded files
        let attachments = [];
        if (req.files && req.files.length > 0) {
            attachments = req.files.map(file => ({
                filename: file.filename,
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                filePath: `/uploads/leads/${file.filename}`,
                uploadedBy: req.user.id
            }));
        }

        const lead = await Lead.create({
            firstName,
            lastName,
            company,
            email,
            phone,
            description,
            projectType,
            budget,
            leadSource,
            attachments,
            createdBy: req.user.id,
            status: 'new'
        });

        // Log activity
        await Activity.create({
            user: req.user.id,
            userName: req.user.name,
            action: `created new lead for ${company}`,
            icon: '📌',
            type: 'lead'
        });

        res.status(201).json({
            success: true,
            data: lead
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Get all leads
// @route   GET /api/leads
// @access  Private/Admin
exports.getLeads = async (req, res) => {
    try {
        let query = {};

        // Filter by status
        if (req.query.status) {
            query.status = req.query.status;
        }

        // Search by company or email
        if (req.query.search) {
            query.$or = [
                { company: { $regex: req.query.search, $options: 'i' } },
                { email: { $regex: req.query.search, $options: 'i' } },
                { firstName: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        // Filter by conversion status
        if (req.query.converted === 'true') {
            query.convertedToProjectId = { $ne: null };
        } else if (req.query.converted === 'false') {
            query.convertedToProjectId = null;
        }

        const leads = await Lead.find(query)
            .populate('createdBy', 'name email')
            .populate('assignedTo', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: leads.length,
            data: leads
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Get single lead
// @route   GET /api/leads/:id
// @access  Private
exports.getLead = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id)
            .populate('createdBy', 'name email')
            .populate('assignedTo', 'name email')
            .populate('convertedToProjectId', 'name');

        if (!lead) {
            return res.status(404).json({
                success: false,
                error: 'Lead not found'
            });
        }

        res.status(200).json({
            success: true,
            data: lead
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Update lead
// @route   PUT /api/leads/:id
// @access  Private/Admin
exports.updateLead = async (req, res) => {
    try {
        const { firstName, lastName, company, email, phone, description, projectType, budget, status, assignedTo } = req.body;

        let lead = await Lead.findById(req.params.id);

        if (!lead) {
            return res.status(404).json({
                success: false,
                error: 'Lead not found'
            });
        }

        // Update fields
        if (firstName) lead.firstName = firstName;
        if (lastName) lead.lastName = lastName;
        if (company) lead.company = company;
        if (email) lead.email = email;
        if (phone) lead.phone = phone;
        if (description) lead.description = description;
        if (projectType) lead.projectType = projectType;
        if (budget !== undefined) lead.budget = budget;

        // Handle status change
        if (status && status !== lead.status) {
            lead.status = status;
            lead.lastStatusChange = new Date();
        }

        // Handle assignment
        if (assignedTo) {
            lead.assignedTo = assignedTo;
            const assignedUser = await User.findById(assignedTo);
            lead.assignedByName = assignedUser ? assignedUser.name : '';
            lead.assignedDate = new Date();
        }

        lead = await lead.save();

        // Log activity
        await Activity.create({
            user: req.user.id,
            userName: req.user.name,
            action: `updated lead for ${lead.company}`,
            icon: '📝',
            type: 'lead'
        });

        res.status(200).json({
            success: true,
            data: lead
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Delete lead
// @route   DELETE /api/leads/:id
// @access  Private/Admin
exports.deleteLead = async (req, res) => {
    try {
        const lead = await Lead.findByIdAndDelete(req.params.id);

        if (!lead) {
            return res.status(404).json({
                success: false,
                error: 'Lead not found'
            });
        }

        // Delete attached files
        if (lead.attachments && lead.attachments.length > 0) {
            lead.attachments.forEach(attachment => {
                const filePath = path.join(__dirname, '../public', attachment.filePath);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
        }

        // Log activity
        await Activity.create({
            user: req.user.id,
            userName: req.user.name,
            action: `deleted lead for ${lead.company}`,
            icon: '🗑️',
            type: 'lead'
        });

        res.status(200).json({
            success: true,
            message: 'Lead deleted successfully'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Upload document to lead
// @route   POST /api/leads/:id/upload
// @access  Private
exports.uploadDocument = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);

        if (!lead) {
            return res.status(404).json({
                success: false,
                error: 'Lead not found'
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No files uploaded'
            });
        }

        // Add files to attachments
        const newAttachments = req.files.map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            filePath: `/uploads/leads/${file.filename}`,
            uploadedBy: req.user.id
        }));

        lead.attachments.push(...newAttachments);
        await lead.save();

        res.status(200).json({
            success: true,
            message: `${req.files.length} file(s) uploaded successfully`,
            data: lead
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Delete document from lead
// @route   DELETE /api/leads/:id/documents/:docId
// @access  Private/Admin
exports.deleteDocument = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);

        if (!lead) {
            return res.status(404).json({
                success: false,
                error: 'Lead not found'
            });
        }

        const attachment = lead.attachments.id(req.params.docId);

        if (!attachment) {
            return res.status(404).json({
                success: false,
                error: 'Document not found'
            });
        }

        // Delete file from filesystem
        const filePath = path.join(__dirname, '../public', attachment.filePath);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Remove from database
        lead.attachments.id(req.params.docId).deleteOne();
        await lead.save();

        res.status(200).json({
            success: true,
            message: 'Document deleted successfully',
            data: lead
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Convert lead to project
// @route   POST /api/leads/:id/convert-to-project
// @access  Private/Admin
exports.convertToProject = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);

        if (!lead) {
            return res.status(404).json({
                success: false,
                error: 'Lead not found'
            });
        }

        const { projectName, team, totalAmount, advancePercent, priority, dueDate } = req.body;

        if (!projectName) {
            return res.status(400).json({
                success: false,
                error: 'projectName is required'
            });
        }

        // Default stages template (from project controller)
        const defaultStages = [
            { name: 'Requirement', status: 'pending', type: 'checklist', icon: '📋', order: 1, gradient: 'stage-gradient-1', items: [
                { text: 'Gather client requirements', done: false },
                { text: 'Create requirement document', done: false },
                { text: 'Get client approval', done: false },
                { text: 'Define technical specifications', done: false }
            ]},
            { name: 'Design', status: 'pending', type: 'checklist', icon: '🎨', order: 2, gradient: 'stage-gradient-2', items: [
                { text: 'Create wireframes', done: false },
                { text: 'Design UI mockups', done: false },
                { text: 'Create design system', done: false },
                { text: 'Get design approval', done: false }
            ]},
            { name: 'Frontend', status: 'pending', type: 'development', icon: '💻', order: 3, gradient: 'stage-gradient-3' },
            { name: 'Backend', status: 'pending', type: 'development', icon: '⚙️', order: 4, gradient: 'stage-gradient-4' },
            { name: 'QA Testing', status: 'pending', type: 'checklist', icon: '🔍', order: 5, gradient: 'stage-gradient-5', items: [
                { text: 'Create test cases', done: false },
                { text: 'Functional testing', done: false },
                { text: 'Performance testing', done: false },
                { text: 'Security testing', done: false },
                { text: 'UAT with client', done: false }
            ]},
            { name: 'Hosting & Deployment', status: 'pending', type: 'hosting', icon: '☁️', order: 6, gradient: 'stage-gradient-6' },
            { name: 'Delivery', status: 'pending', type: 'delivery', icon: '🚀', order: 7, gradient: 'stage-gradient-7', deliveries: [
                { name: 'Beta Release', approved: false },
                { name: 'Final Release', approved: false },
                { name: 'Production Deploy', approved: false }
            ]}
        ];

        // Create project from lead
        const project = await Project.create({
            name: projectName,
            client: `${lead.firstName} ${lead.lastName}`.trim(),
            type: lead.projectType,
            priority: priority || 'medium',
            startDate: new Date(),
            dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            description: lead.description,
            totalAmount: totalAmount || lead.budget || 0,
            advancePercent: advancePercent || 50,
            team: team || [],
            stages: defaultStages,
            createdBy: req.user.id,
            clientAccess: {
                enabled: true,
                clientName: `${lead.firstName} ${lead.lastName}`.trim(),
                clientEmail: lead.email
            }
        });

        // Mark lead as converted
        lead.convertedToProjectId = project._id;
        lead.convertedDate = new Date();
        lead.status = 'converted';
        await lead.save();

        // Log activity
        await Activity.create({
            user: req.user.id,
            userName: req.user.name,
            action: `converted lead "${lead.company}" to project "${projectName}"`,
            icon: '🎯',
            type: 'lead'
        });

        res.status(201).json({
            success: true,
            message: 'Lead converted to project successfully',
            data: {
                lead,
                project
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};
