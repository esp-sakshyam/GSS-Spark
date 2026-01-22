// Messages Page JavaScript
const API_BASE = '../API';
let messages = [];
let devices = [];
let messageTypes = {};
let currentPage = 1;
let totalPages = 1;
let deleteId = null;

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

// Load initial data
async function loadInitialData() {
    try {
        const [devicesRes, typesRes] = await Promise.all([
            fetch(`${API_BASE}/Read/device.php?limit=100`),
            fetch(`${API_BASE}/Read/index.php?type=message`)
        ]);

        const devicesData = await devicesRes.json();
        const typesData = await typesRes.json();

        if (devicesData.success) {
            devices = devicesData.data.devices || devicesData.data || [];
            populateDeviceDropdowns();
        }

        if (typesData.success && typesData.data.mapping) {
            messageTypes = typesData.data.mapping;
            populateTypeDropdowns();
        }
    } catch (error) {
        console.error('Error loading initial data:', error);
    }
}

function populateDeviceDropdowns() {
    const filterSelect = document.getElementById('device-filter');
    const formSelect = document.getElementById('msg-device');

    filterSelect.innerHTML = '<option value="">All Devices</option>';
    formSelect.innerHTML = '<option value="">Select Device</option>';

    devices.forEach(device => {
        const name = device.device_name || `Device ${device.DID}`;
        filterSelect.innerHTML += `<option value="${device.DID}">${name}</option>`;
        formSelect.innerHTML += `<option value="${device.DID}">${name} (${device.location_name || 'Unknown'})</option>`;
    });
}

function populateTypeDropdowns() {
    const filterSelect = document.getElementById('message-type-filter');
    const formSelect = document.getElementById('msg-type');

    filterSelect.innerHTML = '<option value="">All Message Types</option>';
    formSelect.innerHTML = '<option value="">Select Message Type</option>';

    Object.entries(messageTypes).forEach(([code, text]) => {
        filterSelect.innerHTML += `<option value="${code}">${text}</option>`;
        formSelect.innerHTML += `<option value="${code}">${text}</option>`;
    });
}

