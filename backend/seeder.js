const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load env vars
dotenv.config();

// Load models
const User = require('./models/User.model');
const Project = require('./models/Project.model');
const Task = require('./models/Task.model');
const { ClientPayment, DeveloperPayment } = require('./models/Payment.model');
const TimeLog = require('./models/TimeLog.model');
const { Activity, Remark } = require('./models/Activity.model');
const Document = require('./models/Document.model');
const SupportTicket = require('./models/SupportTicket.model');
const Meeting = require('./models/Meeting.model');
const Feedback = require('./models/Feedback.model');
const MonthlyReport = require('./models/MonthlyReport.model');
const Fulfillment = require('./models/Fulfillment.model');

// Connect to DB
mongoose.connect(process.env.MONGODB_URI);

// ===== DEFAULT STAGES TEMPLATE =====
const defaultStages = [
    { name: 'Requirement', status: 'completed', type: 'checklist', icon: '📋', order: 1, gradient: 'stage-gradient-1', approved: true, clientVisible: true, items: [
        { text: 'Gather client requirements', done: true },
        { text: 'Create requirement document', done: true },
        { text: 'Get client approval', done: true },
        { text: 'Define technical specifications', done: true }
    ], assetRequests: []},
    { name: 'Design', status: 'completed', type: 'checklist', icon: '🎨', order: 2, gradient: 'stage-gradient-2', approved: true, clientVisible: true, items: [
        { text: 'Create wireframes', done: true },
        { text: 'Design UI mockups', done: true },
        { text: 'Create design system', done: true },
        { text: 'Get design approval', done: true }
    ], assetRequests: []},
    { name: 'Frontend', status: 'in-progress', type: 'development', icon: '💻', order: 3, gradient: 'stage-gradient-3', summary: 'In progress - 70% complete', clientVisible: false, assetRequests: [] },
    { name: 'Backend', status: 'in-progress', type: 'development', icon: '⚙️', order: 4, gradient: 'stage-gradient-4', summary: 'API development ongoing', clientVisible: false, assetRequests: [] },
    { name: 'QA Testing', status: 'pending', type: 'checklist', icon: '🔍', order: 5, gradient: 'stage-gradient-5', clientVisible: false, items: [
        { text: 'Create test cases', done: false },
        { text: 'Functional testing', done: false },
        { text: 'Performance testing', done: false },
        { text: 'Security testing', done: false },
        { text: 'UAT with client', done: false }
    ], assetRequests: []},
    { name: 'Hosting & Deployment', status: 'pending', type: 'hosting', icon: '☁️', order: 6, gradient: 'stage-gradient-6', clientVisible: false, assetRequests: [] },
    { name: 'Delivery', status: 'pending', type: 'delivery', icon: '🚀', order: 7, gradient: 'stage-gradient-7', clientVisible: true, deliveries: [
        { name: 'Beta Release', approved: false },
        { name: 'Final Release', approved: false },
        { name: 'Production Deploy', approved: false }
    ], assetRequests: []}
];

// ===== USERS =====
const users = [
    { name: 'Ahmed Khan', email: 'admin@kinnovance.com', password: 'admin123', role: 'admin', designation: 'CEO & Project Manager', phone: '+92-300-1234567', skills: ['Project Management', 'Strategy', 'Leadership'] },
    { name: 'Sara Ali', email: 'subadmin@kinnovance.com', password: 'subadmin123', role: 'subadmin', designation: 'Team Lead', phone: '+92-301-2345678', skills: ['Team Management', 'Scrum', 'Agile'] },
    { name: 'Bilal Ahmed', email: 'bilal@kinnovance.com', password: 'dev123', role: 'developer', designation: 'Senior Frontend Developer', phone: '+92-302-3456789', skills: ['React', 'Vue.js', 'TailwindCSS', 'TypeScript'] },
    { name: 'Omer Farooq', email: 'omer@kinnovance.com', password: 'dev123', role: 'developer', designation: 'Senior Backend Developer', phone: '+92-303-4567890', skills: ['Node.js', 'Python', 'MongoDB', 'PostgreSQL'] },
    { name: 'Fatima Noor', email: 'fatima@kinnovance.com', password: 'dev123', role: 'developer', designation: 'UI/UX Designer', phone: '+92-304-5678901', skills: ['Figma', 'Adobe XD', 'Photoshop', 'Illustrator'] },
    { name: 'Nadia Hussain', email: 'nadia@kinnovance.com', password: 'dev123', role: 'developer', designation: 'QA Engineer', phone: '+92-305-6789012', skills: ['Selenium', 'Jest', 'Cypress', 'Manual Testing'] },
    { name: 'Imran Ali', email: 'imran@kinnovance.com', password: 'dev123', role: 'developer', designation: 'DevOps Engineer', phone: '+92-306-7890123', skills: ['Docker', 'AWS', 'CI/CD', 'Kubernetes'] },
    // Client users
    { name: 'Raza Malik', email: 'raza@techmart.com', password: 'client123', role: 'client', designation: 'CTO', phone: '+92-310-1111111' },
    { name: 'Amna Sheikh', email: 'amna@globalcorp.com', password: 'client123', role: 'client', designation: 'HR Director', phone: '+92-311-2222222' },
    { name: 'Hamza Qureshi', email: 'hamza@financehub.com', password: 'client123', role: 'client', designation: 'Product Manager', phone: '+92-312-3333333' },
    { name: 'Zara Iqbal', email: 'zara@warehousepro.com', password: 'client123', role: 'client', designation: 'Operations Manager', phone: '+92-313-4444444' }
];

