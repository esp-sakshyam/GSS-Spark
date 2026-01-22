// Dashboard Page JavaScript
const API_BASE = '../API';
let pollTimer = null;
let lastMessageId = 0;
let currentAlert = null;
let helpResources = [];
let messageTypes = {};

// Sync theme from parent
function syncTheme() {
    if (window.parent && window.parent.lifelinePortal) {
        const theme = window.parent.lifelinePortal.getTheme();
        document.documentElement.setAttribute('data-theme', theme);
    } else {
        const theme = localStorage.getItem('lifeline-theme') || 'dark';
        document.documentElement.setAttribute('data-theme', theme);
    }
}

// Update live indicator
function updateLiveIndicator(status, text) {
    const dot = document.getElementById('live-dot');
    const label = document.getElementById('live-text');

    if (status === 'ok') {
        dot.className = 'pulse-dot';
        label.textContent = text || 'Listening...';
    } else {
        dot.className = 'pulse-dot error';
        label.textContent = text || 'Connection lost';
    }
}

// Format timestamp
function formatTime(timestamp) {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = (now - date) / 1000;

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
}

// Format full date
function formatFullDate(timestamp) {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleString();
}

// Get alert type class based on message code (for visual styling only)
function getAlertTypeClass(messageCode) {
    const emergency = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const warning = [10, 11, 12, 13, 14];

    if (emergency.includes(parseInt(messageCode))) return 'emergency';
    if (warning.includes(parseInt(messageCode))) return 'warning';
    return 'info';
}

// Get alert icon (FontAwesome)
function getAlertIcon(messageCode) {
    const icons = {
        1: '<i class="fa-solid fa-hospital"></i>',
        2: '<i class="fa-solid fa-user-injured"></i>',
        3: '<i class="fa-solid fa-thermometer-full"></i>',
        4: '<i class="fa-solid fa-binoculars"></i>',
        5: '<i class="fa-solid fa-snowflake"></i>',
        6: '<i class="fa-solid fa-mountain"></i>',
        7: '<i class="fa-solid fa-fire"></i>',
        8: '<i class="fa-solid fa-water"></i>',
        9: '<i class="fa-solid fa-person-walking"></i>',
        10: '<i class="fa-solid fa-triangle-exclamation"></i>',
        11: '<i class="fa-solid fa-tornado"></i>',
        12: '<i class="fa-solid fa-house-crack"></i>',
        13: '<i class="fa-solid fa-droplet"></i>',
        14: '<i class="fa-solid fa-satellite-dish"></i>',
        15: '<i class="fa-solid fa-circle-check"></i>'
    };
    return icons[messageCode] || '<i class="fa-solid fa-bolt"></i>';
}

// Get Google Maps embed URL for a location
function getGoogleMapsEmbedUrl(locationName) {
    const query = encodeURIComponent(locationName + ", Nepal");
    return `https://www.google.com/maps?q=${query}&output=embed`;
}

// Load help resources
async function loadHelpResources() {
    try {
        const res = await fetch(`${API_BASE}/Read/helps.php?limit=100`);
        const data = await res.json();
        if (data.success) {
            helpResources = data.data.helps || [];
        }
    } catch (error) {
        console.error('Error loading help resources:', error);
    }
}

// Load message types
async function loadMessageTypes() {
    try {
        const res = await fetch(`${API_BASE}/Read/index.php?type=message`);
        const data = await res.json();
        if (data.success && data.data.mapping) {
            messageTypes = data.data.mapping;
        }
    } catch (error) {
        console.error('Error loading message types:', error);
    }
}

// Get available responders for a message code
function getRespondersForMessage(messageCode) {
    const code = parseInt(messageCode);
    return helpResources.filter(help => {
        // Only show helpers who explicitly have this message code in their for_messages
        if (!help.for_messages || help.for_messages.length === 0) {
            return false;
        }
        return help.for_messages.includes(code);
    });
}

