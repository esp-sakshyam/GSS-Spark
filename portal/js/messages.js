/* ===== LifeLine Portal - Messages JavaScript ===== */
console.log('[Messages] messages.js loading...');
console.log('[Messages] window.LifeLine =', window.LifeLine);

// Wait for LifeLine to be available
if (!window.LifeLine) {
    console.error('[Messages] LifeLine not loaded! Make sure shared.js is included before this file.');
    throw new Error('LifeLine not loaded');
}

const LL = window.LifeLine;
const apiGet = LL.apiGet;
const apiDelete = LL.apiDelete;
const formatTime = LL.formatTime;
const formatDateReadable = LL.formatDateReadable;
const truncate = LL.truncate;
const showToast = LL.showToast;
const setTableLoading = LL.setTableLoading;
const setTableEmpty = LL.setTableEmpty;
const openModal = LL.openModal;
const closeModal = LL.closeModal;
const initModalClose = LL.initModalClose;
const getIcon = LL.getIcon;
const debounce = LL.debounce;

console.log('[Messages] Functions loaded - apiGet:', typeof apiGet);

// ===== State =====
let allMessages = [];
let filteredMessages = [];
let devices = [];
let indexes = [];
let currentPage = 1;
const pageSize = 15;

// ===== DOM Elements =====
let messagesTableBody, pagination;
let filterDevice, filterCode, filterTime, searchInput;
let refreshBtn;

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    initElements();
    initEventListeners();
    loadData();

    // Check for highlight param
    checkUrlParams();
});

function initElements() {
    messagesTableBody = document.getElementById('messagesTableBody');
    pagination = document.getElementById('pagination');
    filterDevice = document.getElementById('filterDevice');
    filterCode = document.getElementById('filterCode');
    filterTime = document.getElementById('filterTime');
    searchInput = document.getElementById('searchInput');
    refreshBtn = document.getElementById('refreshBtn');
}

function initEventListeners() {
    refreshBtn?.addEventListener('click', () => {
        refreshBtn.classList.add('spin');
        loadData().finally(() => {
            setTimeout(() => refreshBtn.classList.remove('spin'), 500);
        });
    });

    filterDevice?.addEventListener('change', applyFilters);
    filterCode?.addEventListener('change', applyFilters);
    filterTime?.addEventListener('change', applyFilters);
    searchInput?.addEventListener('input', debounce(applyFilters, 300));

    initModalClose('viewMessageModal');
}

function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const highlight = urlParams.get('highlight');
    if (highlight) {
        // Will be handled after data loads
        window.highlightMID = parseInt(highlight);
    }
}

// ===== Load Data =====
async function loadData() {
    try {
        const [messagesRes, devicesRes, indexesRes] = await Promise.all([
            apiGet('Read/message.php'),
            apiGet('Read/device.php'),
            apiGet('Read/index.php')
        ]);

        allMessages = messagesRes.data?.messages || [];
        devices = devicesRes.data?.devices || [];
        indexes = indexesRes.data?.indexes || [];

        populateFilters();
        applyFilters();

        // Handle highlight after load
        if (window.highlightMID) {
            highlightMessage(window.highlightMID);
            window.highlightMID = null;
        }

    } catch (error) {
        console.error('Load error:', error);
        showToast('Failed to load messages', 'error');
        setTableEmpty(messagesTableBody, 7, 'Failed to load messages');
    }
}

// ===== Populate Filters =====
function populateFilters() {
    // Devices filter
    if (filterDevice) {
        const deviceOptions = devices.map(d =>
            `<option value="${d.DID}">${d.device_name || `Device ${d.DID}`}</option>`
        ).join('');
        filterDevice.innerHTML = `<option value="">All Devices</option>${deviceOptions}`;
    }

    // Message codes filter
    if (filterCode) {
        const codes = [...new Set(allMessages.map(m => m.message_code).filter(Boolean))];
        const codeOptions = codes.map(c =>
            `<option value="${c}">${c}</option>`
        ).join('');
        filterCode.innerHTML = `<option value="">All Message Codes</option>${codeOptions}`;
    }
}

// ===== Apply Filters =====
function applyFilters() {
    currentPage = 1;

    const deviceFilter = filterDevice?.value || '';
    const codeFilter = filterCode?.value || '';
    const timeFilter = filterTime?.value || '';
    const searchTerm = searchInput?.value?.toLowerCase() || '';

    filteredMessages = allMessages.filter(msg => {
        // Device filter
        if (deviceFilter && msg.DID != deviceFilter) return false;

        // Code filter
        if (codeFilter && msg.message_code !== codeFilter) return false;

        // Time filter
        if (timeFilter) {
            const msgDate = new Date(msg.timestamp);
            const now = new Date();

            if (timeFilter === 'today') {
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                if (msgDate < today) return false;
            } else if (timeFilter === 'week') {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                if (msgDate < weekAgo) return false;
            } else if (timeFilter === 'month') {
                const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                if (msgDate < monthAgo) return false;
            }
        }

        // Search filter
        if (searchTerm) {
            const deviceName = (msg.device_name || `Device ${msg.DID}`).toLowerCase();
            const messageText = (msg.message_text || '').toLowerCase();
            const code = String(msg.message_code || '').toLowerCase();

            if (!deviceName.includes(searchTerm) &&
                !messageText.includes(searchTerm) &&
                !code.includes(searchTerm)) {
                return false;
            }
        }

        return true;
    });

    // Sort by timestamp descending
    filteredMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    renderMessages();
    renderPagination();
}

