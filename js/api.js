// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// API Helper Functions
const api = {
    // Get token from localStorage
    getToken() {
        return localStorage.getItem('token');
    },

    // Set token in localStorage
    setToken(token) {
        localStorage.setItem('token', token);
    },

    // Remove token
    removeToken() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    // Get current user from localStorage
    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    // Set current user
    setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    },

    // Check if logged in
    isLoggedIn() {
        return !!this.getToken() && !!this.getUser();
    },

    // Get headers with auth token
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    },

    // Generic API request
    async request(endpoint, method = 'GET', data = null) {
        const config = {
            method,
            headers: this.getHeaders()
        };

        if (data && method !== 'GET') {
            config.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            const result = await response.json();

            // Handle unauthorized
            if (response.status === 401) {
                this.removeToken();
                window.location.href = 'login.html';
                return null;
            }

            return result;
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, error: error.message };
        }
    },

    // Auth endpoints
    async login(email, password) {
        return this.request('/auth/login', 'POST', { email, password });
    },

    async register(data) {
        return this.request('/auth/register', 'POST', data);
    },

    async logout() {
        const result = await this.request('/auth/logout', 'POST');
        this.removeToken();
        return result;
    },

    async getMe() {
        return this.request('/auth/me');
    },

    async updateProfile(data) {
        return this.request('/auth/updatedetails', 'PUT', data);
    },

    async updatePassword(currentPassword, newPassword) {
        return this.request('/auth/updatepassword', 'PUT', { currentPassword, newPassword });
    },

    // User endpoints
    async getUsers() {
        return this.request('/users');
    },

    async getUser(id) {
        return this.request(`/users/${id}`);
    },

    async createUser(data) {
        return this.request('/users', 'POST', data);
    },

    async updateUser(id, data) {
        return this.request(`/users/${id}`, 'PUT', data);
    },

    async deleteUser(id) {
        return this.request(`/users/${id}`, 'DELETE');
    },

    async getUserStats() {
        return this.request('/users/stats');
    },

    async getDevelopers() {
        return this.request('/users/developers');
    },

    // Project endpoints
    async getProjects() {
        return this.request('/projects');
    },

    async getProject(id) {
        return this.request(`/projects/${id}`);
    },

    async createProject(data) {
        return this.request('/projects', 'POST', data);
    },

    async updateProject(id, data) {
        return this.request(`/projects/${id}`, 'PUT', data);
    },

    async deleteProject(id) {
        return this.request(`/projects/${id}`, 'DELETE');
    },

    async getProjectStats() {
        return this.request('/projects/stats');
    },

    async updateStage(projectId, stageId, data) {
        return this.request(`/projects/${projectId}/stages/${stageId}`, 'PUT', data);
    },

    async getActivities(projectId) {
        return this.request(`/projects/${projectId}/activities`);
    },

    async addActivity(projectId, data) {
        return this.request(`/projects/${projectId}/activities`, 'POST', data);
    },

    async getRemarks(projectId) {
        return this.request(`/projects/${projectId}/remarks`);
    },

    async addRemark(projectId, text) {
        return this.request(`/projects/${projectId}/remarks`, 'POST', { text });
    },

    // Task endpoints
    async getTasks(filters = {}) {
        let query = '';
        if (Object.keys(filters).length > 0) {
            query = '?' + new URLSearchParams(filters).toString();
        }
        return this.request(`/tasks${query}`);
    },

    async getTask(id) {
        return this.request(`/tasks/${id}`);
    },

    async createTask(data) {
        return this.request('/tasks', 'POST', data);
    },

    async updateTask(id, data) {
        return this.request(`/tasks/${id}`, 'PUT', data);
    },

    async deleteTask(id) {
        return this.request(`/tasks/${id}`, 'DELETE');
    },

    async getMyTasks() {
        return this.request('/tasks/my');
    },

    async getMyCompletedTasks() {
        return this.request('/tasks/my/completed');
    },

    async updateTaskTime(id, duration) {
        return this.request(`/tasks/${id}/time`, 'PUT', { duration });
    },

    async getTaskStats() {
        return this.request('/tasks/stats');
    },

    // Payment endpoints
    async getClientPayments(projectId) {
        return this.request(`/payments/client/${projectId}`);
    },

    async addClientPayment(data) {
        return this.request('/payments/client', 'POST', data);
    },

    async updateClientPayment(id, data) {
        return this.request(`/payments/client/${id}`, 'PUT', data);
    },

    async deleteClientPayment(id) {
        return this.request(`/payments/client/${id}`, 'DELETE');
    },

    async getDeveloperPaymentsByProject(projectId) {
        return this.request(`/payments/developer/project/${projectId}`);
    },

    async getMyPayments() {
        return this.request('/payments/developer/my');
    },

    async addDeveloperPayment(data) {
        return this.request('/payments/developer', 'POST', data);
    },

    async getDeveloperPaymentStats(developerId) {
        return this.request(`/payments/developer/${developerId}/stats`);
    },

    // Time log endpoints
    async getTimeLogs(filters = {}) {
        let query = '';
        if (Object.keys(filters).length > 0) {
            query = '?' + new URLSearchParams(filters).toString();
        }
        return this.request(`/timelogs${query}`);
    },

    async createTimeLog(data) {
        return this.request('/timelogs', 'POST', data);
    },

    async getMyTimeLogs() {
        return this.request('/timelogs/my');
    },

    async getMyTimeStats() {
        return this.request('/timelogs/my/stats');
    },

    async deleteTimeLog(id) {
        return this.request(`/timelogs/${id}`, 'DELETE');
    }
};