// Open alert detail modal
function openAlertModal(alertData) {
    currentAlert = alertData;
    const modal = document.getElementById('alert-modal');
    const body = document.getElementById('modal-alert-body');
    const title = document.getElementById('modal-alert-title');

    const typeClass = getAlertTypeClass(alertData.message_code);
    const responders = getRespondersForMessage(alertData.message_code);

    title.innerHTML = `${getAlertIcon(alertData.message_code)} ${alertData.message_text || 'Unknown Alert'}`;

    body.innerHTML = `
        <div class="alert-detail-grid">
            <!-- Alert Info Section -->
            <div class="alert-detail-info">
                <div class="alert-detail-header">
                    <div class="alert-icon ${typeClass}">${getAlertIcon(alertData.message_code)}</div>
                    <div class="alert-detail-title-wrap">
                        <h3 class="alert-detail-title">${alertData.message_text || 'Unknown Alert'}</h3>
                        <span class="status-pill unresolved">
                            <i class="fa-solid fa-circle"></i> Active
                        </span>
                    </div>
                </div>
                
                <div class="alert-detail-meta">
                    <div class="detail-item location-item">
                        <i class="fa-solid fa-location-dot"></i>
                        ${alertData.location_name || 'Unknown Location'}
                    </div>
                    <div class="detail-item">
                        <i class="fa-solid fa-microchip"></i>
                        ${alertData.device_name || 'Device ' + alertData.DID}
                    </div>
                    <div class="detail-item">
                        <i class="fa-solid fa-clock"></i>
                        ${formatFullDate(alertData.timestamp)}
                    </div>
                    ${alertData.RSSI ? `
                    <div class="detail-item">
                        <i class="fa-solid fa-signal"></i>
                        ${alertData.RSSI} dBm
                    </div>` : ''}
                    <div class="detail-item">
                        <i class="fa-solid fa-hashtag"></i>
                        ID: #${alertData.MID}
                    </div>
                </div>
            </div>
            
            <!-- Map Section -->
            <div class="alert-detail-map" id="modal-map-container">
                <div class="map-loading">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    <span>Loading map...</span>
                </div>
            </div>
        </div>
        
        <!-- Available Responders Section -->
        <div class="responders-section">
            <div class="responders-header">
                <h4><i class="fa-solid fa-user-helmet-safety"></i> Available Responders</h4>
                <span class="responders-count">${responders.length} found</span>
            </div>
            <div class="responders-list">
                ${responders.length > 0 ? responders.map(r => `
                    <div class="responder-card">
                        <div class="responder-icon">
                            <i class="fa-solid fa-user-helmet-safety"></i>
                        </div>
                        <div class="responder-info">
                            <div class="responder-name">${r.name}</div>
                            <div class="responder-phone">
                                <i class="fa-solid fa-phone"></i> ${r.contact}
                            </div>
                        </div>
                    </div>
                `).join('') : `
                    <div class="no-responders">
                        <i class="fa-solid fa-user-slash"></i>
                        <span>No responders configured for this alert type</span>
                    </div>
                `}
            </div>
        </div>
    `;

    modal.classList.add('active');

    // Load map after modal is shown
    if (alertData.location_name) {
        loadModalMap(alertData.location_name);
    }
}

// Load map in modal using Google Maps
function loadModalMap(locationName) {
    const mapContainer = document.getElementById('modal-map-container');
    if (!mapContainer) return;

    const embedUrl = getGoogleMapsEmbedUrl(locationName);
    mapContainer.innerHTML = `
        <iframe 
            src="${embedUrl}" 
            loading="lazy"
            style="width: 100%; height: 100%; border: none;"
            allowfullscreen
            referrerpolicy="no-referrer-when-downgrade"
        ></iframe>
    `;
}

// Close alert modal
function closeAlertModal() {
    document.getElementById('alert-modal').classList.remove('active');
    currentAlert = null;
}

// Open current alert in Google Maps
function openCurrentInMaps() {
    if (!currentAlert || !currentAlert.location_name) return;
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(currentAlert.location_name + ", Nepal")}`, '_blank');
}

// Resolve alert
async function resolveAlert(mid) {
    try {
        const res = await fetch(`${API_BASE}/Update/message.php`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ MID: mid, status: 'resolved' })
        });
        const data = await res.json();
        if (data.success) {
            closeAlertModal();
            fetchData(); // Refresh data
        }
    } catch (error) {
        console.error('Error resolving alert:', error);
    }
}

// Render alerts (simplified cards without embedded maps)
function renderAlerts(messages) {
    const container = document.getElementById('alerts-container');
    const badge = document.getElementById('alert-count');

    if (!messages || messages.length === 0) {
        container.innerHTML = `
            <div class="no-alerts">
                <div class="no-alerts-icon"><i class="fa-solid fa-circle-check"></i></div>
                <div class="no-alerts-text">No active alerts this week</div>
                <div class="no-alerts-sub">All emergencies have been resolved</div>
            </div>
        `;
        badge.innerHTML = '<i class="fa-solid fa-circle-check"></i> 0 Active';
        badge.className = 'badge success';
        return;
    }

    badge.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${messages.length} Active`;
    badge.className = 'badge danger';

    container.innerHTML = messages.map(msg => {
        const typeClass = getAlertTypeClass(msg.message_code);
        const respondersCount = getRespondersForMessage(msg.message_code).length;

        return `
            <div class="alert-card ${typeClass}" onclick='openAlertModal(${JSON.stringify(msg).replace(/'/g, "&#39;")})'>
                <div class="alert-card-inner">
                    <div class="alert-icon ${typeClass}">${getAlertIcon(msg.message_code)}</div>
                    <div class="alert-content">
                        <div class="alert-title">${msg.message_text || 'Unknown Alert'}</div>
                        <div class="alert-meta">
                            <span><i class="fa-solid fa-location-dot"></i> ${msg.location_name || 'Unknown'}</span>
                            <span><i class="fa-solid fa-clock"></i> ${formatTime(msg.timestamp)}</span>
                        </div>
                    </div>
                    <div class="alert-right">
                        <span class="status-pill unresolved">
                            <i class="fa-solid fa-circle"></i> Active
                        </span>
                        <span class="alert-responders">
                            <i class="fa-solid fa-user-helmet-safety"></i> ${respondersCount}
                        </span>
                    </div>
                </div>
                <div class="alert-card-footer">
                    <span><i class="fa-solid fa-microchip"></i> ${msg.device_name || 'Device ' + msg.DID}</span>
                    <span class="click-hint"><i class="fa-solid fa-arrow-up-right-from-square"></i> Click for details</span>
                </div>
            </div>
        `;
    }).join('');
}