// Load messages
async function loadMessages() {
    const container = document.getElementById('table-container');
    container.innerHTML = '<div class="loading"><span class="spinner"></span>Loading messages...</div>';

    try {
        const status = document.getElementById('status-filter').value;
        const did = document.getElementById('device-filter').value;
        const messageCode = document.getElementById('message-type-filter').value;
        const fromDate = document.getElementById('from-date').value;
        const toDate = document.getElementById('to-date').value;

        let url = `${API_BASE}/Read/message.php?page=${currentPage}&limit=20`;
        if (status) url += `&status=${status}`;
        if (did) url += `&did=${did}`;
        if (messageCode) url += `&message_code=${messageCode}`;
        if (fromDate) url += `&from=${fromDate}`;
        if (toDate) url += `&to=${toDate}`;

        const res = await fetch(url);
        const data = await res.json();

        if (data.success) {
            messages = data.data.messages || data.data || [];
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
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><i class="fa-solid fa-circle-xmark"></i></div><div class="empty-state-text">Error loading messages</div></div>`;
        console.error('Error:', error);
    }
}

// Get message icon based on code
function getIcon(messageCode) {
    const icons = {
        1: '<i class="fa-solid fa-hospital"></i>',
        2: '<i class="fa-solid fa-user-injured"></i>',
        3: '<i class="fa-solid fa-thermometer-full"></i>',
        4: '<i class="fa-solid fa-magnifying-glass"></i>',
        5: '<i class="fa-solid fa-snowflake"></i>',
        6: '<i class="fa-solid fa-mountain"></i>',
        7: '<i class="fa-solid fa-fire"></i>',
        8: '<i class="fa-solid fa-water"></i>',
        9: '<i class="fa-solid fa-user"></i>',
        10: '<i class="fa-solid fa-triangle-exclamation"></i>',
        11: '<i class="fa-solid fa-tornado"></i>',
        12: '<i class="fa-solid fa-house-crack"></i>',
        13: '<i class="fa-solid fa-droplet"></i>',
        14: '<i class="fa-solid fa-tower-broadcast"></i>',
        15: '<i class="fa-solid fa-circle-check"></i>'
    };
    return icons[messageCode] || '<i class="fa-solid fa-bolt"></i>';
}

// Get status from message (handles empty or null values)
function getStatus(msg) {
    return msg.status === 'resolved' ? 'resolved' : 'active';
}

function getRssiBars(rssi) {
    if (!rssi) return [false, false, false, false];
    const level = rssi > -50 ? 4 : rssi > -70 ? 3 : rssi > -85 ? 2 : 1;
    return [level >= 1, level >= 2, level >= 3, level >= 4];
}

function updateStats() {
    document.getElementById('total-count').textContent = messages.length;
    document.getElementById('active-count').textContent = messages.filter(m => getStatus(m) === 'active').length;
    document.getElementById('resolved-count').textContent = messages.filter(m => getStatus(m) === 'resolved').length;
}

function renderTable() {
    const container = document.getElementById('table-container');

    if (messages.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fa-solid fa-message"></i></div>
                <div class="empty-state-text">No messages found</div>
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
                    <th>Status</th>
                    <th>Message</th>
                    <th>Device</th>
                    <th>Location</th>
                    <th>Signal</th>
                    <th>Time</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${messages.map(msg => {
        const status = getStatus(msg);
        const bars = getRssiBars(msg.RSSI);
        return `
                    <tr>
                        <td><span style="color: var(--text-muted);">#${msg.MID}</span></td>
                        <td>
                            <span class="status-badge ${status}">
                                <i class="fa-solid fa-circle"></i>
                                ${status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                        </td>
                        <td class="message-text">
                            <div class="message-type">${getIcon(msg.message_code)} ${msg.message_text || messageTypes[msg.message_code] || 'Unknown'}</div>
                            <div class="message-meta">Code: ${msg.message_code}</div>
                        </td>
                        <td><i class="fa-solid fa-microchip" style="color: var(--text-muted); margin-right: 6px;"></i>${msg.device_name || 'Device ' + msg.DID}</td>
                        <td><i class="fa-solid fa-location-dot" style="color: var(--accent); margin-right: 6px;"></i>${msg.location_name || 'Unknown'}</td>
                        <td>
                            <div class="rssi-indicator">
                                <div class="rssi-bars">
                                    <div class="rssi-bar ${bars[0] ? 'active' : ''}"></div>
                                    <div class="rssi-bar ${bars[1] ? 'active' : ''}"></div>
                                    <div class="rssi-bar ${bars[2] ? 'active' : ''}"></div>
                                    <div class="rssi-bar ${bars[3] ? 'active' : ''}"></div>
                                </div>
                                <span style="font-size: 11px; color: var(--text-muted);">${msg.RSSI || '-'}</span>
                            </div>
                        </td>
                        <td><i class="fa-solid fa-clock" style="color: var(--text-muted); margin-right: 6px;"></i>${formatTime(msg.timestamp)}</td>
                        <td class="actions">
                            <button class="btn btn-icon view" onclick="viewMessage(${msg.MID})" title="View"><i class="fa-solid fa-eye"></i></button>
                            ${status === 'active' ? `<button class="btn btn-icon success" onclick="markResolved(${msg.MID})" title="Mark Resolved"><i class="fa-solid fa-circle-check"></i></button>` : ''}
                            <button class="btn btn-icon delete" onclick="openDeleteModal(${msg.MID})" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
                        </td>
                    </tr>
                `;
    }).join('')}
            </tbody>
        </table>
    `;

    document.getElementById('pagination').style.display = 'flex';
}

function formatTime(timestamp) {
    if (!timestamp) return 'Unknown';

    // Parse the timestamp - MySQL returns 'YYYY-MM-DD HH:MM:SS' format
    // If it doesn't have timezone info, treat it as local time
    let date;
    if (timestamp.includes('T') || timestamp.includes('Z')) {
        date = new Date(timestamp);
    } else {
        // MySQL format: 'YYYY-MM-DD HH:MM:SS' - treat as local time
        date = new Date(timestamp.replace(' ', 'T'));
    }

    const now = new Date();
    const diff = (now - date) / 1000;

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleString();
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
    loadMessages();
}

// View message
function viewMessage(id) {
    const msg = messages.find(m => m.MID == id);
    if (!msg) return;

    const status = getStatus(msg);
    const details = document.getElementById('message-details');

    details.innerHTML = `
        <div class="detail-row">
            <span class="detail-label"><i class="fa-solid fa-hashtag"></i> Message ID</span>
            <span class="detail-value">#${msg.MID}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label"><i class="fa-solid fa-circle-dot"></i> Status</span>
            <span class="detail-value">
                <span class="status-badge ${status}">
                    <i class="fa-solid fa-circle"></i> ${status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
            </span>
        </div>
        <div class="detail-row">
            <span class="detail-label"><i class="fa-solid fa-message"></i> Message</span>
            <span class="detail-value">${getIcon(msg.message_code)} ${msg.message_text || messageTypes[msg.message_code] || 'Unknown'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label"><i class="fa-solid fa-code"></i> Message Code</span>
            <span class="detail-value">${msg.message_code}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label"><i class="fa-solid fa-microchip"></i> Device</span>
            <span class="detail-value">${msg.device_name || 'Device ' + msg.DID} (ID: ${msg.DID})</span>
        </div>
        <div class="detail-row">
            <span class="detail-label"><i class="fa-solid fa-location-dot"></i> Location</span>
            <span class="detail-value">${msg.location_name || 'Unknown'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label"><i class="fa-solid fa-signal"></i> Signal (RSSI)</span>
            <span class="detail-value">${msg.RSSI ? msg.RSSI + ' dBm' : 'Not recorded'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label"><i class="fa-solid fa-clock"></i> Timestamp</span>
            <span class="detail-value">${formatDateFull(msg.timestamp)}</span>
        </div>
    `;

    document.getElementById('view-modal').classList.add('active');
}

// Format date fully for details view
function formatDateFull(timestamp) {
    if (!timestamp) return 'Unknown';
    let date;
    if (timestamp.includes('T') || timestamp.includes('Z')) {
        date = new Date(timestamp);
    } else {
        date = new Date(timestamp.replace(' ', 'T'));
    }
    return date.toLocaleString();
}

// Mark message as resolved
async function markResolved(id) {
    try {
        const res = await fetch(`${API_BASE}/Update/message.php`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ MID: id, status: 'resolved' })
        });

        const data = await res.json();

        if (data.success) {
            showToast('Message marked as resolved');
            loadMessages();
        } else {
            showToast(data.message || 'Error updating status', 'error');
        }
    } catch (error) {
        showToast('Error updating status', 'error');
        console.error('Error:', error);
    }
}

