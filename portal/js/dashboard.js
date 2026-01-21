/* ===== LifeLine Portal - Dashboard JavaScript ===== */
console.log('[Dashboard] dashboard.js loading...');
console.log('[Dashboard] window.LifeLine =', window.LifeLine);

// Wait for LifeLine to be available
if (!window.LifeLine) {
    console.error('[Dashboard] LifeLine not loaded! Make sure shared.js is included before this file.');
    throw new Error('LifeLine not loaded');
}

const LL = window.LifeLine;
const apiGet = LL.apiGet;
const formatTime = LL.formatTime;
const truncate = LL.truncate;
const showToast = LL.showToast;
const setTableLoading = LL.setTableLoading;
const setTableEmpty = LL.setTableEmpty;
const getIcon = LL.getIcon;

console.log('[Dashboard] Functions loaded - apiGet:', typeof apiGet);

// ===== DOM Elements =====
let statMessages, statDevices, statHelps, statLocations;
let recentMessagesTable, deviceStatusList;
let latestAlertContainer;
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
    recentMessagesTable = document.getElementById('recentMessagesTable');
    deviceStatusList = document.getElementById('deviceStatusList');
    latestAlertContainer = document.getElementById('latestAlert');
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
    console.log('[Dashboard] loadDashboard() called');
    console.log('[Dashboard] apiGet function:', apiGet);

    try {
        console.log('[Dashboard] Making API requests...');
        // Load all data in parallel
        const [messagesRes, devicesRes, helpsRes, indexesRes] = await Promise.all([
            apiGet('Read/message.php'),
            apiGet('Read/device.php'),
            apiGet('Read/helps.php'),
            apiGet('Read/index.php')
        ]);

        console.log('[Dashboard] API responses received:', { messagesRes, devicesRes, helpsRes, indexesRes });

        // Extract data from nested response
        const messages = messagesRes.data?.messages || [];
        const devices = devicesRes.data?.devices || [];
        const helps = helpsRes.data?.helps || [];
        const indexes = indexesRes.data?.indexes || [];

        console.log('[Dashboard] Data extracted:', { messages: messages.length, devices: devices.length, helps: helps.length, indexes: indexes.length });

        // Update stats
        updateStats(messages, devices, helps, indexes);

        // Update latest alert (most prominent)
        updateLatestAlert(messages);

        // Update tables
        updateRecentMessages(messages);
        updateDeviceList(devices);

    } catch (error) {
        console.error('[Dashboard] Load error:', error);
        showToast('Failed to load dashboard data', 'error');
    }
}

// ===== Update Stats =====
function updateStats(messages, devices, helps, indexes) {
    // Messages count
    const messageCount = messages.length || 0;
    animateValue(statMessages, messageCount);

    // Devices count (active)
    const activeDevices = devices.filter(d => d.status === 'active').length;
    animateValue(statDevices, `${activeDevices}/${devices.length}`);

    // Helps count (available)
    const availableHelps = helps.filter(h => h.status === 'available').length;
    animateValue(statHelps, `${availableHelps}/${helps.length}`);

    // Locations count - find location index and count its mapping entries
    const locationIndex = indexes.find(i => i.type === 'location');
    const locationCount = locationIndex && locationIndex.mapping ? Object.keys(locationIndex.mapping).length : 0;
    animateValue(statLocations, locationCount);
}

function animateValue(element, value) {
    if (!element) return;
    element.classList.remove('loading');
    element.textContent = value;
}

// ===== Update Latest Alert =====
function updateLatestAlert(messages) {
    if (!latestAlertContainer) return;

    if (!messages || messages.length === 0) {
        latestAlertContainer.innerHTML = `
            <div class="no-alert">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
                <p>No emergency alerts recorded</p>
            </div>
        `;
        return;
    }

    // Get the most recent message
    const latest = [...messages].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
    const alertAge = getAlertAge(latest.timestamp);
    const isRecent = alertAge.isRecent;

    latestAlertContainer.innerHTML = `
        <div class="alert-box ${isRecent ? 'alert-urgent' : 'alert-normal'}">
            <div class="alert-header">
                <div class="alert-badge ${isRecent ? 'pulse' : ''}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                </div>
                <div class="alert-title-group">
                    <span class="alert-label">${isRecent ? 'URGENT ALERT' : 'LATEST ALERT'}</span>
                    <h2 class="alert-title">${latest.message_text || 'Emergency Signal Received'}</h2>
                </div>
                <div class="alert-time">
                    <span class="time-ago">${alertAge.text}</span>
                    <span class="time-exact">${formatTime(latest.timestamp)}</span>
                </div>
            </div>
            <div class="alert-details">
                <div class="alert-detail-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <div>
                        <span class="detail-label">Location</span>
                        <span class="detail-value">${latest.location_name || 'Unknown Location'}</span>
                    </div>
                </div>
                <div class="alert-detail-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="4" y="4" width="16" height="16" rx="2"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                    <div>
                        <span class="detail-label">Device</span>
                        <span class="detail-value">${latest.device_name || 'Device ' + latest.DID}</span>
                    </div>
                </div>
                <div class="alert-detail-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                    <div>
                        <span class="detail-label">Signal Strength</span>
                        <span class="detail-value">${latest.RSSI || 'N/A'} dBm</span>
                    </div>
                </div>
            </div>
            <div class="alert-actions">
                <button class="btn btn-alert" onclick="viewMessage(${latest.MID})">
                    View Full Details
                </button>
            </div>
        </div>
    `;
}

function getAlertAge(timestamp) {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMs = now - alertTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
        return { text: `${diffMins} min ago`, isRecent: diffMins < 30 };
    } else if (diffHours < 24) {
        return { text: `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`, isRecent: false };
    } else {
        return { text: `${diffDays} day${diffDays > 1 ? 's' : ''} ago`, isRecent: false };
    }
}

// ===== Update Recent Messages =====
function updateRecentMessages(messages) {
    if (!recentMessagesTable) return;

    if (!messages || messages.length === 0) {
        setTableEmpty(recentMessagesTable, 4, 'No messages recorded yet');
        return;
    }

    // Sort by timestamp descending and take top 5 (skip first one shown in alert)
    const recent = [...messages]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(1, 6);

    if (recent.length === 0) {
        setTableEmpty(recentMessagesTable, 4, 'No additional messages');
        return;
    }

    recentMessagesTable.innerHTML = recent.map(msg => `
        <tr>
            <td>${truncate(msg.location_name || 'Unknown', 20)}</td>
            <td>${truncate(msg.message_text || 'Emergency', 25)}</td>
            <td>${truncate(msg.device_name || 'Device ' + msg.DID, 15)}</td>
            <td>${formatTime(msg.timestamp)}</td>
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
    if (!deviceStatusList) return;

    if (!devices || devices.length === 0) {
        deviceStatusList.innerHTML = '<div class="empty-state"><p>No devices registered</p></div>';
        return;
    }

    // Sort: active first, then by last_ping
    const sorted = [...devices].sort((a, b) => {
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;
        return new Date(b.last_ping || 0) - new Date(a.last_ping || 0);
    });

    deviceStatusList.innerHTML = sorted.map(device => `
        <div class="device-item">
            <div class="device-info">
                <span class="device-name">${device.device_name || 'Device ' + device.DID}</span>
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