// Auth Guard - Check if user is logged in
function requireAuth() {
    if (!api.isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Role Guard - Check if user has required role
function requireRole(...roles) {
    const user = api.getUser();
    if (!user || !roles.includes(user.role)) {
        window.location.href = 'my-work.html';
        return false;
    }
    return true;
}

// Setup navigation based on role
function setupNavigation() {
    const user = api.getUser();
    if (!user) return;

    // Update user info in nav
    const userNameEl = document.getElementById('userName');
    const userInitialsEl = document.getElementById('userInitials');
    
    if (userNameEl) userNameEl.textContent = user.name;
    if (userInitialsEl) {
        userInitialsEl.textContent = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    // Hide admin-only elements
    if (user.role !== 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    }

    // Hide admin-subadmin-only elements for developers
    if (user.role === 'developer') {
        document.querySelectorAll('.admin-subadmin-only').forEach(el => el.style.display = 'none');
    }
}

// Logout function
async function logout() {
    await api.logout();
    window.location.href = 'login.html';
}

// Format date helper
function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Format time helper (seconds to hours/minutes)
function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// Format currency
function formatCurrency(amount) {
    return '$' + (amount || 0).toLocaleString();
}

// Days until deadline
function getDaysUntil(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(dateStr);
    return Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
}

// Get deadline status text
function getDeadlineStatus(dateStr) {
    const days = getDaysUntil(dateStr);
    if (days < 0) return { text: `${Math.abs(days)} days overdue`, class: 'text-red-600 font-medium' };
    if (days === 0) return { text: 'Due today', class: 'text-amber-600 font-medium' };
    if (days === 1) return { text: 'Due tomorrow', class: 'text-amber-600' };
    if (days <= 3) return { text: `${days} days left`, class: 'text-amber-500' };
    return { text: `${days} days left`, class: 'text-gray-500' };
}

// Show loading state
function showLoading(container, message = 'Loading...') {
    if (typeof container === 'string') {
        container = document.getElementById(container);
    }
    if (container) {
        container.innerHTML = `
            <div class="flex items-center justify-center py-12">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span class="ml-3 text-gray-500">${message}</span>
            </div>
        `;
    }
}

// Show error state
function showError(container, message = 'Failed to load data') {
    if (typeof container === 'string') {
        container = document.getElementById(container);
    }
    if (container) {
        container.innerHTML = `
            <div class="text-center py-12">
                <svg class="w-12 h-12 mx-auto text-red-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p class="text-red-600">${message}</p>
            </div>
        `;
    }
}

// Show empty state
function showEmpty(container, message = 'No data found', icon = null) {
    if (typeof container === 'string') {
        container = document.getElementById(container);
    }
    if (container) {
        container.innerHTML = `
            <div class="text-center py-12">
                ${icon || `
                    <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                    </svg>
                `}
                <p class="text-gray-500">${message}</p>
            </div>
        `;
    }
}

// Toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    toast.className = `fixed bottom-4 right-4 ${bgColor} text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-fade-in`;
    toast.innerHTML = `
        <div class="flex items-center gap-2">
            ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}
