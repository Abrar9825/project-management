const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

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
    origin: '*',
    credentials: true
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
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    server.close(() => process.exit(1));
});
