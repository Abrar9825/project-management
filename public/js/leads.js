// ======================== GLOBALS & CONFIG ========================

let allLeads = [];
let currentLeadId = null;
let selectedFiles = [];

const API_BASE = '/api/leads';
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

// ======================== INITIALIZATION ========================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Leads page initialized');
    await loadLeads();
});

// ======================== API CALLS ========================

async function loadLeads() {
    try {
        const res = await fetch(API_BASE, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
            allLeads = data.data;
            renderLeads(allLeads);
            updateStats();
        } else {
            showToast(data.error || 'Failed to load leads', 'error');
        }
    } catch (err) {
        console.error('Error loading leads:', err);
        showToast('Error loading leads', 'error');
    }
}

async function createLead(formData) {
    try {
        const res = await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await res.json();

        if (data.success) {
            showToast('Lead created successfully!', 'success');
            closeLeadModal();
            await loadLeads();
            return data.data;
        } else {
            showToast(data.error || 'Failed to create lead', 'error');
        }
    } catch (err) {
        console.error('Error creating lead:', err);
        showToast('Error creating lead', 'error');
    }
}

async function updateLead(leadId, leadData) {
    try {
        const res = await fetch(`${API_BASE}/${leadId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(leadData)
        });
        const data = await res.json();

        if (data.success) {
            showToast('Lead updated successfully!', 'success');
            closeDetailModal();
            await loadLeads();
            return data.data;
        } else {
            showToast(data.error || 'Failed to update lead', 'error');
        }
    } catch (err) {
        console.error('Error updating lead:', err);
        showToast('Error updating lead', 'error');
    }
}

async function deleteLead(leadId) {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
        const res = await fetch(`${API_BASE}/${leadId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
            showToast('Lead deleted successfully!', 'success');
            await loadLeads();
        } else {
            showToast(data.error || 'Failed to delete lead', 'error');
        }
    } catch (err) {
        console.error('Error deleting lead:', err);
        showToast('Error deleting lead', 'error');
    }
}

async function uploadDocuments(leadId, formData) {
    try {
        const res = await fetch(`${API_BASE}/${leadId}/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await res.json();

        if (data.success) {
            showToast(`${data.message}`, 'success');
            await loadLeads();
            return data.data;
        } else {
            showToast(data.error || 'Failed to upload documents', 'error');
        }
    } catch (err) {
        console.error('Error uploading documents:', err);
        showToast('Error uploading documents', 'error');
    }
}

async function deleteDocument(leadId, docId) {
    if (!confirm('Delete this document?')) return;

    try {
        const res = await fetch(`${API_BASE}/${leadId}/documents/${docId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
            showToast('Document deleted', 'success');
            await viewLeadDetail(leadId);
        } else {
            showToast(data.error || 'Failed to delete document', 'error');
        }
    } catch (err) {
        console.error('Error deleting document:', err);
        showToast('Error deleting document', 'error');
    }
}

async function convertLeadToProject(leadId) {
    const lead = allLeads.find(l => l._id === leadId);
    if (!lead) return;

    if (!confirm(`Convert "${lead.company}" to a project?\n\nYou will be redirected to the project creation form with lead data pre-filled.`)) return;

    // Redirect to add-project page with leadId parameter
    window.location.href = `/add-project?leadId=${leadId}`;
}

// ======================== RENDERING ========================

function renderLeads(leads) {
    const container = document.getElementById('leadsContainer');

    if (!leads || leads.length === 0) {
        container.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-16">
                <svg class="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <p class="text-gray-500 font-medium text-lg">No leads found</p>
                <p class="text-gray-400 text-sm mt-1">Create your first lead to get started</p>
            </div>
        `;
        return;
    }

    container.innerHTML = leads.map(lead => {
        const statusIcon = getStatusIcon(lead.status);
        const statusColor = getStatusColor(lead.status);
        const typeIcon = getProjectTypeIcon(lead.projectType);

        return `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden card-hover fade-in">
                <!-- Card Header with Status -->
                <div class="bg-gradient-to-r from-teal-600 to-teal-700 px-4 py-3">
                    <div class="flex items-start justify-between gap-2">
                        <div class="flex-1 min-w-0">
                            <h3 class="text-sm font-bold text-white truncate">${lead.fullName}</h3>
                            <p class="text-teal-100 text-xs mt-0.5 truncate">${lead.company}</p>
                        </div>
                        <span class="whitespace-nowrap ${statusColor} flex items-center gap-1">
                            <span>${statusIcon}</span>
                            <span>${capitalize(lead.status)}</span>
                        </span>
                    </div>
                </div>

                <!-- Card Body -->
                <div class="px-4 py-2.5 space-y-2">
                    <!-- Contact Info -->
                    <div class="space-y-1">
                        <a href="mailto:${lead.email}" class="flex items-center gap-1.5 text-xs text-gray-700 hover:text-teal-600 transition truncate">
                            <svg class="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                            </svg>
                            <span class="truncate">${lead.email}</span>
                        </a>
                        ${lead.phone ? `
                            <div class="flex items-center gap-1.5 text-xs text-gray-700">
                                <svg class="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                                </svg>
                                <span class="truncate">${lead.phone}</span>
                            </div>
                        ` : ''}
                    </div>

                    <!-- Project Details -->
                    <div class="bg-gray-50 rounded-lg p-2 space-y-1 border border-gray-100">
                        <div class="flex items-center gap-2">
                            <span class="text-sm">${typeIcon}</span>
                            <div class="flex-1 min-w-0">
                                <p class="text-xs text-gray-600 font-medium">Type</p>
                                <p class="text-xs font-semibold text-gray-900 truncate">${capitalize(lead.projectType) || 'N/A'}</p>
                            </div>
                        </div>
                        ${lead.budget ? `
                            <div class="flex items-center gap-2 pt-1 border-t border-gray-200">
                                <span class="text-sm">💰</span>
                                <div class="flex-1">
                                    <p class="text-xs text-gray-600 font-medium">Budget</p>
                                    <p class="text-xs font-bold text-teal-700">₨${lead.budget.toLocaleString()}</p>
                                </div>
                            </div>
                        ` : ''}
                    </div>

                    <!-- Documents & Meta -->
                    <div class="flex items-center justify-between text-xs text-gray-500">
                        <div class="flex items-center gap-1">
                            ${lead.attachments && lead.attachments.length > 0 ? `
                                <span>📄</span>
                                <span>${lead.attachments.length} doc${lead.attachments.length !== 1 ? 's' : ''}</span>
                            ` : `
                                <span>📋</span>
                                <span>No docs</span>
                            `}
                        </div>
                        <span>${new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                </div>

                <!-- Card Footer -->
                <div class="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex gap-1.5">
                    <button onclick="viewLeadDetail('${lead._id}')" class="flex-1 ds-btn ds-btn-xs ds-btn-outline flex items-center justify-center gap-1 text-xs">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                        <span>View</span>
                    </button>
                    ${lead.convertedToProjectId ? `
                        <button onclick="window.location.href='/project-detail?id=${lead.convertedToProjectId._id || lead.convertedToProjectId}'" class="flex-1 ds-btn ds-btn-xs ds-btn-success flex items-center justify-center gap-1 text-xs">
                            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                            </svg>
                            <span>Converted</span>
                        </button>
                    ` : `
                        <button onclick="convertLeadToProject('${lead._id}')" class="flex-1 ds-btn ds-btn-xs ds-btn-primary flex items-center justify-center gap-1 text-xs">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                            </svg>
                            <span>Convert</span>
                        </button>
                    `}
                </div>
            </div>
        `;
    }).join('');
}

function getStatusIcon(status) {
    const icons = {
        'new': '🆕',
        'contacted': '📞',
        'quoted': '💼',
        'converted': '✅',
        'rejected': '❌'
    };
    return icons[status] || '•';
}

function getStatusColor(status) {
    const colors = {
        'new': 'status-badge badge-new',
        'contacted': 'status-badge badge-contacted',
        'quoted': 'status-badge badge-quoted',
        'converted': 'status-badge badge-converted',
        'rejected': 'status-badge badge-rejected'
    };
    return colors[status] || 'status-badge badge-new';
}

function getProjectTypeIcon(type) {
    const icons = {
        'web': '🌐',
        'mobile': '📱',
        'desktop': '💻',
        'design': '🎨',
        'other': '📋'
    };
    return icons[type] || '📋';
}

function getStatusBadgeClass(status) {
    const classes = {
        'new': 'bg-blue-100 text-blue-800',
        'contacted': 'bg-purple-100 text-purple-800',
        'quoted': 'bg-yellow-100 text-yellow-800',
        'converted': 'bg-green-100 text-green-800',
        'rejected': 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
}

// ======================== FILTERING & SEARCH ========================

function filterLeads() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const status = document.getElementById('statusFilter').value;
    const converted = document.getElementById('convertedFilter').value;

    const filtered = allLeads.filter(lead => {
        const matchSearch = !search || 
            lead.company.toLowerCase().includes(search) ||
            lead.email.toLowerCase().includes(search) ||
            lead.firstName.toLowerCase().includes(search) ||
            lead.lastName.toLowerCase().includes(search);

        const matchStatus = !status || lead.status === status;

        const matchConverted = !converted || 
            (converted === 'true' && lead.convertedToProjectId) ||
            (converted === 'false' && !lead.convertedToProjectId);

        return matchSearch && matchStatus && matchConverted;
    });

    renderLeads(filtered);
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('convertedFilter').value = '';
    renderLeads(allLeads);
}

function updateStats() {
    const total = allLeads.length;
    const newCount = allLeads.filter(l => l.status === 'new').length;
    const contacted = allLeads.filter(l => l.status === 'contacted').length;
    const converted = allLeads.filter(l => l.convertedToProjectId).length;

    document.getElementById('totalLeads').textContent = total;
    document.getElementById('newLeads').textContent = newCount;
    document.getElementById('contactedLeads').textContent = contacted;
    document.getElementById('convertedLeads').textContent = converted;
}

// ======================== MODAL & FORM HANDLING ========================

function openCreateLeadModal() {
    // Navigate to separate create-lead page
    window.location.href = '/create-lead';
}

function closeLeadModal() {
    // No longer used - using separate page now
}

function closeDetailModal() {
    // No longer used - using separate page now
}

function handleFileSelect(event) {
    selectedFiles = Array.from(event.target.files);
    renderFileList();
}

function renderFileList() {
    const fileList = document.getElementById('fileList');
    if (selectedFiles.length === 0) {
        fileList.innerHTML = '';
        return;
    }

    fileList.innerHTML = `
        <div class="mt-2 space-y-1">
            ${selectedFiles.map((file, idx) => `
                <div class="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                    <span class="text-gray-700">📄 ${file.name}</span>
                    <button type="button" onclick="removeFile(${idx})" class="text-red-500 hover:text-red-700">✕</button>
                </div>
            `).join('')}
        </div>
    `;
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    renderFileList();
}

function handleLeadFormSubmit(event) {
    event.preventDefault();

    const formData = new FormData();
    formData.append('firstName', document.getElementById('firstName').value);
    formData.append('lastName', document.getElementById('lastName').value);
    formData.append('company', document.getElementById('company').value);
    formData.append('email', document.getElementById('email').value);
    formData.append('phone', document.getElementById('phone').value);
    formData.append('projectType', document.getElementById('projectType').value);
    formData.append('budget', document.getElementById('budget').value || 0);
    formData.append('description', document.getElementById('description').value);

    // Add selected files
    selectedFiles.forEach(file => {
        formData.append('documents', file);
    });

    createLead(formData);
}

// ======================== LEAD DETAIL VIEW ========================

async function viewLeadDetail(leadId) {
    // Navigate to separate detail page
    window.location.href = `/lead-detail?id=${leadId}`;
}

async function updateLeadStatus() {
    const newStatus = document.getElementById('statusSelect').value;
    await updateLead(currentLeadId, { status: newStatus });
}

async function handleUploadFile(leadId) {
    const input = document.getElementById('uploadInput');
    if (!input.files || input.files.length === 0) return;

    const formData = new FormData();
    Array.from(input.files).forEach(file => {
        formData.append('documents', file);
    });

    await uploadDocuments(leadId, formData);
}

// ======================== UTILITIES ========================

function capitalize(str) {
    if (!str || typeof str !== 'string') return '-';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const bgColor = type === 'success' ? 'bg-green-50 border border-green-200' : 
                   type === 'error' ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200';
    const textColor = type === 'success' ? 'text-green-800' : 
                     type === 'error' ? 'text-red-800' : 'text-blue-800';

    toast.className = `fixed bottom-4 right-4 ${bgColor} ${textColor} rounded-lg px-4 py-3 z-50 max-w-md`;
    toast.innerHTML = message;
    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 4000);
}
