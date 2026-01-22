// Helps/Responders Page JavaScript
const API_BASE = '../API';
let helps = [];
let messageTypes = {};
let currentPage = 1;
let totalPages = 1;
let deleteId = null;
let selectedMessages = [];

// Theme sync
function syncTheme() {
    if (window.parent && window.parent.lifelinePortal) {
        const theme = window.parent.lifelinePortal.getTheme();
        document.documentElement.setAttribute('data-theme', theme);
    } else {
        const theme = localStorage.getItem('lifeline-theme') || 'dark';
        document.documentElement.setAttribute('data-theme', theme);
    }
}

// Toast
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const icon = toast.querySelector('i');

    toast.className = `toast show ${type}`;
    toastMessage.textContent = message;
    icon.className = type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation';

    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Load message types
async function loadMessageTypes() {
    try {
        const res = await fetch(`${API_BASE}/Read/index.php?type=message`);
        const data = await res.json();
        if (data.success && data.data.mapping) {
            messageTypes = data.data.mapping;
            populateMessageDropdown();
        }
    } catch (error) {
        console.error('Error loading message types:', error);
    }
}

function populateMessageDropdown() {
    const dropdown = document.getElementById('messages-dropdown');
    dropdown.innerHTML = Object.entries(messageTypes).map(([code, text]) => `
        <div class="multi-select-option" data-value="${code}" onclick="toggleOption(${code})">
            <span class="checkbox"><i class="fa-solid fa-check"></i></span>
            <span>${text}</span>
        </div>
    `).join('');
}

// Multi-select functions
function toggleDropdown() {
    const dropdown = document.getElementById('messages-dropdown');
    dropdown.classList.toggle('open');
}

function toggleOption(code) {
    const index = selectedMessages.indexOf(code);
    if (index > -1) {
        selectedMessages.splice(index, 1);
    } else {
        selectedMessages.push(code);
    }
    updateSelectedDisplay();
}

function removeTag(code, event) {
    event.stopPropagation();
    const index = selectedMessages.indexOf(code);
    if (index > -1) {
        selectedMessages.splice(index, 1);
        updateSelectedDisplay();
    }
}

function updateSelectedDisplay() {
    const trigger = document.querySelector('.multi-select-trigger');
    const placeholder = document.getElementById('select-placeholder');
    const options = document.querySelectorAll('.multi-select-option');

    // Update option styling
    options.forEach(opt => {
        const value = parseInt(opt.dataset.value);
        if (selectedMessages.includes(value)) {
            opt.classList.add('selected');
        } else {
            opt.classList.remove('selected');
        }
    });

    // Update trigger display
    if (selectedMessages.length === 0) {
        placeholder.style.display = 'inline';
        // Remove all tags
        trigger.querySelectorAll('.selected-tag').forEach(t => t.remove());
    } else {
        placeholder.style.display = 'none';
        // Clear and rebuild tags
        trigger.querySelectorAll('.selected-tag').forEach(t => t.remove());
        selectedMessages.forEach(code => {
            const tag = document.createElement('span');
            tag.className = 'selected-tag';
            tag.innerHTML = `
                ${messageTypes[code] ? messageTypes[code].substring(0, 25) + (messageTypes[code].length > 25 ? '...' : '') : 'Code ' + code}
                <span class="remove-tag" onclick="removeTag(${code}, event)"><i class="fa-solid fa-xmark"></i></span>
            `;
            trigger.insertBefore(tag, placeholder);
        });
    }
}

// Close dropdown on outside click
document.addEventListener('click', (e) => {
    const container = document.getElementById('messages-select');
    if (!container.contains(e.target)) {
        document.getElementById('messages-dropdown').classList.remove('open');
    }
});