// Render device list
function renderDevices(devices) {
    const container = document.getElementById('device-list');
    const badge = document.getElementById('device-count');

    if (!devices || devices.length === 0) {
        container.innerHTML = `
            <div class="no-alerts">
                <div class="no-alerts-icon"><i class="fa-solid fa-microchip"></i></div>
                <div class="no-alerts-text">No devices registered</div>
                <div class="no-alerts-sub">Add devices to start monitoring</div>
            </div>
        `;
        badge.innerHTML = '<i class="fa-solid fa-microchip"></i> 0 Devices';
        return;
    }

    badge.innerHTML = `<i class="fa-solid fa-microchip"></i> ${devices.length} Devices`;

    container.innerHTML = devices.slice(0, 10).map(device => `
        <div class="activity-item">
            <div class="activity-info">
                <div class="activity-dot ${device.status || 'inactive'}"></div>
                <div>
                    <div class="activity-name">${device.device_name || 'Device ' + device.DID}</div>
                    <div class="activity-location"><i class="fa-solid fa-location-dot"></i> ${device.location_name || 'Location ' + device.LID}</div>
                </div>
            </div>
            <div class="activity-right">
                <span class="status-pill ${device.status || 'inactive'}">${(device.status || 'inactive').charAt(0).toUpperCase() + (device.status || 'inactive').slice(1)}</span>
                <div class="activity-time"><i class="fa-solid fa-clock"></i> ${formatTime(device.last_ping)}</div>
            </div>
        </div>
    `).join('');
}

// Update stats
function updateStats(devices, messages) {
    const total = devices.length;
    const active = devices.filter(d => d.status === 'active').length;
    const offline = devices.filter(d => d.status === 'inactive').length;
    const alertCount = messages.length;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-total-sub').textContent = `Registered in system`;

    document.getElementById('stat-active').textContent = active;
    document.getElementById('stat-active-sub').textContent = `${Math.round((active / total) * 100) || 0}% of fleet online`;

    document.getElementById('stat-offline').textContent = offline;
    document.getElementById('stat-offline-sub').textContent = offline > 0 ? 'Needs attention' : 'All good';

    document.getElementById('stat-alerts').textContent = alertCount;
    document.getElementById('stat-alerts-sub').textContent = alertCount > 0 ? 'Pending review' : 'All clear';
}

// Fetch data
async function fetchData() {
    try {
        // Get date from 7 days ago for filtering
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const fromDate = weekAgo.toISOString().split('T')[0];

        const [messagesRes, devicesRes] = await Promise.all([
            fetch(`${API_BASE}/Read/message.php?limit=50&from=${fromDate}`),
            fetch(`${API_BASE}/Read/device.php?limit=50`)
        ]);

        const messagesData = await messagesRes.json();
        const devicesData = await devicesRes.json();

        if (messagesRes.ok && devicesRes.ok) {
            // Filter only active alerts from this week
            const messages = (messagesData.data?.messages || []).filter(m =>
                m.status === 'active' || m.status === '' || !m.status
            );
            const devices = devicesData.data?.devices || devicesData.data || [];

            renderAlerts(messages);
            renderDevices(devices);
            updateStats(devices, messages);
            updateLiveIndicator('ok', 'Listening...');

            // Check for new messages
            if (messages.length > 0 && messages[0].MID > lastMessageId) {
                if (lastMessageId > 0) {
                    console.log('New alert received!');
                }
                lastMessageId = messages[0].MID;
            }
        } else {
            throw new Error('API Error');
        }
    } catch (error) {
        console.error('Fetch error:', error);
        updateLiveIndicator('error', 'Connection lost');
    }
}

// Start polling
function startPolling() {
    fetchData();
    pollTimer = setInterval(fetchData, 5000);
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    syncTheme();

    // Load help resources and message types first (only once)
    await Promise.all([loadHelpResources(), loadMessageTypes()]);

    // Start polling for alerts/devices
    startPolling();

    // Listen for theme changes
    window.addEventListener('message', (e) => {
        if (e.data.type === 'theme-change') {
            document.documentElement.setAttribute('data-theme', e.data.theme);
        }
    });
});

// Cleanup on unload
window.addEventListener('beforeunload', () => {
    if (pollTimer) clearInterval(pollTimer);
});
