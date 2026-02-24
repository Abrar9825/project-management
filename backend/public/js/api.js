/**
 * API Configuration and Helper Functions
 * Project Control System - Frontend API Layer
 */

// Use relative path for API calls (works on both localhost and production)
const API_BASE_URL = '/api';

// ==================== AUTH TOKEN MANAGEMENT ====================
const api = {
    // Get stored token
    getToken: () => localStorage.getItem('token'),
    
    // Set token
    setToken: (token) => localStorage.setItem('token', token),
    
    // Remove token
    removeToken: () => localStorage.removeItem('token'),
    
    // Get stored user
    getUser: () => JSON.parse(localStorage.getItem('user') || 'null'),
    
    // Set user
    setUser: (user) => localStorage.setItem('user', JSON.stringify(user)),
    
    // Remove user
    removeUser: () => localStorage.removeItem('user'),
    
    // Check if logged in
    isLoggedIn: () => !!localStorage.getItem('token'),
    
    // Get auth headers
    getHeaders: () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    }),

    // ==================== AUTH API ====================
    login: async (email, password) => {
        try {
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    getMe: async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    logout: () => {
        api.removeToken();
        api.removeUser();
        window.location.href = '/login';
    },

    // ==================== USERS API ====================
    getUsers: async (filters = {}) => {
        try {
            const params = new URLSearchParams(filters);
            const res = await fetch(`${API_BASE_URL}/users?${params}`, {
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    getUserById: async (id) => {
        try {
            const res = await fetch(`${API_BASE_URL}/users/${id}`, {
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    createUser: async (userData) => {
        try {
            const res = await fetch(`${API_BASE_URL}/users`, {
                method: 'POST',
                headers: api.getHeaders(),
                body: JSON.stringify(userData)
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    updateUser: async (id, userData) => {
        try {
            const res = await fetch(`${API_BASE_URL}/users/${id}`, {
                method: 'PUT',
                headers: api.getHeaders(),
                body: JSON.stringify(userData)
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    deleteUser: async (id) => {
        try {
            const res = await fetch(`${API_BASE_URL}/users/${id}`, {
                method: 'DELETE',
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    getDevelopers: async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/users?role=developer`, {
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // ==================== PROJECTS API ====================
    getProjects: async (filters = {}) => {
        try {
            const params = new URLSearchParams(filters);
            const res = await fetch(`${API_BASE_URL}/projects?${params}`, {
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    getProject: async (id) => {
        try {
            const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    createProject: async (projectData) => {
        try {
            const res = await fetch(`${API_BASE_URL}/projects`, {
                method: 'POST',
                headers: api.getHeaders(),
                body: JSON.stringify(projectData)
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    updateProject: async (id, projectData) => {
        try {
            const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
                method: 'PUT',
                headers: api.getHeaders(),
                body: JSON.stringify(projectData)
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    deleteProject: async (id) => {
        try {
            const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
                method: 'DELETE',
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // ==================== BLOCKERS API ====================
    getBlockers: async (projectId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/projects/${projectId}/blockers`, {
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    computeBlockers: async (projectId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/projects/${projectId}/blockers`, {
                method: 'POST',
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // ==================== HEALTH API ====================
    getHealth: async (projectId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/projects/${projectId}/health`, {
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // ==================== CLIENT VIEW API ====================
    getClientView: async (projectId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/projects/${projectId}/client-view`, {
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // ==================== APPROVAL WORKFLOW API ====================
    submitStageForApproval: async (projectId, stageId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/projects/${projectId}/stages/${stageId}/submit-approval`, {
                method: 'PUT',
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    reviewStage: async (projectId, stageId, status, notes = '') => {
        try {
            const res = await fetch(`${API_BASE_URL}/projects/${projectId}/stages/${stageId}/subadmin-review`, {
                method: 'PUT',
                headers: api.getHeaders(),
                body: JSON.stringify({status, notes})
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    adminApproveStage: async (projectId, stageId, status, notes = '') => {
        try {
            const res = await fetch(`${API_BASE_URL}/projects/${projectId}/stages/${stageId}/admin-approve`, {
                method: 'PUT',
                headers: api.getHeaders(),
                body: JSON.stringify({status, notes})
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // ==================== ASSET REQUESTS API ====================
    addAssetRequest: async (projectId, stageId, assetData) => {
        try {
            const res = await fetch(`${API_BASE_URL}/projects/${projectId}/stages/${stageId}/asset-requests`, {
                method: 'POST',
                headers: api.getHeaders(),
                body: JSON.stringify(assetData)
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    updateAssetRequest: async (projectId, stageId, assetId, assetData) => {
        try {
            const res = await fetch(`${API_BASE_URL}/projects/${projectId}/stages/${stageId}/asset-requests/${assetId}`, {
                method: 'PUT',
                headers: api.getHeaders(),
                body: JSON.stringify(assetData)
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    deleteAssetRequest: async (projectId, stageId, assetId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/projects/${projectId}/stages/${stageId}/asset-requests/${assetId}`, {
                method: 'DELETE',
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // ==================== STAGE VISIBILITY & LINKING ====================
    toggleStageVisibility: async (projectId, stageId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/projects/${projectId}/stages/${stageId}/visibility`, {
                method: 'PUT',
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    linkPaymentToStage: async (projectId, stageId, paymentMilestone) => {
        try {
            const res = await fetch(`${API_BASE_URL}/projects/${projectId}/stages/${stageId}/link-payment`, {
                method: 'PUT',
                headers: api.getHeaders(),
                body: JSON.stringify({linkedPaymentMilestone: paymentMilestone})
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // ==================== PDF GENERATION ====================
    getStagePdfData: async (projectId, stageId, type = 'technical') => {
        try {
            const res = await fetch(`${API_BASE_URL}/projects/${projectId}/stages/${stageId}/pdf-data?type=${type}`, {
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // ==================== MAINTENANCE MODE ====================
    enterMaintenanceMode: async (projectId, notes = '') => {
        try {
            const res = await fetch(`${API_BASE_URL}/projects/${projectId}/maintenance`, {
                method: 'PUT',
                headers: api.getHeaders(),
                body: JSON.stringify({notes})
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    updateStage: async (projectId, stageIndex, stageData) => {
        try {
            const res = await fetch(`${API_BASE_URL}/projects/${projectId}/stages/${stageIndex}`, {
                method: 'PUT',
                headers: api.getHeaders(),
                body: JSON.stringify(stageData)
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    addRemark: async (projectId, remarkData) => {
        try {
            const res = await fetch(`${API_BASE_URL}/projects/${projectId}/remarks`, {
                method: 'POST',
                headers: api.getHeaders(),
                body: JSON.stringify(remarkData)
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    addActivity: async (projectId, activityData) => {
        try {
            const res = await fetch(`${API_BASE_URL}/projects/${projectId}/activities`, {
                method: 'POST',
                headers: api.getHeaders(),
                body: JSON.stringify(activityData)
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // ==================== TASKS API ====================
    getTasks: async (filters = {}) => {
        try {
            const params = new URLSearchParams(filters);
            const res = await fetch(`${API_BASE_URL}/tasks?${params}`, {
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    getMyTasks: async () => {
        try {
            const token = localStorage.getItem('token');
            console.log('getMyTasks - Token from storage:', token);
            console.log('getMyTasks - Headers being sent:', api.getHeaders());
            
            const res = await fetch(`${API_BASE_URL}/tasks/my`, {
                headers: api.getHeaders()
            });
            
            console.log('getMyTasks - Response status:', res.status);
            const data = await res.json();
            console.log('getMyTasks - Response data:', data);
            return data;
        } catch (error) {
            console.error('getMyTasks - Error:', error);
            return { success: false, error: error.message };
        }
    },

    getTask: async (id) => {
        try {
            const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    createTask: async (taskData) => {
        try {
            const res = await fetch(`${API_BASE_URL}/tasks`, {
                method: 'POST',
                headers: api.getHeaders(),
                body: JSON.stringify(taskData)
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    updateTask: async (id, taskData) => {
        try {
            const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
                method: 'PUT',
                headers: api.getHeaders(),
                body: JSON.stringify(taskData)
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    deleteTask: async (id) => {
        try {
            const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
                method: 'DELETE',
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // ==================== PAYMENTS API ====================
    getPayments: async (filters = {}) => {
        try {
            const params = new URLSearchParams(filters);
            const res = await fetch(`${API_BASE_URL}/payments?${params}`, {
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    getMyPayments: async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/payments/my-payments`, {
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    createPayment: async (paymentData) => {
        try {
            const res = await fetch(`${API_BASE_URL}/payments`, {
                method: 'POST',
                headers: api.getHeaders(),
                body: JSON.stringify(paymentData)
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    updatePayment: async (id, paymentData) => {
        try {
            const res = await fetch(`${API_BASE_URL}/payments/${id}`, {
                method: 'PUT',
                headers: api.getHeaders(),
                body: JSON.stringify(paymentData)
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // ==================== TIME LOGS API ====================
    getTimeLogs: async (filters = {}) => {
        try {
            const params = new URLSearchParams(filters);
            const res = await fetch(`${API_BASE_URL}/timelogs?${params}`, {
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    getMyTimeLogs: async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/timelogs/my`, {
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    getMyTimeStats: async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/timelogs/my/stats`, {
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    createTimeLog: async (timeLogData) => {
        try {
            const res = await fetch(`${API_BASE_URL}/timelogs`, {
                method: 'POST',
                headers: api.getHeaders(),
                body: JSON.stringify(timeLogData)
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    updateTimeLog: async (id, timeLogData) => {
        try {
            const res = await fetch(`${API_BASE_URL}/timelogs/${id}`, {
                method: 'PUT',
                headers: api.getHeaders(),
                body: JSON.stringify(timeLogData)
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // ==================== DOCUMENTS API ====================
    getDocuments: async (filters = {}) => {
        try {
            const params = new URLSearchParams(filters);
            const res = await fetch(`${API_BASE_URL}/documents?${params}`, {
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    getProjectDocuments: async (projectId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/documents/project/${projectId}`, {
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    createDocument: async (docData) => {
        try {
            const res = await fetch(`${API_BASE_URL}/documents`, {
                method: 'POST',
                headers: api.getHeaders(),
                body: JSON.stringify(docData)
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    updateDocument: async (id, docData) => {
        try {
            const res = await fetch(`${API_BASE_URL}/documents/${id}`, {
                method: 'PUT',
                headers: api.getHeaders(),
                body: JSON.stringify(docData)
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    approveDocument: async (id) => {
        try {
            const res = await fetch(`${API_BASE_URL}/documents/${id}/approve`, {
                method: 'PUT',
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    deleteDocument: async (id) => {
        try {
            const res = await fetch(`${API_BASE_URL}/documents/${id}`, {
                method: 'DELETE',
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    generateQuotation: async (projectId, quotationData) => {
        try {
            const res = await fetch(`${API_BASE_URL}/documents/generate-quotation/${projectId}`, {
                method: 'POST',
                headers: api.getHeaders(),
                body: JSON.stringify(quotationData)
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    generateHandover: async (projectId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/documents/generate-handover/${projectId}`, {
                method: 'POST',
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // ==================== SUPPORT TICKETS API ====================
    getTickets: async (filters = {}) => {
        try {
            const params = new URLSearchParams(filters);
            const res = await fetch(`${API_BASE_URL}/tickets?${params}`, {
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    getProjectTickets: async (projectId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/tickets/project/${projectId}`, {
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    createTicket: async (ticketData) => {
        try {
            const res = await fetch(`${API_BASE_URL}/tickets`, {
                method: 'POST',
                headers: api.getHeaders(),
                body: JSON.stringify(ticketData)
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    updateTicket: async (id, ticketData) => {
        try {
            const res = await fetch(`${API_BASE_URL}/tickets/${id}`, {
                method: 'PUT',
                headers: api.getHeaders(),
                body: JSON.stringify(ticketData)
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    addTicketRemark: async (id, remarkText) => {
        try {
            const res = await fetch(`${API_BASE_URL}/tickets/${id}/remarks`, {
                method: 'POST',
                headers: api.getHeaders(),
                body: JSON.stringify({remark: remarkText})
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    deleteTicket: async (id) => {
        try {
            const res = await fetch(`${API_BASE_URL}/tickets/${id}`, {
                method: 'DELETE',
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    getTicketStats: async (projectId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/tickets/stats/${projectId}`, {
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // ==================== UTILITY FUNCTIONS ====================
    formatTime: (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    },

    formatTimeShort: (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    },

    formatDate: (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },

    formatDateTime: (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleString('en-US', { 
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    },

    formatCurrency: (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0
        }).format(amount || 0);
    },

    getDaysUntil: (dateStr) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deadline = new Date(dateStr);
        return Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
    },

    getDeadlineInfo: (dateStr) => {
        const days = api.getDaysUntil(dateStr);
        if (days < 0) return { text: `${Math.abs(days)} days overdue`, class: 'text-red-600 font-medium' };
        if (days === 0) return { text: 'Due today', class: 'text-amber-600 font-medium' };
        if (days === 1) return { text: 'Due tomorrow', class: 'text-amber-600' };
        if (days <= 3) return { text: `${days} days left`, class: 'text-amber-500' };
        return { text: `${days} days left`, class: 'text-gray-500' };
    },

    // ==================== UI HELPERS ====================
    showToast: (message, type = 'info') => {
        console.log(`[${type.toUpperCase()}] ${message}`);
    },

    showError: (message) => {
        console.error('[ERROR]', message);
        alert(`Error: ${message}`);
    },

    showLoading: (containerId, message = 'Loading...') => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `<div class="flex items-center justify-center py-12"><div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div><span class="ml-3 text-gray-600">${message}</span></div>`;
        }
    },

    showEmpty: (containerId, message = 'No data found') => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `<div class="text-center py-12"><div class="text-4xl mb-2">📭</div><p class="text-gray-500">${message}</p></div>`;
        }
    },

    startTimer: async (taskId, description = '') => {
        try {
            const res = await fetch(`${API_BASE_URL}/timelogs/start`, {
                method: 'POST',
                headers: api.getHeaders(),
                body: JSON.stringify({ task: taskId, description })
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    stopTimer: async (timeLogId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/timelogs/${timeLogId}/stop`, {
                method: 'PUT',
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // ==================== DOCUMENT GENERATOR API ====================
    generateDocument: async (projectId, docType) => {
        try {
            const res = await fetch(`${API_BASE_URL}/generator/${projectId}/generate/${docType}`, {
                method: 'POST',
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    generateAllDocuments: async (projectId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/generator/${projectId}/generate-all`, {
                method: 'POST',
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    regenerateDocument: async (projectId, docType) => {
        try {
            const res = await fetch(`${API_BASE_URL}/generator/${projectId}/regenerate/${docType}`, {
                method: 'POST',
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    getDocumentCenter: async (projectId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/generator/${projectId}/documents`, {
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    sendDocToClient: async (docId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/generator/documents/${docId}/send-to-client`, {
                method: 'PUT',
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    getClientDocuments: async (projectId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/generator/${projectId}/client-documents`, {
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    generateMonthlyReportRecord: async (projectId, data) => {
        try {
            const res = await fetch(`${API_BASE_URL}/generator/${projectId}/monthly-report`, {
                method: 'POST',
                headers: api.getHeaders(),
                body: JSON.stringify(data)
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    getMonthlyReports: async (projectId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/generator/${projectId}/monthly-reports`, {
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // ==================== MEETINGS API ====================
    getMeetings: async (projectId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/meetings/project/${projectId}`, {
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    getUpcomingMeetings: async (projectId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/meetings/project/${projectId}/upcoming`, {
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    createMeeting: async (meetingData) => {
        try {
            const res = await fetch(`${API_BASE_URL}/meetings`, {
                method: 'POST',
                headers: api.getHeaders(),
                body: JSON.stringify(meetingData)
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    updateMeeting: async (id, meetingData) => {
        try {
            const res = await fetch(`${API_BASE_URL}/meetings/${id}`, {
                method: 'PUT',
                headers: api.getHeaders(),
                body: JSON.stringify(meetingData)
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    deleteMeeting: async (id) => {
        try {
            const res = await fetch(`${API_BASE_URL}/meetings/${id}`, {
                method: 'DELETE',
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // ==================== FEEDBACK API ====================
    getFeedback: async (projectId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/feedback/project/${projectId}`, {
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    getFeedbackStats: async (projectId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/feedback/project/${projectId}/stats`, {
                headers: api.getHeaders()
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    submitFeedback: async (feedbackData) => {
        try {
            const res = await fetch(`${API_BASE_URL}/feedback`, {
                method: 'POST',
                headers: api.getHeaders(),
                body: JSON.stringify(feedbackData)
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    respondToFeedback: async (id, responseText) => {
        try {
            const res = await fetch(`${API_BASE_URL}/feedback/${id}/respond`, {
                method: 'PUT',
                headers: api.getHeaders(),
                body: JSON.stringify({ text: responseText })
            });
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // ==================== GENERIC FETCH HELPER ====================
    fetch: async (url, method = 'GET', body = null) => {
        try {
            const opts = { method, headers: api.getHeaders() };
            if (body && method !== 'GET') opts.body = JSON.stringify(body);
            const res = await fetch(`${API_BASE_URL}${url.startsWith('/api') ? url.replace('/api', '') : url}`, opts);
            return await res.json();
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

// ==================== AUTH GUARD HELPERS ====================
function requireAuth() {
    if (!api.isLoggedIn()) {
        window.location.href = '/login';
        return false;
    }
    return true;
}

function requireRole(...allowedRoles) {
    const user = api.getUser();
    if (!user || !allowedRoles.includes(user.role)) {
        // Redirect clients to client portal
        if (user && user.role === 'client') {
            window.location.href = '/client-portal';
            return false;
        }
        window.location.href = '/my-work';
        return false;
    }
    return true;
}

// Setup navigation based on role
function setupNavigation() {
    const user = api.getUser();
    if (!user) return;

    // Redirect clients away from internal pages
    if (user.role === 'client') {
        const allowed = ['/client-portal', '/login'];
        if (!allowed.some(p => window.location.pathname.startsWith(p))) {
            window.location.href = '/client-portal';
            return;
        }
    }

    // Set user info in nav
    const userName = document.getElementById('userName');
    const userInitials = document.getElementById('userInitials');
    if (userName) userName.textContent = user.name;
    if (userInitials) userInitials.textContent = user.name.split(' ').map(n => n[0]).join('').substring(0, 2);

    // Hide admin-only elements for non-admins
    if (user.role !== 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    }

    // Hide admin-subadmin-only elements for developers and clients
    if (user.role === 'developer' || user.role === 'client') {
        document.querySelectorAll('.admin-subadmin-only').forEach(el => el.style.display = 'none');
    }
}

function logout() {
    api.logout();
}

// ==================== UTILITY FUNCTIONS ====================
function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', { 
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatTimeShort(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0
    }).format(amount || 0);
}

function getDaysUntil(dateStr) {
    const today = new Date(); 
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(dateStr);
    return Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
}

function getDeadlineInfo(dateStr) {
    const days = getDaysUntil(dateStr);
    if (days < 0) return { text: `${Math.abs(days)} days overdue`, class: 'text-red-600 font-medium' };
    if (days === 0) return { text: 'Due today', class: 'text-amber-600 font-medium' };
    if (days === 1) return { text: 'Due tomorrow', class: 'text-amber-600' };
    if (days <= 3) return { text: `${days} days left`, class: 'text-amber-500' };
    return { text: `${days} days left`, class: 'text-gray-500' };
}

// ==================== UI HELPERS ====================
function showLoading(containerId, message = 'Loading...') {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="flex items-center justify-center py-12">
                <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                <span class="ml-3 text-gray-600">${message}</span>
            </div>
        `;
    }
}

function showError(containerId, message = 'Something went wrong') {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="text-center py-12">
                <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
                <p class="text-red-600 font-medium">${message}</p>
            </div>
        `;
    }
}

function showEmpty(containerId, message = 'No data found') {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="text-center py-12">
                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                    </svg>
                </div>
                <p class="text-gray-500">${message}</p>
            </div>
        `;
    }
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    toast.className = `fixed bottom-4 right-4 ${bgColor} text-white px-6 py-3 rounded-xl shadow-lg z-50 transform transition-all`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Note: statusConfig, priorityConfig, healthConfig, gradients configs are defined locally in each EJS view
// to avoid variable naming conflicts