// Load helps
async function loadHelps() {
    const container = document.getElementById('table-container');
    container.innerHTML = '<div class="loading"><span class="spinner"></span>Loading responders...</div>';

    try {
        const status = document.getElementById('status-filter').value;
        const search = document.getElementById('search-input').value;

        let url = `${API_BASE}/Read/helps.php?page=${currentPage}&limit=20`;
        if (status) url += `&status=${status}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;

        const res = await fetch(url);
        const data = await res.json();

        if (data.success) {
            helps = data.data.helps || [];
            const pagination = data.data.pagination;

            if (pagination) {
                totalPages = pagination.pages;
                updatePagination(pagination);
            }

            updateStats();
            renderTable();
        } else {
            container.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><i class="fa-solid fa-triangle-exclamation"></i></div><div class="empty-state-text">${data.message}</div></div>`;
        }
    } catch (error) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><i class="fa-solid fa-circle-xmark"></i></div><div class="empty-state-text">Error loading responders</div></div>`;
        console.error('Error:', error);
    }
}

function updateStats() {
    document.getElementById('total-count').textContent = helps.length;
    document.getElementById('available-count').textContent = helps.filter(h => h.status === 'available').length;
    document.getElementById('dispatched-count').textContent = helps.filter(h => h.status === 'dispatched').length;
    document.getElementById('busy-count').textContent = helps.filter(h => h.status === 'busy').length;
}

function renderTable() {
    const container = document.getElementById('table-container');

    if (helps.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fa-solid fa-user-helmet-safety"></i></div>
                <div class="empty-state-text">No responders found</div>
                <button class="btn btn-primary" onclick="openModal('create')"><i class="fa-solid fa-plus"></i> Add First Responder</button>
            </div>
        `;
        document.getElementById('pagination').style.display = 'none';
        return;
    }

    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>ETA</th>
                    <th>Responds To</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${helps.map(help => {
        const forMessages = help.for_messages || [];
        return `
                    <tr>
                        <td><span style="color: var(--text-muted);">#${help.HID}</span></td>
                        <td><i class="fa-solid fa-user-helmet-safety" style="color: var(--accent); margin-right: 8px;"></i><strong>${help.name}</strong></td>
                        <td><i class="fa-solid fa-phone" style="color: var(--text-muted); margin-right: 6px;"></i>${help.contact}</td>
                        <td><i class="fa-solid fa-location-dot" style="color: var(--text-muted); margin-right: 6px;"></i>${help.location || '-'}</td>
                        <td>
                            <span class="status-badge ${help.status || 'available'}">
                                <i class="fa-solid fa-circle"></i>
                                ${(help.status || 'available').charAt(0).toUpperCase() + (help.status || 'available').slice(1)}
                            </span>
                        </td>
                        <td><i class="fa-solid fa-clock" style="color: var(--text-muted); margin-right: 6px;"></i>${help.eta || '-'}</td>
                        <td>
                            <div class="for-messages-list">
                                ${forMessages.length > 0 ?
                forMessages.slice(0, 2).map(code =>
                    `<span class="message-tag" title="${messageTypes[code] || 'Code ' + code}">${getMessageShortName(code)}</span>`
                ).join('') +
                (forMessages.length > 2 ? `<span class="message-tag-more">+${forMessages.length - 2} more</span>` : '')
                : '<span style="color: var(--text-muted); font-size: 12px;">All types</span>'
            }
                            </div>
                        </td>
                        <td class="actions">
                            <button class="btn btn-icon edit" onclick="openModal('edit', ${help.HID})" title="Edit"><i class="fa-solid fa-pen"></i></button>
                            <button class="btn btn-icon delete" onclick="openDeleteModal(${help.HID})" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
                        </td>
                    </tr>
                `;
    }).join('')}
            </tbody>
        </table>
    `;

    document.getElementById('pagination').style.display = 'flex';
}

function getMessageShortName(code) {
    const fullName = messageTypes[code] || 'Unknown';
    // Get short version (first 2 words or 15 chars)
    const words = fullName.split(' ').slice(0, 2).join(' ');
    return words.length > 15 ? words.substring(0, 15) + '...' : words;
}

function updatePagination(pagination) {
    const info = document.getElementById('pagination-info');
    const controls = document.getElementById('pagination-controls');

    const start = (pagination.page - 1) * pagination.limit + 1;
    const end = Math.min(pagination.page * pagination.limit, pagination.total);
    info.textContent = `Showing ${start}-${end} of ${pagination.total}`;

    let html = '';
    html += `<button class="btn page-btn" onclick="goToPage(${pagination.page - 1})" ${pagination.page <= 1 ? 'disabled' : ''}><i class="fa-solid fa-chevron-left"></i></button>`;

    for (let i = 1; i <= Math.min(pagination.pages, 5); i++) {
        html += `<button class="btn page-btn ${i === pagination.page ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }

    html += `<button class="btn page-btn" onclick="goToPage(${pagination.page + 1})" ${pagination.page >= pagination.pages ? 'disabled' : ''}><i class="fa-solid fa-chevron-right"></i></button>`;
    controls.innerHTML = html;
}