// ===== PROJECTS =====
const projects = [
    {
        name: 'E-Commerce Platform',
        client: 'TechMart Inc.',
        type: 'ecommerce',
        priority: 'high',
        status: 'warning',
        progress: 65,
        currentStage: 'Frontend',
        dueDate: new Date('2026-03-15'),
        startDate: new Date('2026-01-01'),
        totalAmount: 50000,
        advancePercent: 25,
        milestones: 4,
        gradient: 'card-gradient-1',
        description: 'Complete e-commerce solution with multi-vendor marketplace, Stripe/PayPal payment integration, real-time inventory management, advanced product search with filters, customer reviews system, and responsive mobile-first design for TechMart Inc.',
        scopeOfWork: 'Design and develop a fully functional multi-vendor e-commerce platform with shopping cart, secure checkout, payment gateway integration (Stripe & PayPal), product catalog with categories, user authentication, order management dashboard, and admin panel.',
        deliverables: [
            { title: 'UI/UX Design', description: 'Complete Figma designs for all pages', stage: 'Design', status: 'delivered' },
            { title: 'Frontend Application', description: 'React-based SPA with responsive design', stage: 'Frontend', status: 'in-progress' },
            { title: 'Backend API', description: 'RESTful API with Node.js + MongoDB', stage: 'Backend', status: 'in-progress' },
            { title: 'Payment Integration', description: 'Stripe and PayPal integration', stage: 'Backend', status: 'pending' },
            { title: 'Deployment', description: 'AWS deployment with CI/CD pipeline', stage: 'Hosting & Deployment', status: 'pending' }
        ],
        paymentTerms: 'Net 7 days from invoice date. 25% advance on signing, remaining in milestones.',
        paymentMedium: 'bank-transfer',
        latePaymentPolicy: 'Payment overdue by 7 days will result in project pause. 2% late fee per week.',
        clientDetails: {
            name: 'Raza Malik',
            email: 'raza@techmart.com',
            phone: '+92-310-1111111',
            company: 'TechMart Inc.',
            address: 'Office 401, Blue Area, Islamabad',
            contactPerson: 'Raza Malik'
        },
        clientAccess: { enabled: true, clientName: 'Raza Malik', clientEmail: 'raza@techmart.com', clientPhone: '+92-310-1111111' },
        communicationChannels: { primary: 'WhatsApp', secondary: 'Email', meetingSchedule: 'Weekly on Tuesday 3PM', supportEmail: 'support@kinnovance.com', supportPhone: '+92-300-1234567' },
        responsibilities: {
            agency: ['Deliver project as per scope', 'Provide weekly progress reports', 'Maintain code quality standards', '1 month free post-launch support'],
            client: ['Provide timely feedback within 48 hours', 'Supply product catalog data and images', 'Make payments on schedule', 'Designate single point of contact']
        },
        terminationClause: 'Either party may terminate with 30 days written notice. Work completed until termination is non-refundable.',
        confidentialityClause: 'Both parties agree to maintain strict confidentiality of all shared business information, trade secrets, and proprietary data.',
        milestonesData: [
            { title: 'Design Completion', description: 'All UI/UX designs finalized and approved', linkedStage: 'Design', linkedPayment: '1st Milestone', status: 'completed' },
            { title: 'Frontend Alpha', description: 'Frontend MVP with core pages', linkedStage: 'Frontend', linkedPayment: '2nd Milestone', status: 'in-progress' },
            { title: 'Backend API Ready', description: 'All API endpoints functional', linkedStage: 'Backend', linkedPayment: '3rd Milestone', status: 'pending' },
            { title: 'Final Delivery', description: 'Complete platform deployed and tested', linkedStage: 'Delivery', linkedPayment: 'Final Payment', status: 'pending' }
        ],
        contractSigned: true,
        contractSignedAt: new Date('2025-12-28')
    },
    {
        name: 'HR Management System',
        client: 'Global Corp',
        type: 'crm',
        priority: 'critical',
        status: 'danger',
        progress: 40,
        currentStage: 'Backend',
        dueDate: new Date('2026-02-28'),
        startDate: new Date('2025-12-15'),
        totalAmount: 35000,
        advancePercent: 30,
        milestones: 3,
        gradient: 'card-gradient-2',
        description: 'Enterprise HR management system with employee onboarding, payroll processing, attendance tracking, leave management, performance reviews, and comprehensive reporting dashboard for Global Corp with 500+ employees.',
        scopeOfWork: 'Build a web-based HR management system covering employee records, payroll automation, attendance/leave management, performance evaluation, recruitment workflow, and executive reporting dashboard.',
        deliverables: [
            { title: 'Employee Portal Design', description: 'Complete UI for employee self-service portal', stage: 'Design', status: 'delivered' },
            { title: 'Admin Dashboard', description: 'HR admin dashboard with analytics', stage: 'Frontend', status: 'in-progress' },
            { title: 'Payroll Engine', description: 'Automated payroll calculation system', stage: 'Backend', status: 'in-progress' },
            { title: 'Reports Module', description: 'Customizable HR reports and analytics', stage: 'Backend', status: 'pending' }
        ],
        paymentTerms: 'Net 15 days. 30% advance, 40% on development completion, 30% on delivery.',
        paymentMedium: 'bank-transfer',
        latePaymentPolicy: 'Payment overdue by 7 days results in project pause.',
        clientDetails: {
            name: 'Amna Sheikh',
            email: 'amna@globalcorp.com',
            phone: '+92-311-2222222',
            company: 'Global Corp',
            address: 'Floor 12, Centaurus Mall, Islamabad',
            contactPerson: 'Amna Sheikh'
        },
        clientAccess: { enabled: true, clientName: 'Amna Sheikh', clientEmail: 'amna@globalcorp.com', clientPhone: '+92-311-2222222' },
        communicationChannels: { primary: 'Email', secondary: 'Slack', meetingSchedule: 'Bi-weekly on Thursday 2PM', supportEmail: 'support@kinnovance.com', supportPhone: '+92-300-1234567' },
        responsibilities: {
            agency: ['Deliver project as per scope', 'Provide bi-weekly demos', 'Ensure data security compliance', 'Training sessions for HR team'],
            client: ['Provide sample payroll data', 'Define leave policy rules', 'Feedback within 72 hours', 'Provide test employee data']
        },
        contractSigned: true,
        contractSignedAt: new Date('2025-12-12')
    },
    {
        name: 'Mobile Banking App',
        client: 'FinanceHub',
        type: 'mobile',
        priority: 'high',
        status: 'success',
        progress: 85,
        currentStage: 'QA Testing',
        dueDate: new Date('2026-02-20'),
        startDate: new Date('2025-11-01'),
        totalAmount: 75000,
        advancePercent: 25,
        milestones: 5,
        gradient: 'card-gradient-3',
        description: 'Cross-platform mobile banking application with biometric authentication, real-time transaction processing, bill payments, fund transfers, QR code payments, spending analytics, and push notifications for FinanceHub serving 100K+ users.',
        scopeOfWork: 'Design and develop iOS and Android mobile banking apps using React Native with biometric login, account dashboard, P2P transfers, bill pay, QR payments, transaction history, spending reports, and admin console.',
        deliverables: [
            { title: 'Mobile UI Design', description: 'iOS and Android design specs', stage: 'Design', status: 'delivered' },
            { title: 'React Native App', description: 'Cross-platform mobile application', stage: 'Frontend', status: 'delivered' },
            { title: 'Banking API', description: 'Secure banking transaction APIs', stage: 'Backend', status: 'delivered' },
            { title: 'QA & Security Audit', description: 'Full testing and penetration testing', stage: 'QA Testing', status: 'in-progress' },
            { title: 'App Store Deployment', description: 'Submit to Apple App Store and Google Play', stage: 'Delivery', status: 'pending' }
        ],
        paymentTerms: '25% advance, then milestone-based payments.',
        paymentMedium: 'bank-transfer',
        clientDetails: {
            name: 'Hamza Qureshi',
            email: 'hamza@financehub.com',
            phone: '+92-312-3333333',
            company: 'FinanceHub Ltd.',
            address: 'Tech Park, DHA Phase 6, Lahore',
            contactPerson: 'Hamza Qureshi'
        },
        clientAccess: { enabled: true, clientName: 'Hamza Qureshi', clientEmail: 'hamza@financehub.com', clientPhone: '+92-312-3333333' },
        communicationChannels: { primary: 'Slack', secondary: 'Email', meetingSchedule: 'Weekly on Monday 11AM', supportEmail: 'support@kinnovance.com' },
        responsibilities: {
            agency: ['Deliver secure banking app', 'Weekly security reports', 'Performance optimization', '3 months post-launch support'],
            client: ['Provide banking API documentation', 'Test with real transaction data', 'Regulatory compliance guidance', 'App Store developer accounts']
        },
        contractSigned: true,
        contractSignedAt: new Date('2025-10-28')
    },
    {
        name: 'Inventory Management System',
        client: 'WarehousePro',
        type: 'web',
        priority: 'medium',
        status: 'info',
        progress: 25,
        currentStage: 'Design',
        dueDate: new Date('2026-04-01'),
        startDate: new Date('2026-01-15'),
        totalAmount: 20000,
        advancePercent: 25,
        milestones: 3,
        gradient: 'card-gradient-4',
        description: 'Web-based warehouse inventory management system with barcode scanning, stock level tracking, automated reorder alerts, supplier management, multi-warehouse support, and real-time reporting for WarehousePro managing 3 warehouse locations.',
        scopeOfWork: 'Build inventory management system with product catalog, barcode integration, stock tracking, purchase orders, supplier directory, multi-location support, and customizable reports.',
        deliverables: [
            { title: 'System Design', description: 'Wireframes and database schema', stage: 'Design', status: 'in-progress' },
            { title: 'Web Application', description: 'Full-stack web application', stage: 'Frontend', status: 'pending' },
            { title: 'Barcode Module', description: 'Barcode scanning integration', stage: 'Backend', status: 'pending' }
        ],
        paymentTerms: '25% advance, 50% on development, 25% on delivery.',
        paymentMedium: 'bank-transfer',
        clientDetails: {
            name: 'Zara Iqbal',
            email: 'zara@warehousepro.com',
            phone: '+92-313-4444444',
            company: 'WarehousePro Ltd.',
            address: 'Industrial Area, Faisalabad',
            contactPerson: 'Zara Iqbal'
        },
        clientAccess: { enabled: true, clientName: 'Zara Iqbal', clientEmail: 'zara@warehousepro.com', clientPhone: '+92-313-4444444' },
        communicationChannels: { primary: 'WhatsApp', secondary: 'Email', meetingSchedule: 'Weekly on Wednesday 4PM', supportEmail: 'support@kinnovance.com' },
        responsibilities: {
            agency: ['Deliver project as per scope', 'Weekly progress updates', 'Training for warehouse staff', '1 month free support'],
            client: ['Provide product catalog data', 'Barcode hardware setup', 'Warehouse floor plans', 'Timely feedback']
        },
        contractSigned: true,
        contractSignedAt: new Date('2026-01-10')
    }
];

