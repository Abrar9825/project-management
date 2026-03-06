const nodemailer = require('nodemailer');

// Create transporter with Gmail credentials
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'abrarshaikh.imscit21@gmail.com',
        pass: process.env.EMAIL_PASS || 'reha evqo ququ ziwq'
    }
});

// Verify connection on startup
transporter.verify().then(() => {
    console.log('✅ Email service ready');
}).catch(err => {
    console.log('⚠️ Email service not available:', err.message);
});

// Base URL for links in emails
const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:5000';

// ======================== EMAIL TEMPLATES ========================

function getBaseStyles() {
    return `
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f0f4f8; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 40%, #3b7daa 70%, #4a9fd4 100%); padding: 32px 24px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 1px; }
        .header p { color: rgba(255,255,255,0.7); margin: 6px 0 0; font-size: 13px; }
        .body { padding: 32px 24px; }
        .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 16px 0; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .info-row:last-child { border-bottom: none; }
        .info-label { color: #64748b; font-weight: 500; }
        .info-value { color: #1e293b; font-weight: 600; }
        .btn { display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #1e3a5f, #3b7daa); color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px; margin: 16px 0; }
        .btn:hover { opacity: 0.9; }
        .priority-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
        .priority-low { background: #dcfce7; color: #166534; }
        .priority-medium { background: #fef9c3; color: #854d0e; }
        .priority-high { background: #fee2e2; color: #991b1b; }
        .priority-critical { background: #fecaca; color: #7f1d1d; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; }
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-approved { background: #d1fae5; color: #065f46; }
        .status-draft { background: #e0e7ff; color: #3730a3; }
        .status-final { background: #dbeafe; color: #1e40af; }
        .status-sent { background: #ccfbf1; color: #115e59; }
        .footer { background: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer p { color: #94a3b8; font-size: 12px; margin: 4px 0; }
        .footer a { color: #3b82f6; text-decoration: none; }
    `;
}