function goToPage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    loadHelps();
}

// Modal functions
function openModal(mode, id = null) {
    const overlay = document.getElementById('modal-overlay');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('help-form');

    form.reset();
    document.getElementById('help-id').value = '';
    selectedMessages = [];
    updateSelectedDisplay();

    if (mode === 'edit' && id) {
        title.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit Responder';
        const help = helps.find(h => h.HID == id);
        if (help) {
            document.getElementById('help-id').value = help.HID;
            document.getElementById('help-name').value = help.name || '';
            document.getElementById('help-contact').value = help.contact || '';
            document.getElementById('help-location').value = help.location || '';
            document.getElementById('help-eta').value = help.eta || '';
            document.getElementById('help-status').value = help.status || 'available';

            // Set for_messages
            if (help.for_messages && Array.isArray(help.for_messages)) {
                selectedMessages = help.for_messages.map(Number);
                updateSelectedDisplay();
            }
        }
    } else {
        title.innerHTML = '<i class="fa-solid fa-plus-circle"></i> Add Responder';
    }

    overlay.classList.add('active');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
    document.getElementById('messages-dropdown').classList.remove('open');
}

async function saveHelp() {
    const id = document.getElementById('help-id').value;
    const name = document.getElementById('help-name').value.trim();
    const contact = document.getElementById('help-contact').value.trim();
    const location = document.getElementById('help-location').value.trim();
    const eta = document.getElementById('help-eta').value.trim();
    const status = document.getElementById('help-status').value;

    if (!name || !contact) {
        showToast('Please fill in name and contact', 'error');
        return;
    }

    try {
        let url, method, body;

        const payload = {
            name: name,
            contact: contact,
            location: location || null,
            eta: eta || null,
            status: status,
            for_messages: selectedMessages
        };

        if (id) {
            // Update
            url = `${API_BASE}/Update/helps.php`;
            method = 'PUT';
            payload.HID = parseInt(id);
        } else {
            // Create
            url = `${API_BASE}/Create/helps.php`;
            method = 'POST';
        }

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (data.success) {
            showToast(id ? 'Responder updated successfully' : 'Responder created successfully');
            closeModal();
            loadHelps();
        } else {
            showToast(data.message || 'Error saving responder', 'error');
        }
    } catch (error) {
        showToast('Error saving responder', 'error');
        console.error('Error:', error);
    }
}

// Delete functions
function openDeleteModal(id) {
    deleteId = id;
    document.getElementById('delete-modal').classList.add('active');
}

function closeDeleteModal() {
    deleteId = null;
    document.getElementById('delete-modal').classList.remove('active');
}

async function confirmDelete() {
    if (!deleteId) return;

    try {
        const res = await fetch(`${API_BASE}/Delete/helps.php?id=${deleteId}`, {
            method: 'DELETE'
        });

        const data = await res.json();

        if (data.success) {
            showToast('Responder deleted successfully');
            closeDeleteModal();
            loadHelps();
        } else {
            showToast(data.message || 'Error deleting responder', 'error');
        }
    } catch (error) {
        showToast('Error deleting responder', 'error');
        console.error('Error:', error);
    }
}

// Debounce utility
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Event listeners
document.getElementById('search-input').addEventListener('input', debounce(loadHelps, 300));
document.getElementById('status-filter').addEventListener('change', () => { currentPage = 1; loadHelps(); });

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    syncTheme();
    loadMessageTypes().then(() => loadHelps());
});
