const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User.model');
const Project = require('./models/Project.model');
const Task = require('./models/Task.model');
const { ClientPayment, DeveloperPayment } = require('./models/Payment.model');
const { Activity, Remark } = require('./models/Activity.model');
const TimeLog = require('./models/TimeLog.model');

const reset = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Delete everything
        await User.deleteMany({});
        await Project.deleteMany({});
        await Task.deleteMany({});
        await ClientPayment.deleteMany({});
        await DeveloperPayment.deleteMany({});
        await Activity.deleteMany({});
        await Remark.deleteMany({});
        await TimeLog.deleteMany({});

        console.log('All data deleted');

        // Create 1 admin
        const admin = await User.create({
            name: 'Admin',
            email: 'admin@gmail.com',
            password: 'admin123',
            role: 'admin',
            designation: 'System Admin',
            isActive: true
        });

        console.log('');
        console.log('========================================');
        console.log('  Admin Created Successfully!');
        console.log('========================================');
        console.log(`  Email:    admin@gmail.com`);
        console.log(`  Password: admin123`);
        console.log(`  Role:     admin`);
        console.log(`  ID:       ${admin._id}`);
        console.log('========================================');
        console.log('');

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

reset();