// ===== Render Messages =====
function renderMessages() {
    if (!messagesTableBody) return;

    if (filteredMessages.length === 0) {
        setTableEmpty(messagesTableBody, 7, 'No messages found');
        return;
    }

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageMessages = filteredMessages.slice(start, end);

    messagesTableBody.innerHTML = pageMessages.map(msg => `
        <tr data-mid="${msg.MID}">
            <td><span class="message-id">#${msg.MID}</span></td>
            <td>${msg.device_name || `Device ${msg.DID}`}</td>
            <td><span class="message-code">${msg.message_code || 'N/A'}</span></td>
            <td><span class="decoded-message" title="${msg.message_text || 'Unknown'}">${truncate(msg.message_text || `Code: ${msg.message_code}`, 30)}</span></td>
            <td>
                <div class="rssi-indicator">
                    <div class="rssi-bar ${getRssiClass(msg.RSSI)}">
                        <span></span><span></span><span></span><span></span>
                    </div>
                    <span class="rssi-value">${msg.RSSI || 'N/A'}</span>
                </div>
            </td>
            <td>${formatTime(msg.timestamp)}</td>
            <td>
                <div class="action-btns">
                    <button class="action-btn view" title="View Details" onclick="viewMessage(${msg.MID})">
                        ${getIcon('eye')}
                    </button>
                    <button class="action-btn delete" title="Delete" onclick="deleteMessage(${msg.MID})">
                        ${getIcon('trash')}
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ===== Render Pagination =====
function renderPagination() {
    if (!pagination) return;

    const totalPages = Math.ceil(filteredMessages.length / pageSize);

    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = `
        <button class="pagination-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
    `;

    // Page numbers
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
        html += `<button class="pagination-btn" onclick="changePage(1)">1</button>`;
        if (startPage > 2) html += `<span class="pagination-info">...</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += `<span class="pagination-info">...</span>`;
        html += `<button class="pagination-btn" onclick="changePage(${totalPages})">${totalPages}</button>`;
    }

    html += `
        <button class="pagination-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
        <span class="pagination-info">${filteredMessages.length} total</span>
    `;

    pagination.innerHTML = html;
}

function changePage(page) {
    const totalPages = Math.ceil(filteredMessages.length / pageSize);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderMessages();
    renderPagination();

    // Scroll to top of table
    document.querySelector('.card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== Helper Functions =====
function getDeviceName(did) {
    const device = devices.find(d => d.DID == did);
    return device?.device_name || `Device ${did}`;
}

function decodeMessage(code) {
    if (!code) return 'Unknown';

    // Find matching index entry
    const index = indexes.find(i => i.message === code);
    if (index) {
        return index.help_name || index.location || code;
    }

    return code;
}

function getRssiClass(rssi) {
    if (!rssi) return '';
    const value = parseInt(rssi);
    if (value >= -50) return 'excellent';
    if (value >= -60) return 'good';
    if (value >= -70) return 'fair';
    return 'poor';
}

function highlightMessage(mid) {
    // Find which page the message is on
    const index = filteredMessages.findIndex(m => m.MID == mid);
    if (index >= 0) {
        currentPage = Math.floor(index / pageSize) + 1;
        renderMessages();
        renderPagination();

        // Highlight the row
        setTimeout(() => {
            const row = document.querySelector(`tr[data-mid="${mid}"]`);
            if (row) {
                row.classList.add('highlighted');
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    }
}

// ===== Actions =====
function viewMessage(mid) {
    const msg = allMessages.find(m => m.MID == mid);
    if (!msg) return;

    const details = document.getElementById('messageDetails');
    if (!details) return;

    details.innerHTML = `
        <div class="message-detail-grid">
            <div class="detail-row">
                <span class="detail-label">Message ID</span>
                <span class="detail-value mono">#${msg.MID}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Device</span>
                <span class="detail-value">${msg.device_name || `Device ${msg.DID}`}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Location</span>
                <span class="detail-value">${msg.location_name || 'Unknown'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Message Code</span>
                <span class="detail-value mono">${msg.message_code || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Message</span>
                <span class="detail-value">${msg.message_text || `Code: ${msg.message_code}`}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">RSSI</span>
                <span class="detail-value">
                    <div class="rssi-indicator">
                        <div class="rssi-bar ${getRssiClass(msg.RSSI)}">
                            <span></span><span></span><span></span><span></span>
                        </div>
                        <span class="rssi-value">${msg.RSSI || 'N/A'} dBm</span>
                    </div>
                </span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Timestamp</span>
                <span class="detail-value">${formatDateReadable(msg.timestamp)}</span>
            </div>
        </div>
    `;

    openModal('viewMessageModal');
}

async function deleteMessage(mid) {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
        await apiDelete(`Delete/message.php?MID=${mid}`);
        showToast('Message deleted successfully', 'success');

        // Remove from local array
        allMessages = allMessages.filter(m => m.MID != mid);
        applyFilters();
    } catch (error) {
        console.error('Delete error:', error);
        showToast('Failed to delete message', 'error');
    }
}

// Add spin animation
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    .spin svg {
        animation: spin 0.5s ease-in-out;
    }
`;
document.head.appendChild(style);

// Make functions globally available
window.viewMessage = viewMessage;
window.deleteMessage = deleteMessage;
window.changePage = changePage;
window.closeModal = closeModal;