function closeViewModal() {
    document.getElementById('view-modal').classList.remove('active');
}

// Create message
function openCreateModal() {
    document.getElementById('message-form').reset();
    document.getElementById('create-modal').classList.add('active');
}

function closeCreateModal() {
    document.getElementById('create-modal').classList.remove('active');
}

async function createMessage() {
    console.log('createMessage called'); // Debug

    const did = document.getElementById('msg-device').value;
    const messageCode = document.getElementById('msg-type').value;
    const rssi = document.getElementById('msg-rssi').value;

    console.log('Values:', { did, messageCode, rssi }); // Debug

    if (!did || !messageCode) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    // Get UI elements
    const sendBtn = document.getElementById('send-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const btnText = sendBtn ? sendBtn.querySelector('.btn-text') : null;
    const btnLoading = sendBtn ? sendBtn.querySelector('.btn-loading') : null;
    const overlay = document.getElementById('sending-overlay');
    const progressFill = document.getElementById('progress-fill');
    const sendingStatus = document.getElementById('sending-status');

    console.log('Elements found:', { sendBtn: !!sendBtn, overlay: !!overlay }); // Debug

    // Show loading state
    if (sendBtn) sendBtn.disabled = true;
    if (cancelBtn) cancelBtn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnLoading) btnLoading.style.display = 'inline-flex';
    if (overlay) overlay.classList.add('active');

    // Simulate progress stages
    let progress = 0;
    const progressInterval = setInterval(() => {
        if (progress < 30) {
            progress += 2;
            if (sendingStatus) sendingStatus.textContent = 'Creating message...';
        } else if (progress < 60) {
            progress += 1;
            if (sendingStatus) sendingStatus.textContent = 'Sending push notifications...';
        } else if (progress < 85) {
            progress += 0.5;
            if (sendingStatus) sendingStatus.textContent = 'Sending emails...';
        }
        if (progressFill) progressFill.style.width = progress + '%';
    }, 100);

    try {
        console.log('Sending request...'); // Debug

        const res = await fetch(`${API_BASE}/Create/message.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                DID: parseInt(did),
                message_code: parseInt(messageCode),
                RSSI: rssi ? parseInt(rssi) : null
            })
        });

        console.log('Response received:', res.status); // Debug

        const data = await res.json();
        console.log('Data:', data); // Debug

        // Complete progress
        clearInterval(progressInterval);
        if (progressFill) progressFill.style.width = '100%';
        if (sendingStatus) sendingStatus.textContent = 'Complete!';

        await new Promise(resolve => setTimeout(resolve, 500));

        if (data.success) {
            // Build success message with notification stats
            let successMsg = 'Message created successfully';
            if (data.data) {
                const parts = [];
                if (data.data.notifications) {
                    parts.push(`${data.data.notifications.success || 0} push`);
                }
                if (data.data.emails) {
                    parts.push(`${data.data.emails.success || 0} email`);
                }
                if (parts.length > 0) {
                    successMsg += ` (${parts.join(', ')} sent)`;
                }
            }
            showToast(successMsg);
            closeCreateModal();
            loadMessages();
        } else {
            showToast(data.message || data.error || 'Error creating message', 'error');
        }
    } catch (error) {
        clearInterval(progressInterval);
        showToast('Error creating message: ' + error.message, 'error');
        console.error('Error:', error);
    } finally {
        // Reset UI
        if (sendBtn) sendBtn.disabled = false;
        if (cancelBtn) cancelBtn.disabled = false;
        if (btnText) btnText.style.display = 'inline';
        if (btnLoading) btnLoading.style.display = 'none';
        if (overlay) overlay.classList.remove('active');
        if (progressFill) progressFill.style.width = '0%';
    }
}

// Delete
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
        const res = await fetch(`${API_BASE}/Delete/message.php?id=${deleteId}`, {
            method: 'DELETE'
        });

        const data = await res.json();

        if (data.success) {
            showToast('Message deleted successfully');
            closeDeleteModal();
            loadMessages();
        } else {
            showToast(data.message || 'Error deleting message', 'error');
        }
    } catch (error) {
        showToast('Error deleting message', 'error');
        console.error('Error:', error);
    }
}

// Filters
document.getElementById('status-filter').addEventListener('change', () => { currentPage = 1; loadMessages(); });
document.getElementById('device-filter').addEventListener('change', () => { currentPage = 1; loadMessages(); });
document.getElementById('message-type-filter').addEventListener('change', () => { currentPage = 1; loadMessages(); });
document.getElementById('from-date').addEventListener('change', () => { currentPage = 1; loadMessages(); });
document.getElementById('to-date').addEventListener('change', () => { currentPage = 1; loadMessages(); });

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    syncTheme();
    loadInitialData().then(() => loadMessages());
});