// ===== IMPORT DATA =====
const importData = async () => {
    try {
        // Clear everything
        await User.deleteMany();
        await Project.deleteMany();
        await Task.deleteMany();
        await ClientPayment.deleteMany();
        await DeveloperPayment.deleteMany();
        await TimeLog.deleteMany();
        await Activity.deleteMany();
        await Remark.deleteMany();
        await Document.deleteMany();
        await SupportTicket.deleteMany();
        await Meeting.deleteMany();
        await Feedback.deleteMany();
        await MonthlyReport.deleteMany();
        await Fulfillment.deleteMany();

        console.log('🗑️  Cleared ALL existing data');

        // ===== CREATE USERS =====
        const createdUsers = await User.create(users);
        console.log(`✅ Created ${createdUsers.length} users`);

        const admin = createdUsers.find(u => u.role === 'admin');
        const subadmin = createdUsers.find(u => u.role === 'subadmin');
        const bilal = createdUsers.find(u => u.email === 'bilal@kinnovance.com');
        const omer = createdUsers.find(u => u.email === 'omer@kinnovance.com');
        const fatima = createdUsers.find(u => u.email === 'fatima@kinnovance.com');
        const nadia = createdUsers.find(u => u.email === 'nadia@kinnovance.com');
        const imran = createdUsers.find(u => u.email === 'imran@kinnovance.com');
        const clientRaza = createdUsers.find(u => u.email === 'raza@techmart.com');
        const clientAmna = createdUsers.find(u => u.email === 'amna@globalcorp.com');
        const clientHamza = createdUsers.find(u => u.email === 'hamza@financehub.com');
        const clientZara = createdUsers.find(u => u.email === 'zara@warehousepro.com');

        // ===== CREATE PROJECTS =====
        const assignTeam = (projIdx) => {
            const teams = [
                [ // E-Commerce
                    { role: 'Project Manager', user: admin._id, name: admin.name },
                    { role: 'Frontend Dev', user: bilal._id, name: bilal.name },
                    { role: 'Backend Dev', user: omer._id, name: omer.name },
                    { role: 'Designer', user: fatima._id, name: fatima.name },
                    { role: 'QA Engineer', user: nadia._id, name: nadia.name }
                ],
                [ // HR System
                    { role: 'Project Manager', user: admin._id, name: admin.name },
                    { role: 'Frontend Dev', user: bilal._id, name: bilal.name },
                    { role: 'Backend Dev', user: omer._id, name: omer.name },
                    { role: 'Designer', user: fatima._id, name: fatima.name },
                    { role: 'QA Engineer', user: nadia._id, name: nadia.name }
                ],
                [ // Mobile Banking
                    { role: 'Project Manager', user: admin._id, name: admin.name },
                    { role: 'Frontend Dev', user: bilal._id, name: bilal.name },
                    { role: 'Backend Dev', user: omer._id, name: omer.name },
                    { role: 'Designer', user: fatima._id, name: fatima.name },
                    { role: 'QA Engineer', user: nadia._id, name: nadia.name },
                    { role: 'DevOps', user: imran._id, name: imran.name }
                ],
                [ // Inventory
                    { role: 'Project Manager', user: admin._id, name: admin.name },
                    { role: 'Frontend Dev', user: bilal._id, name: bilal.name },
                    { role: 'Backend Dev', user: omer._id, name: omer.name },
                    { role: 'Designer', user: fatima._id, name: fatima.name }
                ]
            ];
            return teams[projIdx] || teams[0];
        };

        // Custom stages for each project
        const stageVariations = [
            // E-Commerce - Frontend in progress
            JSON.parse(JSON.stringify(defaultStages)),
            // HR - Backend in progress
            JSON.parse(JSON.stringify(defaultStages)).map(s => {
                if (s.name === 'Frontend') { s.status = 'in-progress'; s.summary = 'Dashboard components being built'; }
                if (s.name === 'Backend') { s.status = 'in-progress'; s.summary = 'Payroll engine under development'; }
                return s;
            }),
            // Mobile Banking - QA in progress
            JSON.parse(JSON.stringify(defaultStages)).map(s => {
                if (s.name === 'Frontend') { s.status = 'completed'; s.approved = true; }
                if (s.name === 'Backend') { s.status = 'completed'; s.approved = true; }
                if (s.name === 'QA Testing') { 
                    s.status = 'in-progress';
                    s.items = s.items || [];
                    if (s.items.length > 0) { s.items[0].done = true; s.items[1].done = true; }
                }
                return s;
            }),
            // Inventory - Design in progress
            JSON.parse(JSON.stringify(defaultStages)).map(s => {
                if (s.name === 'Requirement') { s.status = 'completed'; s.approved = true; }
                if (s.name === 'Design') { 
                    s.status = 'in-progress';
                    if (s.items) { s.items[0].done = true; s.items[1].done = true; }
                }
                if (s.name === 'Frontend') { s.status = 'pending'; s.summary = ''; }
                if (s.name === 'Backend') { s.status = 'pending'; s.summary = ''; }
                return s;
            })
        ];

        const projectsWithData = projects.map((project, idx) => ({
            ...project,
            stages: stageVariations[idx],
            team: assignTeam(idx),
            createdBy: admin._id
        }));

        const createdProjects = await Project.create(projectsWithData);
        console.log(`✅ Created ${createdProjects.length} projects`);

        const [ecom, hr, bank, inventory] = createdProjects;

        // ===== CREATE TASKS (for ALL projects) =====
        const allTasks = [
            // E-Commerce tasks (index 0-6)
            { project: ecom._id, projectName: ecom.name, title: 'Complete checkout page responsive design', description: 'Implement responsive checkout flow for mobile, tablet and desktop with form validation', role: 'Frontend Dev', assignee: bilal._id, assigneeName: bilal.name, deadline: new Date('2026-02-05'), status: 'in-progress', priority: 'high', stageName: 'Frontend', gradient: ecom.gradient, startedAt: new Date('2026-02-01'), createdBy: admin._id },
            { project: ecom._id, projectName: ecom.name, title: 'Create payment API endpoints', description: 'Build REST APIs for Stripe and PayPal payment processing with webhooks', role: 'Backend Dev', assignee: omer._id, assigneeName: omer.name, deadline: new Date('2026-02-08'), status: 'in-progress', priority: 'high', stageName: 'Backend', gradient: ecom.gradient, startedAt: new Date('2026-02-02'), createdBy: admin._id },
            { project: ecom._id, projectName: ecom.name, title: 'Design order confirmation email template', description: 'Create responsive email template for order confirmations with branding', role: 'Designer', assignee: fatima._id, assigneeName: fatima.name, deadline: new Date('2026-02-03'), status: 'completed', priority: 'medium', stageName: 'Design', gradient: ecom.gradient, completedAt: new Date('2026-02-01'), createdBy: admin._id },
            { project: ecom._id, projectName: ecom.name, title: 'Implement product search with filters', description: 'Build Elasticsearch-based product search with category, price, and rating filters', role: 'Backend Dev', assignee: omer._id, assigneeName: omer.name, deadline: new Date('2026-02-12'), status: 'pending', priority: 'high', stageName: 'Backend', gradient: ecom.gradient, createdBy: admin._id },
            { project: ecom._id, projectName: ecom.name, title: 'Build shopping cart frontend', description: 'Create interactive cart with quantity management, coupon codes, and order summary', role: 'Frontend Dev', assignee: bilal._id, assigneeName: bilal.name, deadline: new Date('2026-02-10'), status: 'completed', priority: 'high', stageName: 'Frontend', gradient: ecom.gradient, completedAt: new Date('2026-02-08'), createdBy: admin._id },
            { project: ecom._id, projectName: ecom.name, title: 'Review and approve frontend components', description: 'Code review and testing all frontend component implementations', role: 'Project Manager', assignee: admin._id, assigneeName: admin.name, deadline: new Date('2026-02-07'), status: 'pending', priority: 'high', stageName: 'Frontend', gradient: ecom.gradient, createdBy: admin._id },
            { project: ecom._id, projectName: ecom.name, title: 'Setup CI/CD pipeline', description: 'Configure GitHub Actions for automated testing and deployment', role: 'DevOps', assignee: imran._id, assigneeName: imran.name, deadline: new Date('2026-02-15'), status: 'pending', priority: 'medium', stageName: 'Hosting & Deployment', gradient: ecom.gradient, createdBy: admin._id },

            // HR System tasks (index 7-11)
            { project: hr._id, projectName: hr.name, title: 'Build employee dashboard UI', description: 'Create employee self-service portal with attendance, leave, and payslip views', role: 'Frontend Dev', assignee: bilal._id, assigneeName: bilal.name, deadline: new Date('2026-02-10'), status: 'in-progress', priority: 'high', stageName: 'Frontend', gradient: hr.gradient, startedAt: new Date('2026-02-05'), createdBy: admin._id },
            { project: hr._id, projectName: hr.name, title: 'Develop payroll calculation engine', description: 'Build automated payroll with tax calculations, deductions, and overtime', role: 'Backend Dev', assignee: omer._id, assigneeName: omer.name, deadline: new Date('2026-02-15'), status: 'in-progress', priority: 'critical', stageName: 'Backend', gradient: hr.gradient, startedAt: new Date('2026-02-08'), createdBy: admin._id },
            { project: hr._id, projectName: hr.name, title: 'Design HR admin dashboard', description: 'Create admin interface mockups for HR team with analytics widgets', role: 'Designer', assignee: fatima._id, assigneeName: fatima.name, deadline: new Date('2026-02-01'), status: 'completed', priority: 'high', stageName: 'Design', gradient: hr.gradient, completedAt: new Date('2026-01-30'), createdBy: admin._id },
            { project: hr._id, projectName: hr.name, title: 'Implement leave management module', description: 'Leave application, approval workflow, and balance tracking system', role: 'Backend Dev', assignee: omer._id, assigneeName: omer.name, deadline: new Date('2026-02-20'), status: 'pending', priority: 'high', stageName: 'Backend', gradient: hr.gradient, createdBy: admin._id },
            { project: hr._id, projectName: hr.name, title: 'Build attendance tracking API', description: 'API for clock-in/out, geolocation tracking, and attendance reports', role: 'Backend Dev', assignee: omer._id, assigneeName: omer.name, deadline: new Date('2026-02-18'), status: 'pending', priority: 'medium', stageName: 'Backend', gradient: hr.gradient, createdBy: admin._id },

            // Mobile Banking tasks (index 12-16)
            { project: bank._id, projectName: bank.name, title: 'Write security test cases', description: 'Comprehensive security testing including OWASP top 10 and penetration testing', role: 'QA', assignee: nadia._id, assigneeName: nadia.name, deadline: new Date('2026-02-12'), status: 'in-progress', priority: 'critical', stageName: 'QA Testing', gradient: bank.gradient, startedAt: new Date('2026-02-10'), createdBy: admin._id },
            { project: bank._id, projectName: bank.name, title: 'Performance load testing', description: 'Load test for 100K concurrent users with JMeter', role: 'QA', assignee: nadia._id, assigneeName: nadia.name, deadline: new Date('2026-02-15'), status: 'pending', priority: 'high', stageName: 'QA Testing', gradient: bank.gradient, createdBy: admin._id },
            { project: bank._id, projectName: bank.name, title: 'Implement biometric authentication', description: 'Face ID and fingerprint login for iOS and Android', role: 'Frontend Dev', assignee: bilal._id, assigneeName: bilal.name, deadline: new Date('2026-01-25'), status: 'completed', priority: 'critical', stageName: 'Frontend', gradient: bank.gradient, completedAt: new Date('2026-01-24'), createdBy: admin._id },
            { project: bank._id, projectName: bank.name, title: 'Build QR code payment module', description: 'QR scan and generate for P2P payments', role: 'Backend Dev', assignee: omer._id, assigneeName: omer.name, deadline: new Date('2026-01-30'), status: 'completed', priority: 'high', stageName: 'Backend', gradient: bank.gradient, completedAt: new Date('2026-01-29'), createdBy: admin._id },
            { project: bank._id, projectName: bank.name, title: 'Setup AWS infrastructure', description: 'Configure VPC, ECS, RDS, and CloudFront for production', role: 'DevOps', assignee: imran._id, assigneeName: imran.name, deadline: new Date('2026-02-18'), status: 'in-progress', priority: 'high', stageName: 'Hosting & Deployment', gradient: bank.gradient, startedAt: new Date('2026-02-15'), createdBy: admin._id },

            // Inventory System tasks (index 17-19)
            { project: inventory._id, projectName: inventory.name, title: 'Create wireframe for inventory dashboard', description: 'Design wireframes showing stock levels, alerts, and warehouse views', role: 'Designer', assignee: fatima._id, assigneeName: fatima.name, deadline: new Date('2026-02-05'), status: 'in-progress', priority: 'high', stageName: 'Design', gradient: inventory.gradient, startedAt: new Date('2026-02-01'), createdBy: admin._id },
            { project: inventory._id, projectName: inventory.name, title: 'Design database schema', description: 'MongoDB schema for products, warehouses, suppliers, and stock movements', role: 'Backend Dev', assignee: omer._id, assigneeName: omer.name, deadline: new Date('2026-02-08'), status: 'completed', priority: 'high', stageName: 'Requirement', gradient: inventory.gradient, completedAt: new Date('2026-02-06'), createdBy: admin._id },
            { project: inventory._id, projectName: inventory.name, title: 'Create product catalog UI mockups', description: 'Design product listing, search, and detail pages', role: 'Designer', assignee: fatima._id, assigneeName: fatima.name, deadline: new Date('2026-02-10'), status: 'pending', priority: 'medium', stageName: 'Design', gradient: inventory.gradient, createdBy: admin._id }
        ];

        const createdTasks = await Task.create(allTasks);
        console.log(`✅ Created ${createdTasks.length} tasks`);

        // ===== CREATE CLIENT PAYMENTS =====
        const clientPayments = [
            // E-Commerce
            { project: ecom._id, projectName: ecom.name, label: 'Advance Payment', amount: 12500, date: new Date('2026-01-05'), status: 'received', receivedBy: admin._id, createdBy: admin._id },
            { project: ecom._id, projectName: ecom.name, label: '1st Milestone', amount: 12500, date: new Date('2026-02-01'), status: 'received', receivedBy: admin._id, createdBy: admin._id },
            { project: ecom._id, projectName: ecom.name, label: '2nd Milestone', amount: 12500, status: 'pending', createdBy: admin._id },
            { project: ecom._id, projectName: ecom.name, label: 'Final Payment', amount: 12500, status: 'pending', createdBy: admin._id },
            // HR System
            { project: hr._id, projectName: hr.name, label: 'Advance Payment', amount: 10500, date: new Date('2025-12-18'), status: 'received', receivedBy: admin._id, createdBy: admin._id },
            { project: hr._id, projectName: hr.name, label: '1st Milestone', amount: 12250, status: 'pending', date: new Date('2026-02-15'), createdBy: admin._id },
            { project: hr._id, projectName: hr.name, label: 'Final Payment', amount: 12250, status: 'pending', createdBy: admin._id },
            // Mobile Banking
            { project: bank._id, projectName: bank.name, label: 'Advance Payment', amount: 18750, date: new Date('2025-11-05'), status: 'received', receivedBy: admin._id, createdBy: admin._id },
            { project: bank._id, projectName: bank.name, label: '1st Milestone', amount: 15000, date: new Date('2025-12-15'), status: 'received', receivedBy: admin._id, createdBy: admin._id },
            { project: bank._id, projectName: bank.name, label: '2nd Milestone', amount: 15000, date: new Date('2026-01-20'), status: 'received', receivedBy: admin._id, createdBy: admin._id },
            { project: bank._id, projectName: bank.name, label: '3rd Milestone', amount: 15000, status: 'pending', createdBy: admin._id },
            { project: bank._id, projectName: bank.name, label: 'Final Payment', amount: 11250, status: 'pending', createdBy: admin._id },
            // Inventory
            { project: inventory._id, projectName: inventory.name, label: 'Advance Payment', amount: 5000, date: new Date('2026-01-18'), status: 'received', receivedBy: admin._id, createdBy: admin._id },
            { project: inventory._id, projectName: inventory.name, label: '1st Milestone', amount: 7500, status: 'pending', createdBy: admin._id },
            { project: inventory._id, projectName: inventory.name, label: 'Final Payment', amount: 7500, status: 'pending', createdBy: admin._id }
        ];

        await ClientPayment.create(clientPayments);
        console.log(`✅ Created ${clientPayments.length} client payments`);

        // ===== CREATE DEVELOPER PAYMENTS =====
        const devPayments = [
            // E-Commerce dev payments
            { project: ecom._id, projectName: ecom.name, developer: bilal._id, developerName: bilal.name, role: 'Frontend Dev', amount: 3000, date: new Date('2026-01-20'), note: 'Frontend advance', createdBy: admin._id },
            { project: ecom._id, projectName: ecom.name, developer: omer._id, developerName: omer.name, role: 'Backend Dev', amount: 2500, date: new Date('2026-01-20'), note: 'Backend advance', createdBy: admin._id },
            { project: ecom._id, projectName: ecom.name, developer: fatima._id, developerName: fatima.name, role: 'Designer', amount: 2000, date: new Date('2026-01-25'), note: 'Design phase completion', createdBy: admin._id },
            { project: ecom._id, projectName: ecom.name, developer: bilal._id, developerName: bilal.name, role: 'Frontend Dev', amount: 2000, date: new Date('2026-02-01'), note: '1st milestone payment', createdBy: admin._id },
            // HR dev payments
            { project: hr._id, projectName: hr.name, developer: bilal._id, developerName: bilal.name, role: 'Frontend Dev', amount: 2000, date: new Date('2026-01-10'), note: 'Frontend advance', createdBy: admin._id },
            { project: hr._id, projectName: hr.name, developer: omer._id, developerName: omer.name, role: 'Backend Dev', amount: 2500, date: new Date('2026-01-10'), note: 'Backend advance', createdBy: admin._id },
            { project: hr._id, projectName: hr.name, developer: fatima._id, developerName: fatima.name, role: 'Designer', amount: 1500, date: new Date('2026-01-15'), note: 'Design completion', createdBy: admin._id },
            // Banking dev payments
            { project: bank._id, projectName: bank.name, developer: bilal._id, developerName: bilal.name, role: 'Frontend Dev', amount: 5000, date: new Date('2025-12-01'), note: 'Frontend dev', createdBy: admin._id },
            { project: bank._id, projectName: bank.name, developer: omer._id, developerName: omer.name, role: 'Backend Dev', amount: 5000, date: new Date('2025-12-01'), note: 'Backend dev', createdBy: admin._id },
            { project: bank._id, projectName: bank.name, developer: bilal._id, developerName: bilal.name, role: 'Frontend Dev', amount: 4000, date: new Date('2026-01-15'), note: 'Frontend milestone 2', createdBy: admin._id },
            { project: bank._id, projectName: bank.name, developer: omer._id, developerName: omer.name, role: 'Backend Dev', amount: 4000, date: new Date('2026-01-15'), note: 'Backend milestone 2', createdBy: admin._id },
            { project: bank._id, projectName: bank.name, developer: imran._id, developerName: imran.name, role: 'DevOps', amount: 3000, date: new Date('2026-02-01'), note: 'Infrastructure setup', createdBy: admin._id },
            { project: bank._id, projectName: bank.name, developer: nadia._id, developerName: nadia.name, role: 'QA', amount: 2500, date: new Date('2026-02-10'), note: 'QA testing phase', createdBy: admin._id },
            // Inventory dev payments
            { project: inventory._id, projectName: inventory.name, developer: fatima._id, developerName: fatima.name, role: 'Designer', amount: 1000, date: new Date('2026-02-01'), note: 'Design advance', createdBy: admin._id }
        ];

        await DeveloperPayment.create(devPayments);
        console.log(`✅ Created ${devPayments.length} developer payments`);

        // ===== CREATE TIME LOGS =====
        const timeLogs = [
            // E-Commerce
            { user: bilal._id, userName: bilal.name, task: createdTasks[0]._id, taskName: createdTasks[0].title, project: ecom._id, projectName: ecom.name, duration: 14400, date: new Date('2026-02-01'), description: 'Worked on checkout page layout and form components' },
            { user: bilal._id, userName: bilal.name, task: createdTasks[0]._id, taskName: createdTasks[0].title, project: ecom._id, projectName: ecom.name, duration: 10800, date: new Date('2026-02-02'), description: 'Responsive mobile checkout design' },
            { user: omer._id, userName: omer.name, task: createdTasks[1]._id, taskName: createdTasks[1].title, project: ecom._id, projectName: ecom.name, duration: 18000, date: new Date('2026-02-02'), description: 'Stripe API integration and webhook setup' },
            { user: omer._id, userName: omer.name, task: createdTasks[1]._id, taskName: createdTasks[1].title, project: ecom._id, projectName: ecom.name, duration: 14400, date: new Date('2026-02-03'), description: 'PayPal payment flow implementation' },
            { user: fatima._id, userName: fatima.name, task: createdTasks[2]._id, taskName: createdTasks[2].title, project: ecom._id, projectName: ecom.name, duration: 7200, date: new Date('2026-01-30'), description: 'Email template design with brand colors' },
            { user: bilal._id, userName: bilal.name, task: createdTasks[4]._id, taskName: createdTasks[4].title, project: ecom._id, projectName: ecom.name, duration: 21600, date: new Date('2026-02-05'), description: 'Shopping cart with quantity management' },
            // HR System
            { user: bilal._id, userName: bilal.name, task: createdTasks[7]._id, taskName: createdTasks[7].title, project: hr._id, projectName: hr.name, duration: 10800, date: new Date('2026-02-06'), description: 'Employee dashboard layout and navigation' },
            { user: omer._id, userName: omer.name, task: createdTasks[8]._id, taskName: createdTasks[8].title, project: hr._id, projectName: hr.name, duration: 21600, date: new Date('2026-02-09'), description: 'Payroll calculation engine with tax brackets' },
            { user: fatima._id, userName: fatima.name, task: createdTasks[9]._id, taskName: createdTasks[9].title, project: hr._id, projectName: hr.name, duration: 14400, date: new Date('2026-01-28'), description: 'HR admin dashboard wireframes and mockups' },
            // Banking
            { user: nadia._id, userName: nadia.name, task: createdTasks[12]._id, taskName: createdTasks[12].title, project: bank._id, projectName: bank.name, duration: 18000, date: new Date('2026-02-10'), description: 'Security test cases for OWASP top 10' },
            { user: bilal._id, userName: bilal.name, task: createdTasks[14]._id, taskName: createdTasks[14].title, project: bank._id, projectName: bank.name, duration: 28800, date: new Date('2026-01-20'), description: 'Biometric auth implementation for iOS and Android' },
            { user: omer._id, userName: omer.name, task: createdTasks[15]._id, taskName: createdTasks[15].title, project: bank._id, projectName: bank.name, duration: 21600, date: new Date('2026-01-25'), description: 'QR code generation and scanning module' },
            { user: imran._id, userName: imran.name, task: createdTasks[16]._id, taskName: createdTasks[16].title, project: bank._id, projectName: bank.name, duration: 14400, date: new Date('2026-02-15'), description: 'AWS VPC and ECS cluster configuration' },
            // Inventory
            { user: fatima._id, userName: fatima.name, task: createdTasks[17]._id, taskName: createdTasks[17].title, project: inventory._id, projectName: inventory.name, duration: 10800, date: new Date('2026-02-02'), description: 'Inventory dashboard wireframe design' },
            { user: omer._id, userName: omer.name, task: createdTasks[18]._id, taskName: createdTasks[18].title, project: inventory._id, projectName: inventory.name, duration: 7200, date: new Date('2026-02-04'), description: 'Database schema design for inventory models' }
        ];

        await TimeLog.create(timeLogs);
        console.log(`✅ Created ${timeLogs.length} time logs`);

        // ===== CREATE ACTIVITIES =====
        const activities = [
            // E-Commerce
            { project: ecom._id, user: admin._id, userName: admin.name, action: 'created project E-Commerce Platform', icon: '🚀', type: 'general' },
            { project: ecom._id, user: fatima._id, userName: fatima.name, action: 'completed all design mockups', icon: '🎨', type: 'task' },
            { project: ecom._id, user: bilal._id, userName: bilal.name, action: 'started checkout page development', icon: '💻', type: 'task' },
            { project: ecom._id, user: omer._id, userName: omer.name, action: 'started payment API integration', icon: '⚙️', type: 'task' },
            { project: ecom._id, user: admin._id, userName: admin.name, action: 'received 1st milestone payment - $12,500', icon: '💰', type: 'payment' },
            { project: ecom._id, user: bilal._id, userName: bilal.name, action: 'completed shopping cart frontend', icon: '✅', type: 'task' },
            // HR System
            { project: hr._id, user: admin._id, userName: admin.name, action: 'created HR Management System project', icon: '🚀', type: 'general' },
            { project: hr._id, user: fatima._id, userName: fatima.name, action: 'completed HR dashboard designs', icon: '🎨', type: 'task' },
            { project: hr._id, user: omer._id, userName: omer.name, action: 'started payroll engine development', icon: '⚙️', type: 'task' },
            { project: hr._id, user: bilal._id, userName: bilal.name, action: 'started employee dashboard UI', icon: '💻', type: 'task' },
            // Banking
            { project: bank._id, user: admin._id, userName: admin.name, action: 'project entering QA Testing phase', icon: '🔍', type: 'stage' },
            { project: bank._id, user: bilal._id, userName: bilal.name, action: 'completed biometric authentication', icon: '✅', type: 'task' },
            { project: bank._id, user: omer._id, userName: omer.name, action: 'completed QR payment module', icon: '✅', type: 'task' },
            { project: bank._id, user: nadia._id, userName: nadia.name, action: 'started security testing', icon: '🔒', type: 'task' },
            { project: bank._id, user: admin._id, userName: admin.name, action: 'received 2nd milestone payment - $15,000', icon: '💰', type: 'payment' },
            // Inventory
            { project: inventory._id, user: admin._id, userName: admin.name, action: 'created Inventory Management project', icon: '🚀', type: 'general' },
            { project: inventory._id, user: fatima._id, userName: fatima.name, action: 'started wireframe designs', icon: '🎨', type: 'task' },
            { project: inventory._id, user: omer._id, userName: omer.name, action: 'completed database schema design', icon: '✅', type: 'task' }
        ];

        await Activity.create(activities);
        console.log(`✅ Created ${activities.length} activities`);

        // ===== CREATE REMARKS =====
        const remarks = [
            { project: ecom._id, user: admin._id, userName: admin.name, text: 'Client wants mobile-first approach for checkout page. Prioritize responsive design.' },
            { project: ecom._id, user: bilal._id, userName: bilal.name, text: 'Waiting for Stripe API keys from client to complete payment integration.' },
            { project: ecom._id, user: omer._id, userName: omer.name, text: 'Product search using Elasticsearch will need additional server setup.' },
            { project: hr._id, user: admin._id, userName: admin.name, text: 'Client needs payroll module urgently - deadline is tight. Focus resources here.' },
            { project: hr._id, user: omer._id, userName: omer.name, text: 'Payroll tax calculation requires country-specific rules. Need clarification from client.' },
            { project: bank._id, user: admin._id, userName: admin.name, text: 'Security audit is critical before launch. No compromises on testing.' },
            { project: bank._id, user: nadia._id, userName: nadia.name, text: 'Found 3 medium-severity vulnerabilities in payment flow. Fixing in progress.' },
            { project: inventory._id, user: admin._id, userName: admin.name, text: 'Client wants barcode scanner to work with existing hardware. Need compatibility testing.' }
        ];

        await Remark.create(remarks);
        console.log(`✅ Created ${remarks.length} remarks`);

        // ===== CREATE DOCUMENTS (AI-style structured content) =====
        const buildDocContent = (proj, type, extraSections = {}) => {
            const base = {
                title: type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) + ' - ' + proj.name,
                generatedDate: new Date().toISOString(),
                summary: proj.description,
                companyName: 'KINNOVANCE',
                companyLogo: '/images/logo.svg',
                footer: 'This document is generated by KINNOVANCE. Confidential — For authorized use only.',
                clientInfo: {
                    name: proj.clientDetails.name,
                    company: proj.clientDetails.company,
                    email: proj.clientDetails.email,
                    phone: proj.clientDetails.phone,
                    address: proj.clientDetails.address
                },
                sections: {
                    projectOverview: {
                        projectName: proj.name,
                        client: proj.client,
                        type: proj.type,
                        description: proj.description,
                        startDate: proj.startDate ? proj.startDate.toISOString() : undefined,
                        dueDate: proj.dueDate ? proj.dueDate.toISOString() : undefined,
                        totalAmount: proj.totalAmount,
                        priority: proj.priority
                    },
                    clientDetails: {
                        name: proj.clientDetails.name,
                        company: proj.clientDetails.company,
                        email: proj.clientDetails.email,
                        phone: proj.clientDetails.phone,
                        address: proj.clientDetails.address
                    },
                    ...extraSections
                }
            };
            return JSON.stringify(base);
        };

        const documents = [];
        for (const proj of createdProjects) {
            // Contract
            documents.push({
                project: proj._id, projectName: proj.name, type: 'contract',
                title: `Contract Agreement - ${proj.name}`,
                status: 'approved',
                content: buildDocContent(proj, 'contract', {
                    parties: { agency: { name: 'KINNOVANCE', role: 'Service Provider' }, client: { name: proj.clientDetails.name, company: proj.clientDetails.company } },
                    scopeOfWork: { description: proj.scopeOfWork || proj.description, deliverables: (proj.deliverables || []).map(d => d.title) },
                    timeline: { startDate: proj.startDate ? proj.startDate.toISOString() : undefined, endDate: proj.dueDate ? proj.dueDate.toISOString() : undefined },
                    paymentStructure: { totalAmount: proj.totalAmount, advancePercent: proj.advancePercent, paymentTerms: proj.paymentTerms },
                    responsibilities: proj.responsibilities,
                    terminationClause: proj.terminationClause || 'Either party may terminate with 30 days notice.',
                    confidentiality: proj.confidentialityClause || 'Both parties agree to maintain confidentiality.',
                    signatures: { agency: { name: 'Ahmed Khan, CEO KINNOVANCE' }, client: { name: proj.clientDetails.contactPerson } }
                }),
                generatedBy: admin._id, generatedByName: admin.name
            });

            // Welcome Doc
            documents.push({
                project: proj._id, projectName: proj.name, type: 'welcome-doc',
                title: `Welcome Document - ${proj.name}`,
                status: 'sent',
                content: buildDocContent(proj, 'welcome-doc', {
                    introduction: { greeting: `Welcome aboard, ${proj.clientDetails.name}!`, message: `We at KINNOVANCE are thrilled to begin working on ${proj.name}. ${proj.description}` },
                    teamIntro: (proj.team || []).map(m => ({ name: m.name, role: m.role })),
                    communicationChannels: proj.communicationChannels,
                    nextSteps: ['Project kickoff meeting', 'Requirement finalization', 'Design mockups delivery', 'Regular progress updates']
                }),
                generatedBy: admin._id, generatedByName: admin.name
            });

            // Payment Plan
            documents.push({
                project: proj._id, projectName: proj.name, type: 'payment-plan',
                title: `Payment Plan - ${proj.name}`,
                status: 'approved',
                content: buildDocContent(proj, 'payment-plan', {
                    projectValue: { totalAmount: proj.totalAmount, currency: 'USD' },
                    advancePayment: { percentage: proj.advancePercent, amount: Math.round(proj.totalAmount * proj.advancePercent / 100) },
                    paymentTerms: proj.paymentTerms || 'Net 7 days from invoice date',
                    latePaymentPolicy: proj.latePaymentPolicy
                }),
                generatedBy: admin._id, generatedByName: admin.name
            });

            // Fulfillment Plan
            documents.push({
                project: proj._id, projectName: proj.name, type: 'fulfillment-plan',
                title: `Fulfillment Plan - ${proj.name}`,
                status: 'final',
                content: buildDocContent(proj, 'fulfillment-plan', {
                    scope: { name: proj.name, type: proj.type, description: proj.scopeOfWork || proj.description },
                    deliverables: (proj.deliverables || []).map(d => ({ title: d.title, description: d.description, stage: d.stage, status: d.status })),
                    qualityChecklist: ['Code review completed', 'Testing passed', 'Client approval received', 'Documentation updated']
                }),
                generatedBy: admin._id, generatedByName: admin.name
            });

            // Tracking Sheet
            documents.push({
                project: proj._id, projectName: proj.name, type: 'tracking-sheet',
                title: `Tracking Sheet - ${proj.name}`,
                status: 'final',
                content: buildDocContent(proj, 'tracking-sheet', {
                    projectHealth: { status: proj.status, progress: proj.progress, mode: proj.mode || 'active' },
                    stages: (proj.stages || []).map(s => ({ stage: s.name, status: s.status, order: s.order }))
                }),
                generatedBy: admin._id, generatedByName: admin.name
            });

            // Client Access Sheet
            documents.push({
                project: proj._id, projectName: proj.name, type: 'client-access-sheet',
                title: `Client Access Sheet - ${proj.name}`,
                status: 'sent',
                content: buildDocContent(proj, 'client-access-sheet', {
                    portalAccess: { url: '/client-portal?id=' + proj._id, loginEmail: proj.clientDetails.email, note: 'Use your registered email to login' },
                    projectDashboard: { canView: ['Project progress', 'Stage status', 'Payment history', 'Documents', 'Meeting schedule'], canDo: ['Submit feedback', 'Upload assets', 'View documents', 'Join meetings'] },
                    communicationChannels: proj.communicationChannels,
                    supportInfo: { email: 'support@kinnovance.com', phone: '+92-300-1234567', hours: 'Mon-Fri 9AM-6PM PKT' }
                }),
                generatedBy: admin._id, generatedByName: admin.name
            });
        }

        await Document.create(documents);
        console.log(`✅ Created ${documents.length} documents`);

        // ===== CREATE MEETINGS =====
        const meetings = [
            // E-Commerce
            { project: ecom._id, projectName: ecom.name, title: 'Weekly Progress Review - E-Commerce', type: 'google-meet', meetingLink: 'https://meet.google.com/abc-defg-hij', scheduledAt: new Date('2026-02-18T15:00:00'), duration: 45, recurring: { enabled: true, frequency: 'weekly', dayOfWeek: 2 }, attendees: [
                { name: admin.name, email: admin.email, role: 'admin' }, { name: bilal.name, email: bilal.email, role: 'developer' }, { name: omer.name, email: omer.email, role: 'developer' }, { name: 'Raza Malik', email: 'raza@techmart.com', role: 'client' }
            ], agenda: 'Review frontend progress, discuss payment API integration, demo checkout flow', stage: 'Frontend', status: 'scheduled', createdBy: admin._id, createdByName: admin.name },
            { project: ecom._id, projectName: ecom.name, title: 'Design Review Meeting', type: 'zoom', meetingLink: 'https://zoom.us/j/123456789', scheduledAt: new Date('2026-01-28T14:00:00'), duration: 30, attendees: [
                { name: admin.name, email: admin.email, role: 'admin' }, { name: fatima.name, email: fatima.email, role: 'developer' }, { name: 'Raza Malik', email: 'raza@techmart.com', role: 'client' }
            ], agenda: 'Final design review and approval for all pages', notes: 'All designs approved. Client happy with mobile-first approach.', stage: 'Design', status: 'completed', createdBy: admin._id, createdByName: admin.name },
            // HR System
            { project: hr._id, projectName: hr.name, title: 'Bi-Weekly Sprint Review - HR System', type: 'teams', meetingLink: 'https://teams.microsoft.com/meet/abc123', scheduledAt: new Date('2026-02-20T14:00:00'), duration: 60, recurring: { enabled: true, frequency: 'biweekly', dayOfWeek: 4 }, attendees: [
                { name: admin.name, email: admin.email, role: 'admin' }, { name: omer.name, email: omer.email, role: 'developer' }, { name: 'Amna Sheikh', email: 'amna@globalcorp.com', role: 'client' }
            ], agenda: 'Demo payroll engine, discuss leave management requirements', stage: 'Backend', status: 'scheduled', createdBy: admin._id, createdByName: admin.name },
            // Banking
            { project: bank._id, projectName: bank.name, title: 'Security Review Meeting', type: 'google-meet', meetingLink: 'https://meet.google.com/xyz-uvwx-rst', scheduledAt: new Date('2026-02-19T11:00:00'), duration: 60, attendees: [
                { name: admin.name, email: admin.email, role: 'admin' }, { name: nadia.name, email: nadia.email, role: 'developer' }, { name: imran.name, email: imran.email, role: 'developer' }, { name: 'Hamza Qureshi', email: 'hamza@financehub.com', role: 'client' }
            ], agenda: 'Security test results review, vulnerability fixes status, deployment timeline', stage: 'QA Testing', status: 'scheduled', createdBy: admin._id, createdByName: admin.name },
            { project: bank._id, projectName: bank.name, title: 'App Demo - Beta Release', type: 'zoom', scheduledAt: new Date('2026-02-25T10:00:00'), duration: 90, attendees: [
                { name: admin.name, email: admin.email, role: 'admin' }, { name: bilal.name, email: bilal.email, role: 'developer' }, { name: omer.name, email: omer.email, role: 'developer' }, { name: 'Hamza Qureshi', email: 'hamza@financehub.com', role: 'client' }
            ], agenda: 'Full demo of mobile banking app beta version', stage: 'Delivery', status: 'scheduled', createdBy: admin._id, createdByName: admin.name },
            // Inventory
            { project: inventory._id, projectName: inventory.name, title: 'Kickoff Meeting - Inventory System', type: 'google-meet', meetingLink: 'https://meet.google.com/inv-kick-off', scheduledAt: new Date('2026-01-20T16:00:00'), duration: 60, attendees: [
                { name: admin.name, email: admin.email, role: 'admin' }, { name: fatima.name, email: fatima.email, role: 'developer' }, { name: 'Zara Iqbal', email: 'zara@warehousepro.com', role: 'client' }
            ], agenda: 'Project kickoff, requirement discussion, timeline planning', notes: 'Requirements finalized. Client needs barcode scanner support.', stage: 'Requirement', status: 'completed', createdBy: admin._id, createdByName: admin.name },
            { project: inventory._id, projectName: inventory.name, title: 'Design Review - Inventory Dashboard', type: 'google-meet', scheduledAt: new Date('2026-02-22T16:00:00'), duration: 45, attendees: [
                { name: admin.name, email: admin.email, role: 'admin' }, { name: fatima.name, email: fatima.email, role: 'developer' }, { name: 'Zara Iqbal', email: 'zara@warehousepro.com', role: 'client' }
            ], agenda: 'Review wireframe designs for inventory dashboard', stage: 'Design', status: 'scheduled', createdBy: admin._id, createdByName: admin.name }
        ];

        await Meeting.create(meetings);
        console.log(`✅ Created ${meetings.length} meetings`);

        // ===== CREATE FEEDBACK =====
        const feedbacks = [
            // E-Commerce
            { project: ecom._id, projectName: ecom.name, stage: 'Design', type: 'stage-completion', rating: 5, communication: 5, quality: 5, timeliness: 4, comments: 'Excellent design work! The mobile-first approach is exactly what we needed. Very impressed with the attention to detail.', suggestions: 'Would love to see dark mode option in future iterations.', submittedBy: 'Raza Malik', isClientFeedback: true, status: 'reviewed', response: { text: 'Thank you for the wonderful feedback! We will consider dark mode in Phase 2.', respondedByName: admin.name, respondedAt: new Date('2026-02-02') } },
            { project: ecom._id, projectName: ecom.name, stage: 'Requirement', type: 'stage-completion', rating: 4, communication: 4, quality: 4, timeliness: 4, comments: 'Good requirement documentation. Clear and comprehensive.', submittedBy: 'Raza Malik', isClientFeedback: true, status: 'acknowledged' },
            // HR System
            { project: hr._id, projectName: hr.name, stage: 'Design', type: 'stage-completion', rating: 4, communication: 4, quality: 5, timeliness: 3, comments: 'Great design for the admin dashboard. Clean and modern look.', suggestions: 'Would like to see more export options in the reports section.', submittedBy: 'Amna Sheikh', isClientFeedback: true, status: 'reviewed', response: { text: 'Noted! We will add CSV and PDF export options.', respondedByName: admin.name, respondedAt: new Date('2026-02-05') } },
            // Banking
            { project: bank._id, projectName: bank.name, type: 'general', rating: 5, communication: 5, quality: 5, timeliness: 5, comments: 'Outstanding work on the mobile app! The biometric login is smooth and the UI is beautiful. Very professional team.', submittedBy: 'Hamza Qureshi', isClientFeedback: true, status: 'acknowledged' },
            { project: bank._id, projectName: bank.name, stage: 'Frontend', type: 'stage-completion', rating: 5, communication: 5, quality: 5, timeliness: 4, comments: 'App looks and feels amazing. Great animations and transitions.', suggestions: 'Add transaction categorization feature for spending analytics.', submittedBy: 'Hamza Qureshi', isClientFeedback: true, status: 'reviewed' },
            // Inventory
            { project: inventory._id, projectName: inventory.name, stage: 'Requirement', type: 'stage-completion', rating: 4, communication: 5, quality: 4, timeliness: 4, comments: 'Good requirement gathering process. The team understood our needs well.', submittedBy: 'Zara Iqbal', isClientFeedback: true, status: 'acknowledged' }
        ];

        await Feedback.create(feedbacks);
        console.log(`✅ Created ${feedbacks.length} feedback entries`);

        // ===== CREATE SUPPORT TICKETS =====
        const tickets = [
            { project: ecom._id, projectName: ecom.name, title: 'Payment gateway timeout on mobile', type: 'bug-fix', priority: 'high', status: 'open', description: 'Users experiencing payment timeout errors when checking out on mobile devices. Stripe API returns 504 after 30 seconds on slow connections.', reportedBy: admin._id, reportedByName: admin.name, remarks: [{ user: omer._id, userName: omer.name, text: 'Investigating - seems to be a Stripe webhook timeout issue. Adding retry logic.' }] },
            { project: ecom._id, projectName: ecom.name, title: 'Add product comparison feature', type: 'feature-request', priority: 'medium', status: 'open', description: 'Client requests ability to compare up to 4 products side by side with specification comparison table.', reportedBy: admin._id, reportedByName: admin.name },
            { project: hr._id, projectName: hr.name, title: 'Payroll calculation rounding issue', type: 'bug-fix', priority: 'critical', status: 'in-progress', description: 'Tax calculations have rounding errors when salary has decimal points. Off by $0.01-$0.05 per employee.', reportedBy: admin._id, reportedByName: admin.name, assignee: omer._id, assigneeName: omer.name, remarks: [{ user: omer._id, userName: omer.name, text: 'Found the issue - using Math.round instead of proper decimal handling. Fixing with decimal.js library.' }] },
            { project: bank._id, projectName: bank.name, title: 'Biometric login fails after app update', type: 'bug-fix', priority: 'high', status: 'resolved', description: 'Users report Face ID not working after updating to v1.2. Affects iOS 17+ devices.', reportedBy: admin._id, reportedByName: admin.name, assignee: bilal._id, assigneeName: bilal.name, resolution: 'Fixed biometric API compatibility issue with iOS 17. Updated LocalAuthentication framework usage.', resolvedAt: new Date('2026-02-12') }
        ];

        await SupportTicket.create(tickets);
        console.log(`✅ Created ${tickets.length} support tickets`);

        // ===== CREATE MONTHLY REPORTS =====
        const monthlyReports = [
            // January reports
            {
                project: ecom._id, projectName: ecom.name, reportMonth: 1, reportYear: 2026,
                period: { startDate: new Date('2026-01-01'), endDate: new Date('2026-01-31') },
                stageProgress: [
                    { stageName: 'Requirement', status: 'completed', progressPercent: 100, notes: 'All requirements finalized' },
                    { stageName: 'Design', status: 'completed', progressPercent: 100, notes: 'All designs approved by client' },
                    { stageName: 'Frontend', status: 'in-progress', progressPercent: 40, notes: 'Core pages under development' },
                    { stageName: 'Backend', status: 'in-progress', progressPercent: 30, notes: 'API endpoints being built' }
                ],
                overallProgress: 45,
                tasksSummary: { total: 7, completed: 2, inProgress: 2, pending: 3, blocked: 0 },
                hoursSummary: { totalHours: 85, byMember: [{ name: bilal.name, hours: 35, role: 'Frontend Dev' }, { name: omer.name, hours: 30, role: 'Backend Dev' }, { name: fatima.name, hours: 20, role: 'Designer' }] },
                paymentSummary: { totalAmount: 50000, received: 25000, pending: 25000, overdue: 0 },
                achievements: [{ title: 'Design phase completed ahead of schedule', date: new Date('2026-01-25') }, { title: 'Advance payment received', date: new Date('2026-01-05') }],
                upcomingWork: [{ title: 'Complete checkout page', stage: 'Frontend', deadline: new Date('2026-02-05') }, { title: 'Payment API integration', stage: 'Backend', deadline: new Date('2026-02-08') }],
                status: 'final', generatedBy: admin._id, generatedByName: admin.name
            },
            {
                project: bank._id, projectName: bank.name, reportMonth: 1, reportYear: 2026,
                period: { startDate: new Date('2026-01-01'), endDate: new Date('2026-01-31') },
                stageProgress: [
                    { stageName: 'Requirement', status: 'completed', progressPercent: 100 },
                    { stageName: 'Design', status: 'completed', progressPercent: 100 },
                    { stageName: 'Frontend', status: 'completed', progressPercent: 100, notes: 'All mobile screens completed' },
                    { stageName: 'Backend', status: 'completed', progressPercent: 100, notes: 'All API endpoints functional' },
                    { stageName: 'QA Testing', status: 'in-progress', progressPercent: 20, notes: 'Test cases being written' }
                ],
                overallProgress: 80,
                tasksSummary: { total: 5, completed: 3, inProgress: 1, pending: 1, blocked: 0 },
                hoursSummary: { totalHours: 120, byMember: [{ name: bilal.name, hours: 40 }, { name: omer.name, hours: 45 }, { name: nadia.name, hours: 15 }, { name: imran.name, hours: 20 }] },
                paymentSummary: { totalAmount: 75000, received: 48750, pending: 26250, overdue: 0 },
                achievements: [{ title: 'Frontend development completed', date: new Date('2026-01-20') }, { title: 'Backend API fully functional', date: new Date('2026-01-28') }],
                status: 'sent-to-client', generatedBy: admin._id, generatedByName: admin.name
            },
            // February reports (current month)
            {
                project: ecom._id, projectName: ecom.name, reportMonth: 2, reportYear: 2026,
                period: { startDate: new Date('2026-02-01'), endDate: new Date('2026-02-28') },
                stageProgress: [
                    { stageName: 'Requirement', status: 'completed', progressPercent: 100 },
                    { stageName: 'Design', status: 'completed', progressPercent: 100 },
                    { stageName: 'Frontend', status: 'in-progress', progressPercent: 70, notes: 'Checkout and cart pages completed' },
                    { stageName: 'Backend', status: 'in-progress', progressPercent: 50, notes: 'Payment API integration ongoing' }
                ],
                overallProgress: 65,
                tasksSummary: { total: 7, completed: 3, inProgress: 2, pending: 2, blocked: 0 },
                hoursSummary: { totalHours: 48, byMember: [{ name: bilal.name, hours: 22 }, { name: omer.name, hours: 18 }, { name: fatima.name, hours: 4 }, { name: imran.name, hours: 4 }] },
                paymentSummary: { totalAmount: 50000, received: 25000, pending: 25000, overdue: 0 },
                achievements: [{ title: 'Shopping cart frontend completed', date: new Date('2026-02-08') }, { title: '1st milestone payment received', date: new Date('2026-02-01') }],
                status: 'draft', generatedBy: admin._id, generatedByName: admin.name
            }
        ];

        await MonthlyReport.create(monthlyReports);
        console.log(`✅ Created ${monthlyReports.length} monthly reports`);

        // ===== DONE =====
        console.log('\n🎉 ====== FULL SEED COMPLETED SUCCESSFULLY! ======');
        console.log('\n📋 Login Credentials:');
        console.log('   ┌──────────────────────────────────────────────');
        console.log('   │ Admin:     admin@kinnovance.com / admin123');
        console.log('   │ SubAdmin:  subadmin@kinnovance.com / subadmin123');
        console.log('   │ Developer: bilal@kinnovance.com / dev123');
        console.log('   │ Developer: omer@kinnovance.com / dev123');
        console.log('   │ Developer: fatima@kinnovance.com / dev123');
        console.log('   │ Developer: nadia@kinnovance.com / dev123');
        console.log('   │ Developer: imran@kinnovance.com / dev123');
        console.log('   │ Client:    raza@techmart.com / client123');
        console.log('   │ Client:    amna@globalcorp.com / client123');
        console.log('   │ Client:    hamza@financehub.com / client123');
        console.log('   │ Client:    zara@warehousepro.com / client123');
        console.log('   └──────────────────────────────────────────────');
        console.log('\n📊 Data Summary:');
        console.log(`   Users:      ${createdUsers.length}`);
        console.log(`   Projects:   ${createdProjects.length}`);
        console.log(`   Tasks:      ${createdTasks.length}`);
        console.log(`   Payments:   ${clientPayments.length} client + ${devPayments.length} developer`);
        console.log(`   TimeLogs:   ${timeLogs.length}`);
        console.log(`   Activities: ${activities.length}`);
        console.log(`   Remarks:    ${remarks.length}`);
        console.log(`   Documents:  ${documents.length}`);
        console.log(`   Meetings:   ${meetings.length}`);
        console.log(`   Feedback:   ${feedbacks.length}`);
        console.log(`   Tickets:    ${tickets.length}`);
        console.log(`   Reports:    ${monthlyReports.length}`);
        console.log('');

        process.exit();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

// Delete data
const deleteData = async () => {
    try {
        await User.deleteMany();
        await Project.deleteMany();
        await Task.deleteMany();
        await ClientPayment.deleteMany();
        await DeveloperPayment.deleteMany();
        await TimeLog.deleteMany();
        await Activity.deleteMany();
        await Remark.deleteMany();
        await Document.deleteMany();
        await SupportTicket.deleteMany();
        await Meeting.deleteMany();
        await Feedback.deleteMany();
        await MonthlyReport.deleteMany();
        await Fulfillment.deleteMany();

        console.log('🗑️  All data deleted successfully');
        process.exit();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

// Run based on command line argument
if (process.argv[2] === '-d') {
    deleteData();
} else {
    importData();
}
