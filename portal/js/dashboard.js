/* ===== LifeLine Portal - Dashboard JavaScript ===== */

// Destructure utilities from shared
const {
    apiGet,
    formatTime,
    truncate,
    showToast,
    setTableLoading,
    setTableEmpty,
    getIcon
} = window.LifeLine;

// ===== DOM Elements =====
let statMessages, statDevices, statHelps, statLocations;
let messagesTableBody, deviceListContainer;
let refreshBtn;

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    initElements();
    initEventListeners();
    loadDashboard();
});

function initElements() {
    statMessages = document.getElementById('statMessages');
    statDevices = document.getElementById('statDevices');
    statHelps = document.getElementById('statHelps');
    statLocations = document.getElementById('statLocations');
    messagesTableBody = document.getElementById('messagesTableBody');
    deviceListContainer = document.getElementById('deviceList');
    refreshBtn = document.getElementById('refreshBtn');
}

function initEventListeners() {
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            refreshBtn.classList.add('spin');
            loadDashboard().finally(() => {
                setTimeout(() => refreshBtn.classList.remove('spin'), 500);
            });
        });
    }
}

// ===== Load Dashboard Data =====
async function loadDashboard() {
    try {
        // Load all data in parallel
        const [messages, devices, helps, indexes] = await Promise.all([
            apiGet('messages/read.php'),
            apiGet('devices/read.php'),
            apiGet('helps/read.php'),
            apiGet('indexes/read.php')
        ]);

        // Update stats
        updateStats(messages, devices, helps, indexes);

        // Update tables
        updateRecentMessages(messages.data || []);
        updateDeviceList(devices.data || []);

    } catch (error) {
        console.error('Dashboard load error:', error);
        showToast('Failed to load dashboard data', 'error');
    }
}

// ===== Update Stats =====
function updateStats(messages, devices, helps, indexes) {
    // Messages count
    const messageCount = messages.data?.length || 0;
    animateValue(statMessages, messageCount);

    // Devices count (active)
    const deviceData = devices.data || [];
    const activeDevices = deviceData.filter(d => d.status === 'active').length;
    animateValue(statDevices, `${activeDevices}/${deviceData.length}`);

    // Helps count (available)
    const helpData = helps.data || [];
    const availableHelps = helpData.filter(h => h.status === 'available').length;
    animateValue(statHelps, `${availableHelps}/${helpData.length}`);

    // Locations count
    const indexData = indexes.data || [];
    const locations = new Set(indexData.map(i => i.location)).size;
    animateValue(statLocations, locations);
}

function animateValue(element, value) {
    if (!element) return;
    element.classList.remove('loading');
    element.textContent = value;
}

// ===== Update Recent Messages =====
function updateRecentMessages(messages) {
    if (!messagesTableBody) return;

    if (!messages || messages.length === 0) {
        setTableEmpty(messagesTableBody, 5, 'No messages recorded yet');
        return;
    }

    // Sort by timestamp descending and take top 10
    const recent = messages
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);

    messagesTableBody.innerHTML = recent.map(msg => `
        <tr>
            <td><span class="message-code">${msg.message_code || 'N/A'}</span></td>
            <td>${truncate(msg.device_name || `Device ${msg.DID}`, 20)}</td>
            <td>
                <div class="rssi-indicator">
                    <div class="rssi-bar ${getRssiClass(msg.RSSI)}">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <span>${msg.RSSI || 'N/A'}</span>
                </div>
            </td>
            <td>${formatTime(msg.timestamp)}</td>
            <td>
                <div class="action-btns">
                    <button class="action-btn view" title="View Details" onclick="viewMessage(${msg.MID})">
                        ${getIcon('eye')}
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getRssiClass(rssi) {
    if (!rssi) return '';
    const value = parseInt(rssi);
    if (value >= -50) return 'excellent';
    if (value >= -60) return 'good';
    if (value >= -70) return 'fair';
    return 'poor';
}

// ===== Update Device List =====
function updateDeviceList(devices) {
    if (!deviceListContainer) return;

    if (!devices || devices.length === 0) {
        deviceListContainer.innerHTML = '<div class="empty-state"><p>No devices registered</p></div>';
        return;
    }

    // Sort: active first, then by last_ping
    const sorted = [...devices].sort((a, b) => {
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;
        return new Date(b.last_ping || 0) - new Date(a.last_ping || 0);
    });

    deviceListContainer.innerHTML = sorted.map(device => `
        <div class="device-item">
            <div class="device-info">
                <span class="device-name">${device.device_name || `Device ${device.DID}`}</span>
                <span class="device-meta">
                    ${device.location_name || 'No location'} • 
                    ${device.last_ping ? formatTime(device.last_ping) : 'Never pinged'}
                </span>
            </div>
            <div class="device-status">
                <span class="status-dot ${device.status || 'inactive'}"></span>
            </div>
        </div>
    `).join('');
}

// ===== Actions =====
function viewMessage(mid) {
    // Navigate to messages page with filter
    if (window.parent && window.parent.portalNav) {
        window.parent.portalNav.navigateTo('messages', { highlight: mid });
    }
}

// Add spin animation for refresh button
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