function wrapEmail(title, subtitle, bodyContent) {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>${getBaseStyles()}</style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>${title}</h1>
        <p>${subtitle}</p>
    </div>
    <div class="body">
        ${bodyContent}
    </div>
    <div class="footer">
        <p>This is an automated notification from <strong>Project Management System</strong></p>
        <p><a href="${BASE_URL}">Open Dashboard</a></p>
    </div>
</div>
</body>
</html>`;
}

// ======================== SEND FUNCTIONS ========================

/**
 * Send email when a task is assigned to a developer
 */
async function sendTaskAssignedEmail(assigneeEmail, assigneeName, taskData) {
    try {
        const priorityClass = `priority-${taskData.priority || 'medium'}`;
        const deadlineStr = taskData.deadline ? new Date(taskData.deadline).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Not set';

        const body = `
            <p style="font-size:15px;color:#334155;">Hi <strong>${assigneeName}</strong>,</p>
            <p style="font-size:14px;color:#475569;">A new task has been assigned to you. Please review the details below:</p>
            
            <div class="info-card">
                <div class="info-row"><span class="info-label">Task</span><span class="info-value">${taskData.title}</span></div>
                <div class="info-row"><span class="info-label">Project</span><span class="info-value">${taskData.projectName}</span></div>
                <div class="info-row"><span class="info-label">Role</span><span class="info-value">${taskData.role}</span></div>
                <div class="info-row"><span class="info-label">Priority</span><span class="info-value"><span class="${priorityClass}">${(taskData.priority || 'medium').toUpperCase()}</span></span></div>
                <div class="info-row"><span class="info-label">Deadline</span><span class="info-value">${deadlineStr}</span></div>
                ${taskData.stageName ? `<div class="info-row"><span class="info-label">Stage</span><span class="info-value">${taskData.stageName}</span></div>` : ''}
                ${taskData.description ? `<div class="info-row"><span class="info-label">Description</span><span class="info-value">${taskData.description}</span></div>` : ''}
            </div>
            
            <div style="text-align:center;">
                <a href="${BASE_URL}/my-work" class="btn">View My Tasks</a>
            </div>
            
            <p style="font-size:13px;color:#94a3b8;margin-top:24px;">Please start working on this task before the deadline. If you have any questions, contact your project manager.</p>
        `;

        await transporter.sendMail({
            from: `"Project Management" <${process.env.EMAIL_USER || 'abrarshaikh.imscit21@gmail.com'}>`,
            to: assigneeEmail,
            subject: `📋 New Task Assigned: ${taskData.title} — ${taskData.projectName}`,
            html: wrapEmail('New Task Assigned', 'You have a new task to work on', body)
        });

        console.log(`📧 Task assignment email sent to ${assigneeEmail}`);
        return true;
    } catch (err) {
        console.error('❌ Email send failed (task):', err.message);
        return false;
    }
}

/**
 * Send email when a document is shared
 */
async function sendDocumentSharedEmail(recipientEmail, recipientName, docData) {
    try {
        const statusClass = `status-${docData.status || 'draft'}`;
        const createdDate = docData.createdAt ? new Date(docData.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Today';

        const body = `
            <p style="font-size:15px;color:#334155;">Hi <strong>${recipientName}</strong>,</p>
            <p style="font-size:14px;color:#475569;">A document has been shared with you. Please review it at your earliest convenience.</p>
            
            <div class="info-card">
                <div class="info-row"><span class="info-label">Document</span><span class="info-value">${docData.title}</span></div>
                <div class="info-row"><span class="info-label">Type</span><span class="info-value">${(docData.type || '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span></div>
                <div class="info-row"><span class="info-label">Project</span><span class="info-value">${docData.projectName}</span></div>
                <div class="info-row"><span class="info-label">Status</span><span class="info-value"><span class="${statusClass}">${(docData.status || 'draft').toUpperCase()}</span></span></div>
                <div class="info-row"><span class="info-label">Created</span><span class="info-value">${createdDate}</span></div>
                ${docData.sharedBy ? `<div class="info-row"><span class="info-label">Shared By</span><span class="info-value">${docData.sharedBy}</span></div>` : ''}
            </div>
            
            <div style="text-align:center;">
                <a href="${BASE_URL}/documents" class="btn">View Document</a>
            </div>
            
            <p style="font-size:13px;color:#94a3b8;margin-top:24px;">Click the button above to view and download the document from the dashboard.</p>
        `;

        await transporter.sendMail({
            from: `"Project Management" <${process.env.EMAIL_USER || 'abrarshaikh.imscit21@gmail.com'}>`,
            to: recipientEmail,
            subject: `📄 Document Shared: ${docData.title} — ${docData.projectName}`,
            html: wrapEmail('Document Shared With You', 'A new document is available for review', body)
        });

        console.log(`📧 Document share email sent to ${recipientEmail}`);
        return true;
    } catch (err) {
        console.error('❌ Email send failed (document):', err.message);
        return false;
    }
}

/**
 * Send a generic notification email
 */
async function sendNotificationEmail(recipientEmail, recipientName, notifData) {
    try {
        const body = `
            <p style="font-size:15px;color:#334155;">Hi <strong>${recipientName}</strong>,</p>
            <p style="font-size:14px;color:#475569;">${notifData.message}</p>
            
            ${notifData.details ? `
            <div class="info-card">
                ${Object.entries(notifData.details).map(([key, val]) => 
                    `<div class="info-row"><span class="info-label">${key}</span><span class="info-value">${val}</span></div>`
                ).join('')}
            </div>` : ''}
            
            ${notifData.link ? `
            <div style="text-align:center;">
                <a href="${notifData.link}" class="btn">${notifData.linkText || 'View Details'}</a>
            </div>` : ''}
        `;

        await transporter.sendMail({
            from: `"Project Management" <${process.env.EMAIL_USER || 'abrarshaikh.imscit21@gmail.com'}>`,
            to: recipientEmail,
            subject: notifData.subject || 'Notification — Project Management',
            html: wrapEmail(notifData.title || 'Notification', notifData.subtitle || '', body)
        });

        console.log(`📧 Notification email sent to ${recipientEmail}`);
        return true;
    } catch (err) {
        console.error('❌ Email send failed (notification):', err.message);
        return false;
    }
}

/**
 * Send email to client when a new project is created
 */
async function sendProjectCreatedEmail(clientEmail, clientName, projectData) {
    try {
        const startDate = projectData.startDate ? new Date(projectData.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'To be confirmed';
        const dueDate = projectData.dueDate ? new Date(projectData.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'To be confirmed';
        const priorityClass = `priority-${projectData.priority || 'medium'}`;

        const body = `
            <p style="font-size:15px;color:#334155;">Hi <strong>${clientName}</strong>,</p>
            <p style="font-size:14px;color:#475569;">We're excited to let you know that your project has been created and our team is getting started! Here are the details:</p>
            
            <div class="info-card">
                <div class="info-row"><span class="info-label">Project</span><span class="info-value">${projectData.name}</span></div>
                <div class="info-row"><span class="info-label">Type</span><span class="info-value">${(projectData.type || '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span></div>
                <div class="info-row"><span class="info-label">Priority</span><span class="info-value"><span class="${priorityClass}">${(projectData.priority || 'medium').toUpperCase()}</span></span></div>
                <div class="info-row"><span class="info-label">Start Date</span><span class="info-value">${startDate}</span></div>
                <div class="info-row"><span class="info-label">Due Date</span><span class="info-value">${dueDate}</span></div>
                ${projectData.totalAmount ? `<div class="info-row"><span class="info-label">Total Amount</span><span class="info-value">₹ ${projectData.totalAmount.toLocaleString()}</span></div>` : ''}
            </div>
            
            ${projectData.description ? `<p style="font-size:14px;color:#475569;margin-top:16px;"><strong>Description:</strong> ${projectData.description}</p>` : ''}
            
            <div style="text-align:center;margin-top:24px;">
                <a href="${BASE_URL}" class="btn">View Dashboard</a>
            </div>
            
            <p style="font-size:13px;color:#94a3b8;margin-top:24px;">We'll keep you updated on the progress. If you have any questions, feel free to reach out to us.</p>
        `;

        await transporter.sendMail({
            from: `"Project Management" <${process.env.EMAIL_USER || 'abrarshaikh.imscit21@gmail.com'}>`,
            to: clientEmail,
            subject: `🚀 Project Created: ${projectData.name}`,
            html: wrapEmail('Project Created Successfully', 'Your project is now live', body)
        });

        console.log(`📧 Project created email sent to ${clientEmail}`);
        return true;
    } catch (err) {
        console.error('❌ Email send failed (project created):', err.message);
        return false;
    }
}

module.exports = {
    sendTaskAssignedEmail,
    sendDocumentSharedEmail,
    sendNotificationEmail,
    sendProjectCreatedEmail,
    transporter
};
