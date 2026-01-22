// LifeLine Portal - Emails Management
const API_BASE = '../API';

let emails = [];
let editingSn = null;
let deletingSn = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    syncTheme();
    loadEmails();
});

// Theme sync with parent
function syncTheme() {
    try {
        const parentTheme = window.parent.document.documentElement.getAttribute('data-theme');
        if (parentTheme) {
            document.documentElement.setAttribute('data-theme', parentTheme);
        }
    } catch (e) {
        // Cross-origin or no parent
    }
}

// Load emails from API
async function loadEmails() {
    const container = document.getElementById('table-container');
    container.innerHTML = '<div class="loading"><span class="spinner"></span>Loading emails...</div>';

    try {
        const response = await fetch(`${API_BASE}/Read/emails.php`);
        const data = await response.json();

        if (data.success) {
            emails = data.data.emails || [];
            document.getElementById('total-count').textContent = emails.length;
            renderTable();
        } else {
            container.innerHTML = `<div class="error-state"><i class="fa-solid fa-circle-exclamation"></i><p>${data.error}</p></div>`;
        }
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = '<div class="error-state"><i class="fa-solid fa-circle-exclamation"></i><p>Failed to load emails</p></div>';
    }
}

// Render table
function renderTable() {
    const container = document.getElementById('table-container');

    if (emails.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-envelope-open"></i>
                <p>No email receivers configured</p>
                <button class="btn btn-primary" onclick="openModal()"><i class="fa-solid fa-plus"></i> Add Email</button>
            </div>
        `;
        return;
    }

    let html = `
        <table class="email-table">
            <thead>
                <tr>
                    <th class="sn-col">#</th>
                    <th class="email-col">Email Address</th>
                    <th class="actions-col">Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    emails.forEach((email, index) => {
        html += `
            <tr>
                <td class="sn-col">${index + 1}</td>
                <td class="email-col"><i class="fa-solid fa-envelope"></i>${escapeHtml(email.email)}</td>
                <td class="actions-col">
                    <button class="action-btn edit" onclick="openModal(${email.sn})" title="Edit">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="action-btn delete" onclick="openDeleteModal(${email.sn})" title="Delete">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

// Open modal for create/edit
function openModal(sn = null) {
    editingSn = sn;
    const modal = document.getElementById('modal-overlay');
    const title = document.getElementById('modal-title');
    const input = document.getElementById('email-input');

    if (sn) {
        const email = emails.find(e => e.sn == sn);
        if (email) {
            title.innerHTML = '<i class="fa-solid fa-pen"></i> Edit Email';
            input.value = email.email;
        }
    } else {
        title.innerHTML = '<i class="fa-solid fa-plus-circle"></i> Add Email';
        input.value = '';
    }

    modal.classList.add('active');
    input.focus();
}

// Close modal
function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
    document.getElementById('email-input').value = '';
    editingSn = null;
}

// Save email
async function saveEmail() {
    const input = document.getElementById('email-input');
    const email = input.value.trim();

    if (!email) {
        showToast('Please enter an email address', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showToast('Please enter a valid email address', 'error');
        return;
    }

    try {
        let response;
        if (editingSn) {
            response = await fetch(`${API_BASE}/Update/emails.php`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sn: editingSn, email })
            });
        } else {
            response = await fetch(`${API_BASE}/Create/emails.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
        }

        const data = await response.json();

        if (data.success) {
            showToast(editingSn ? 'Email updated successfully' : 'Email added successfully', 'success');
            closeModal();
            loadEmails();
        } else {
            showToast(data.error || 'Failed to save email', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to save email', 'error');
    }
}

// Open delete modal
function openDeleteModal(sn) {
    deletingSn = sn;
    const email = emails.find(e => e.sn == sn);
    document.getElementById('delete-email-text').textContent = email ? email.email : '';
    document.getElementById('delete-modal').classList.add('active');
}

// Close delete modal
function closeDeleteModal() {
    document.getElementById('delete-modal').classList.remove('active');
    deletingSn = null;
}

// Confirm delete
async function confirmDelete() {
    if (!deletingSn) return;

    try {
        const response = await fetch(`${API_BASE}/Delete/emails.php`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sn: deletingSn })
        });

        const data = await response.json();

        if (data.success) {
            showToast('Email deleted successfully', 'success');
            closeDeleteModal();
            loadEmails();
        } else {
            showToast(data.error || 'Failed to delete email', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to delete email', 'error');
    }
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showToast(message, type = 'info') {
    // Remove existing toast
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fa-solid fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'circle-exclamation' : 'circle-info'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Handle Enter key in form
document.getElementById('email-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        saveEmail();
    }
});
