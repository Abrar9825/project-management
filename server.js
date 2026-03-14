const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory:', uploadsDir);
}

// Connect to database
connectDB();

// Route files
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const projectRoutes = require('./routes/project.routes');
const taskRoutes = require('./routes/task.routes');
const paymentRoutes = require('./routes/payment.routes');
const timeLogRoutes = require('./routes/timeLog.routes');
const documentRoutes = require('./routes/document.routes');
const ticketRoutes = require('./routes/ticket.routes');
const meetingRoutes = require('./routes/meeting.routes');
const feedbackRoutes = require('./routes/feedback.routes');
const generatorRoutes = require('./routes/generator.routes');
const clientTaskRoutes = require('./routes/clientTask.routes');
const leadRoutes = require('./routes/lead.routes');
const AutomationEngine = require('./services/automationEngine');

const app = express();
    
// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Enable CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/timelogs', timeLogRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/generator', generatorRoutes);
app.use('/api/client-tasks', clientTaskRoutes);
app.use('/api/leads', leadRoutes);

// View Routes
app.get('/', (req, res) => res.redirect('/login'));
app.get('/login', (req, res) => res.render('login'));
app.get('/my-work', (req, res) => res.render('my-work'));
app.get('/projects', (req, res) => res.render('projects'));
app.get('/add-project', (req, res) => res.render('add-project'));
app.get('/project-detail', (req, res) => res.render('project-detail'));
app.get('/users', (req, res) => res.render('users'));
app.get('/profile', (req, res) => res.render('profile'));
app.get('/client-panel', (req, res) => res.render('client-panel'));
app.get('/documents', (req, res) => res.render('documents'));
app.get('/document-center', (req, res) => res.render('document-center'));
app.get('/client-portal', (req, res) => res.render('client-portal'));
app.get('/leads', (req, res) => res.render('leads'));
app.get('/create-lead', (req, res) => res.render('create-lead'));
app.get('/lead-detail', (req, res) => res.render('lead-detail'));
app.get('/create-order', (req, res) => res.render('create-order'));
app.get('/order-detail', (req, res) => res.render('order-detail'));
app.get('/orders', (req, res) => res.render('orders'));

// Health check route
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Project Control API is running',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    res.status(err.statusCode || 500).json({
        success: false,
        error: err.message || 'Server Error'
    });
});

// Handle 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`\n🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`📍 Open browser at: http://localhost:${PORT}/login`);
    console.log(`\n📋 Demo Credentials:`);
    console.log(`   Admin: admin@company.com / admin123`);
    console.log(`   SubAdmin: subadmin@company.com / subadmin123`);
    console.log(`   Developer: bilal@company.com / dev123\n`);

    // ==================== SETUP DAILY CRON SCHEDULER ====================
    // Check and send overdue payment emails every day at 9:00 AM
    const setupScheduler = () => {
        const now = new Date();
        const scheduledTime = new Date();
        scheduledTime.setHours(9, 0, 0, 0); // 9:00 AM

        // If it's already past 9 AM today, schedule for tomorrow
        if (now > scheduledTime) {
            scheduledTime.setDate(scheduledTime.getDate() + 1);
        }

        const timeUntilScheduled = scheduledTime - now;

        console.log(`[SCHEDULER] ⏰ Next overdue payment check: ${scheduledTime.toLocaleString()}`);

        // Schedule the first run
        setTimeout(() => {
            console.log(`[SCHEDULER] 🔔 Executing scheduled task: checkAndEmailOverduePayments`);
            AutomationEngine.checkAndEmailOverduePayments().then(result => {
                console.log(`[SCHEDULER] ✅ Task completed:`, result);
            }).catch(err => {
                console.error(`[SCHEDULER] ❌ Task error:`, err);
            });

            // After first run, repeat every 24 hours
            setInterval(() => {
                console.log(`[SCHEDULER] 🔔 Executing scheduled task: checkAndEmailOverduePayments`);
                AutomationEngine.checkAndEmailOverduePayments().then(result => {
                    console.log(`[SCHEDULER] ✅ Task completed:`, result);
                }).catch(err => {
                    console.error(`[SCHEDULER] ❌ Task error:`, err);
                });
            }, 24 * 60 * 60 * 1000); // Every 24 hours
        }, timeUntilScheduled);
    };

    try {
        setupScheduler();
        console.log('[SCHEDULER] ✅ Scheduler initialized');
    } catch (err) {
        console.error('[SCHEDULER] ❌ Failed to initialize scheduler:', err.message);
    }
    // ============================================================
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    server.close(() => process.exit(1));
});
