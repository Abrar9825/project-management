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

// ===== USERS =====
const users = [
    { name: 'Abrar Shaikh', email: 'abrarshaikh.imscit21@gmail.com', password: '123456', role: 'admin', phone: '9875009490', hourRate: 0, canDelete: false },
    { name: 'Ali Hassan', email: 'ali.hassan@agency.com', password: '123456', role: 'developer', phone: '9800000001', designation: 'Frontend Developer', hourRate: 500 },
    { name: 'Sara Khan', email: 'sara.khan@agency.com', password: '123456', role: 'developer', phone: '9800000002', designation: 'Backend Developer', hourRate: 600 },
    { name: 'Usman Raza', email: 'usman.raza@agency.com', password: '123456', role: 'developer', phone: '9800000003', designation: 'UI/UX Designer', hourRate: 450 },
    { name: 'Fatima Noor', email: 'fatima.noor@agency.com', password: '123456', role: 'developer', phone: '9800000004', designation: 'QA Engineer', hourRate: 400 },
    { name: 'Bilal Ahmed', email: 'bilal.ahmed@agency.com', password: '123456', role: 'subadmin', phone: '9800000005', designation: 'Project Manager', hourRate: 700 }
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
        console.log(`✅ Created ${createdUsers.length} user(s)`);

        // ===== CREATE SAMPLE PROJECT WITH ASSET REQUESTS =====
        const sampleProject = await Project.create({
            name: 'E-commerce Website Development',
            client: 'TechStart Solutions',
            type: 'ecommerce',
            priority: 'high',
            progress: 35,
            currentStage: 'Design Phase',
            description: 'Complete e-commerce platform with React frontend and Node.js backend',
            budget: 150000,
            dueDate: new Date('2026-05-15'),
            createdBy: createdUsers[0]._id,
            team: [
                { role: 'Frontend Dev', user: createdUsers[1]._id, name: createdUsers[1].name },
                { role: 'Backend Dev', user: createdUsers[2]._id, name: createdUsers[2].name },
                { role: 'Designer', user: createdUsers[3]._id, name: createdUsers[3].name }
            ],
            stages: [
                {
                    name: 'Requirement Analysis',
                    status: 'completed',
                    type: 'checklist',
                    order: 1,
                    approved: true,
                    summary: 'Gather and document all business requirements',
                    icon: '📋',
                    gradient: 'stage-gradient-1',
                    items: [
                        { text: 'Client requirement meeting', done: true },
                        { text: 'Document functional requirements', done: true },
                        { text: 'Technical architecture planning', done: true }
                    ],
                    assetRequests: [
                        {
                            label: 'Company Logo & Brand Guidelines',
                            type: 'logo',
                            status: 'received',
                            fileName: 'brand-guide.pdf',
                            fileUrl: '/uploads/asset-1234567890-brand-guide.pdf',
                            note: 'High resolution logo files and color codes needed',
                            requestedAt: new Date('2026-02-10'),
                            receivedAt: new Date('2026-02-12')
                        },
                        {
                            label: 'Product Catalog Data',
                            type: 'content',
                            status: 'pending',
                            note: 'Excel file with all product details, prices, and descriptions',
                            requestedAt: new Date('2026-02-15')
                        }
                    ]
                },
                {
                    name: 'Design Phase',
                    status: 'in-progress',
                    type: 'checklist',
                    order: 2,
                    approved: false,
                    summary: 'UI/UX design and prototyping',
                    icon: '🎨',
                    gradient: 'stage-gradient-2',
                    assigned: createdUsers[3]._id,
                    assignedName: createdUsers[3].name,
                    items: [
                        { text: 'Wireframes creation', done: true },
                        { text: 'High-fidelity mockups', done: false },
                        { text: 'Interactive prototype', done: false }
                    ],
                    assetRequests: [
                        {
                            label: 'Payment Gateway API Keys',
                            type: 'api-keys',
                            status: 'pending',
                            note: 'Stripe and PayPal sandbox and live API credentials',
                            requestedAt: new Date('2026-02-20')
                        },
                        {
                            label: 'Reference Website Examples',
                            type: 'other',
                            status: 'received',
                            fileName: 'references.zip',
                            fileUrl: '/uploads/asset-1234567891-references.zip',
                            note: 'Competitor analysis and preferred design styles',
                            requestedAt: new Date('2026-02-18'),
                            receivedAt: new Date('2026-02-20')
                        }
                    ]
                },
                {
                    name: 'Frontend Development',
                    status: 'pending',
                    type: 'development',
                    order: 3,
                    approved: false,
                    summary: 'React.js frontend implementation',
                    icon: '⚛️',
                    gradient: 'stage-gradient-3',
                    assigned: createdUsers[1]._id,
                    assignedName: createdUsers[1].name,
                    items: [
                        { text: 'Setup React project structure', done: false },
                        { text: 'Implement homepage design', done: false },
                        { text: 'Product listing page', done: false },
                        { text: 'Shopping cart functionality', done: false }
                    ],
                    assetRequests: [
                        {
                            label: 'Social Media Account Details',
                            type: 'api-keys',
                            status: 'pending',
                            note: 'Facebook, Instagram, Twitter API keys for social login',
                            requestedAt: new Date('2026-02-22')
                        }
                    ]
                }
            ]
        });

        console.log(`✅ Created sample project: ${sampleProject.name}`);

        // ===== DONE =====
        console.log('\n🎉 ====== DATABASE INITIALIZED SUCCESSFULLY! ======');
        console.log('\n📋 Admin Login Credentials:');
        console.log('   ┌──────────────────────────────────────────────');
        console.log('   │ Email:    abrarshaikh.imscit21@gmail.com');
        console.log('   │ Password: 123456');
        console.log('   │ Role:     Admin');
        console.log('   │ Phone:    9875009490');
        console.log('   └──────────────────────────────────────────────');
        console.log('\n✨ Database is clean and ready for use!');
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
