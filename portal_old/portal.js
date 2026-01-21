/**
 * LifeLine Control Portal JavaScript
 * Handles all CRUD operations and UI interactions
 */

// API Base URL
const API_BASE = '../API';

// Global state
let currentSection = 'dashboard';
let indexMappings = {};
let helpsData = {}; // Maps HID to help name

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function () {
    initNavigation();
    initModals();
    initLogout();
    initFilters();
    loadDashboard();
    loadIndexMappings();
});

/* ===== Navigation ===== */
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item, .view-all');
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const refreshBtn = document.getElementById('refreshBtn');

    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            const section = this.dataset.section;
            if (section) {
                switchSection(section);
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('open');
                }
            }
        });
    });

    menuToggle?.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    refreshBtn?.addEventListener('click', () => {
        refreshBtn.classList.add('loading');
        refreshCurrentSection().finally(() => {
            setTimeout(() => refreshBtn.classList.remove('loading'), 500);
        });
    });
}

function switchSection(section) {
    currentSection = section;

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.section === section);
    });

    // Update page title
    const titles = {
        dashboard: 'Dashboard',
        messages: 'Emergency Messages',
        devices: 'Devices',
        helps: 'Help Resources',
        indexes: 'Index Mappings'
    };
    document.getElementById('pageTitle').textContent = titles[section] || 'Dashboard';

    // Show corresponding section
    document.querySelectorAll('.content-section').forEach(s => {
        s.classList.remove('active');
    });
    document.getElementById(section + 'Section')?.classList.add('active');

    // Load section data
    refreshCurrentSection();
}

async function refreshCurrentSection() {
    switch (currentSection) {
        case 'dashboard':
            await loadDashboard();
            break;
        case 'messages':
            await loadMessages();
            break;
        case 'devices':
            await loadDevices();
            break;
        case 'helps':
            await loadHelps();
            break;
        case 'indexes':
            await loadIndexes();
            break;
    }
}

/* ===== Dashboard ===== */
async function loadDashboard() {
    try {
        const [messagesRes, devicesRes, helpsRes, indexesRes] = await Promise.all([
            fetch(`${API_BASE}/Read/message.php`),
            fetch(`${API_BASE}/Read/device.php`),
            fetch(`${API_BASE}/Read/helps.php?status=available`),
            fetch(`${API_BASE}/Read/index.php?type=location`)
        ]);

        const messages = await messagesRes.json();
        const devices = await devicesRes.json();
        const helps = await helpsRes.json();
        const indexes = await indexesRes.json();

        // Update stats
        if (messages.success) {
            document.getElementById('statMessages').textContent = messages.data.total || 0;
        }

        if (devices.success && devices.data.devices) {
            const activeDevices = devices.data.devices.filter(d => d.status === 'active').length;
            document.getElementById('statDevices').textContent = activeDevices;
        }

        if (helps.success && helps.data.helps) {
            document.getElementById('statHelps').textContent = helps.data.helps.length;
        }

        if (indexes.success && indexes.data.mapping) {
            document.getElementById('statLocations').textContent = Object.keys(indexes.data.mapping).length;
        }

        // Populate recent messages table
        if (messages.success && messages.data.messages) {
            const tbody = document.getElementById('recentMessagesTable');
            const recentMessages = messages.data.messages.slice(0, 5);

            if (recentMessages.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="empty-state">No messages yet</td></tr>';
            } else {
                tbody.innerHTML = recentMessages.map(msg => `
                    <tr>
                        <td>${msg.location_name || 'Unknown'}</td>
                        <td>${truncate(msg.message_text || 'Code: ' + msg.message_code, 30)}</td>
                        <td>${msg.device_name || 'Device ' + msg.DID}</td>
                        <td>${formatTime(msg.timestamp)}</td>
                    </tr>
                `).join('');
            }
        }

        // Populate device status list
        if (devices.success && devices.data.devices) {
            const list = document.getElementById('deviceStatusList');
            list.innerHTML = devices.data.devices.map(device => `
                <div class="device-status-item">
                    <div class="device-indicator ${device.status}"></div>
                    <div class="device-info">
                        <div class="device-name">${device.device_name || 'Device ' + device.DID}</div>
                        <div class="device-location">${device.location_name || 'Location ' + device.LID}</div>
                    </div>
                    <div class="device-status-text">${device.status}</div>
                </div>
            `).join('');
        }

    } catch (error) {
        console.error('Dashboard load error:', error);
        showToast('Failed to load dashboard data', 'error');
    }
}

/* ===== Messages CRUD ===== */
async function loadMessages() {
    const messageCode = document.getElementById('messageCodeFilter')?.value || '';

    let url = `${API_BASE}/Read/message.php?`;
    if (messageCode) url += `message_code=${messageCode}&`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        const tbody = document.getElementById('messagesTable');

        if (!data.success || !data.data.messages || data.data.messages.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No messages found</td></tr>';
            return;
        }

        tbody.innerHTML = data.data.messages.map(msg => `
            <tr data-id="${msg.MID}">
                <td>${msg.MID}</td>
                <td>${msg.device_name || 'Device ' + msg.DID}</td>
                <td>${msg.location_name || 'Unknown'}</td>
                <td title="${msg.message_text}">${truncate(msg.message_text || 'Code: ' + msg.message_code, 25)}</td>
                <td>${msg.RSSI || 'N/A'} dBm</td>
                <td>${formatTime(msg.timestamp)}</td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn view" onclick="viewMessage(${msg.MID})" title="View">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                        </button>
                        <button class="action-btn delete" onclick="deleteMessage(${msg.MID})" title="Delete">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Messages load error:', error);
        showToast('Failed to load messages', 'error');
    }
}

function viewMessage(id) {
    fetch(`${API_BASE}/Read/message.php?id=${id}`)
        .then(res => res.json())
        .then(data => {
            if (data.success && data.data) {
                const msg = data.data;
                showModal('Message Details', `
                    <div class="form-group">
                        <label class="form-label">Message ID</label>
                        <p>${msg.MID}</p>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Device</label>
                        <p>${msg.device_name || 'Device ' + msg.DID} (${msg.location_name || 'Unknown Location'})</p>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Message</label>
                        <p>${msg.message_text || 'Code: ' + msg.message_code}</p>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Signal Strength (RSSI)</label>
                        <p>${msg.RSSI || 'N/A'} dBm</p>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Timestamp</label>
                        <p>${msg.timestamp}</p>
                    </div>
                `, null, true);
            }
        });
}

// Messages are now read-only (no priority/status/notes to edit)

async function deleteMessage(id) {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
        const res = await fetch(`${API_BASE}/Delete/message.php?id=${id}`, { method: 'DELETE' });
        const data = await res.json();

        if (data.success) {
            showToast('Message deleted successfully', 'success');
            loadMessages();
        } else {
            showToast(data.message || 'Delete failed', 'error');
        }
    } catch (error) {
        showToast('Failed to delete message', 'error');
    }
}

// Create Message Button Handler
document.getElementById('createMessageBtn')?.addEventListener('click', () => {
    loadDevicesForSelect().then(deviceOptions => {
        const messageOptions = indexMappings.message ?
            Object.entries(indexMappings.message).map(([code, text]) =>
                `<option value="${code}">${code}: ${text}</option>`
            ).join('') : '';

        showModal('Create New Message', `
            <div class="form-group">
                <label class="form-label">Device *</label>
                <select id="newMsgDevice" class="form-select" required>
                    <option value="">Select Device</option>
                    ${deviceOptions}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Message Type *</label>
                <select id="newMsgCode" class="form-select" required>
                    <option value="">Select Message Type</option>
                    ${messageOptions}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">RSSI (dBm)</label>
                <input type="number" id="newMsgRSSI" class="form-input" placeholder="-70">
            </div>
        `, async () => {
            const newMessage = {
                DID: parseInt(document.getElementById('newMsgDevice').value),
                message_code: parseInt(document.getElementById('newMsgCode').value),
                RSSI: document.getElementById('newMsgRSSI').value ? parseInt(document.getElementById('newMsgRSSI').value) : null
            };

            if (!newMessage.DID || !newMessage.message_code) {
                showToast('Please select device and message type', 'error');
                return;
            }

            const res = await fetch(`${API_BASE}/Create/message.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newMessage)
            });
            const result = await res.json();

            if (result.success) {
                showToast('Message created successfully', 'success');
                loadMessages();
                loadDashboard();
            } else {
                showToast(result.message || 'Create failed', 'error');
            }
        });
    });
});

/* ===== Devices CRUD ===== */
async function loadDevices() {
    const status = document.getElementById('deviceStatusFilter')?.value || '';

    let url = `${API_BASE}/Read/device.php?`;
    if (status) url += `status=${status}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        const tbody = document.getElementById('devicesTable');

        if (!data.success || !data.data.devices || data.data.devices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No devices found</td></tr>';
            return;
        }

        tbody.innerHTML = data.data.devices.map(device => `
            <tr data-id="${device.DID}">
                <td>${device.DID}</td>
                <td>${device.device_name || 'Device ' + device.DID}</td>
                <td>${device.location_name || 'Location ' + device.LID}</td>
                <td><span class="status-badge ${device.status}">${device.status}</span></td>
                <td>${formatTime(device.last_ping)}</td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn edit" onclick="editDevice(${device.DID})" title="Edit">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button class="action-btn delete" onclick="deleteDevice(${device.DID})" title="Delete">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Devices load error:', error);
        showToast('Failed to load devices', 'error');
    }
}

function editDevice(id) {
    fetch(`${API_BASE}/Read/device.php?id=${id}`)
        .then(res => res.json())
        .then(data => {
            if (data.success && data.data) {
                const device = data.data;
                const locationOptions = indexMappings.location ?
                    Object.entries(indexMappings.location).map(([code, name]) =>
                        `<option value="${code}" ${device.LID == code ? 'selected' : ''}>${name}</option>`
                    ).join('') : '';

                showModal('Edit Device', `
                    <input type="hidden" id="editDID" value="${device.DID}">
                    <div class="form-group">
                        <label class="form-label">Device Name</label>
                        <input type="text" id="editDeviceName" class="form-input" value="${device.device_name || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Location</label>
                        <select id="editDeviceLocation" class="form-select">
                            ${locationOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Status</label>
                        <select id="editDeviceStatus" class="form-select">
                            <option value="active" ${device.status === 'active' ? 'selected' : ''}>Active</option>
                            <option value="inactive" ${device.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                            <option value="maintenance" ${device.status === 'maintenance' ? 'selected' : ''}>Maintenance</option>
                        </select>
                    </div>
                `, async () => {
                    const updateData = {
                        DID: parseInt(document.getElementById('editDID').value),
                        device_name: document.getElementById('editDeviceName').value,
                        LID: parseInt(document.getElementById('editDeviceLocation').value),
                        status: document.getElementById('editDeviceStatus').value
                    };

                    const res = await fetch(`${API_BASE}/Update/device.php`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updateData)
                    });
                    const result = await res.json();

                    if (result.success) {
                        showToast('Device updated successfully', 'success');
                        loadDevices();
                    } else {
                        showToast(result.message || 'Update failed', 'error');
                    }
                });
            }
        });
}

async function deleteDevice(id) {
    if (!confirm('Are you sure you want to delete this device? All associated messages will also be deleted.')) return;

    try {
        const res = await fetch(`${API_BASE}/Delete/device.php?id=${id}`, { method: 'DELETE' });
        const data = await res.json();

        if (data.success) {
            showToast('Device deleted successfully', 'success');
            loadDevices();
        } else {
            showToast(data.message || 'Delete failed', 'error');
        }
    } catch (error) {
        showToast('Failed to delete device', 'error');
    }
}

// Create Device Button Handler
document.getElementById('createDeviceBtn')?.addEventListener('click', () => {
    const locationOptions = indexMappings.location ?
        Object.entries(indexMappings.location).map(([code, name]) =>
            `<option value="${code}">${name}</option>`
        ).join('') : '';

    showModal('Add New Device', `
        <div class="form-group">
            <label class="form-label">Device Name</label>
            <input type="text" id="newDeviceName" class="form-input" placeholder="e.g., Node-Namche-02">
        </div>
        <div class="form-group">
            <label class="form-label">Location *</label>
            <select id="newDeviceLocation" class="form-select" required>
                <option value="">Select Location</option>
                ${locationOptions}
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">Status</label>
            <select id="newDeviceStatus" class="form-select">
                <option value="active" selected>Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
            </select>
        </div>
    `, async () => {
        const newDevice = {
            device_name: document.getElementById('newDeviceName').value,
            LID: parseInt(document.getElementById('newDeviceLocation').value),
            status: document.getElementById('newDeviceStatus').value
        };

        if (!newDevice.LID) {
            showToast('Please select a location', 'error');
            return;
        }

        const res = await fetch(`${API_BASE}/Create/device.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newDevice)
        });
        const result = await res.json();

        if (result.success) {
            showToast('Device created successfully', 'success');
            loadDevices();
        } else {
            showToast(result.message || 'Create failed', 'error');
        }
    });
});

/* ===== Helps CRUD ===== */
async function loadHelps() {
    const status = document.getElementById('helpStatusFilter')?.value || '';

    let url = `${API_BASE}/Read/helps.php?`;
    if (status) url += `status=${status}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        const tbody = document.getElementById('helpsTable');

        if (!data.success || !data.data.helps || data.data.helps.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No help resources found</td></tr>';
            return;
        }

        tbody.innerHTML = data.data.helps.map(help => `
            <tr data-id="${help.HID}">
                <td>${help.HID}</td>
                <td>${help.name}</td>
                <td>${help.contact}</td>
                <td>${help.location || 'N/A'}</td>
                <td>${help.eta || 'N/A'}</td>
                <td><span class="status-badge ${help.status}">${help.status}</span></td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn edit" onclick="editHelp(${help.HID})" title="Edit">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button class="action-btn delete" onclick="deleteHelp(${help.HID})" title="Delete">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Helps load error:', error);
        showToast('Failed to load help resources', 'error');
    }
}

function editHelp(id) {
    fetch(`${API_BASE}/Read/helps.php?id=${id}`)
        .then(res => res.json())
        .then(data => {
            if (data.success && data.data) {
                const help = data.data;
                showModal('Edit Help Resource', `
                    <input type="hidden" id="editHID" value="${help.HID}">
                    <div class="form-group">
                        <label class="form-label">Name *</label>
                        <input type="text" id="editHelpName" class="form-input" value="${help.name}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Status</label>
                        <select id="editHelpStatus" class="form-select">
                            <option value="available" ${help.status === 'available' ? 'selected' : ''}>Available</option>
                            <option value="dispatched" ${help.status === 'dispatched' ? 'selected' : ''}>Dispatched</option>
                            <option value="busy" ${help.status === 'busy' ? 'selected' : ''}>Busy</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Contact *</label>
                        <input type="text" id="editHelpContact" class="form-input" value="${help.contact}" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Location</label>
                            <input type="text" id="editHelpLocation" class="form-input" value="${help.location || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">ETA</label>
                            <input type="text" id="editHelpETA" class="form-input" value="${help.eta || ''}" placeholder="e.g., 30 mins">
                        </div>
                    </div>
                `, async () => {
                    const updateData = {
                        HID: parseInt(document.getElementById('editHID').value),
                        name: document.getElementById('editHelpName').value,
                        status: document.getElementById('editHelpStatus').value,
                        contact: document.getElementById('editHelpContact').value,
                        location: document.getElementById('editHelpLocation').value,
                        eta: document.getElementById('editHelpETA').value
                    };

                    const res = await fetch(`${API_BASE}/Update/helps.php`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updateData)
                    });
                    const result = await res.json();

                    if (result.success) {
                        showToast('Help resource updated successfully', 'success');
                        loadHelps();
                    } else {
                        showToast(result.message || 'Update failed', 'error');
                    }
                });
            }
        });
}

async function deleteHelp(id) {
    if (!confirm('Are you sure you want to delete this help resource?')) return;

    try {
        const res = await fetch(`${API_BASE}/Delete/helps.php?id=${id}`, { method: 'DELETE' });
        const data = await res.json();

        if (data.success) {
            showToast('Help resource deleted successfully', 'success');
            loadHelps();
        } else {
            showToast(data.message || 'Delete failed', 'error');
        }
    } catch (error) {
        showToast('Failed to delete help resource', 'error');
    }
}

// Create Help Button Handler
document.getElementById('createHelpBtn')?.addEventListener('click', () => {
    showModal('Add Help Resource', `
        <div class="form-group">
            <label class="form-label">Name *</label>
            <input type="text" id="newHelpName" class="form-input" placeholder="e.g., Mountain Rescue Team" required>
        </div>
        <div class="form-group">
            <label class="form-label">Status</label>
            <select id="newHelpStatus" class="form-select">
                <option value="available" selected>Available</option>
                <option value="dispatched">Dispatched</option>
                <option value="busy">Busy</option>
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">Contact *</label>
            <input type="text" id="newHelpContact" class="form-input" placeholder="Phone number" required>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Location</label>
                <input type="text" id="newHelpLocation" class="form-input" placeholder="Base location">
            </div>
            <div class="form-group">
                <label class="form-label">ETA</label>
                <input type="text" id="newHelpETA" class="form-input" placeholder="e.g., 1-2 hours">
            </div>
        </div>
    `, async () => {
        const newHelp = {
            name: document.getElementById('newHelpName').value,
            status: document.getElementById('newHelpStatus').value,
            contact: document.getElementById('newHelpContact').value,
            location: document.getElementById('newHelpLocation').value,
            eta: document.getElementById('newHelpETA').value
        };

        if (!newHelp.name || !newHelp.contact) {
            showToast('Please fill in required fields', 'error');
            return;
        }

        const res = await fetch(`${API_BASE}/Create/helps.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newHelp)
        });
        const result = await res.json();

        if (result.success) {
            showToast('Help resource created successfully', 'success');
            loadHelps();
        } else {
            showToast(result.message || 'Create failed', 'error');
        }
    });
});

/* ===== Indexes ===== */
async function loadIndexMappings() {
    try {
        // Load index mappings
        const res = await fetch(`${API_BASE}/Read/index.php`);
        const data = await res.json();

        if (data.success && data.data.indexes) {
            data.data.indexes.forEach(index => {
                indexMappings[index.type] = index.mapping;
            });
        }

        // Load helps data for name lookups
        const helpsRes = await fetch(`${API_BASE}/Read/helps.php`);
        const helpsJson = await helpsRes.json();
        if (helpsJson.success && helpsJson.data.helps) {
            helpsJson.data.helps.forEach(help => {
                helpsData[help.HID] = help.name;
            });
        }
    } catch (error) {
        console.error('Failed to load index mappings:', error);
    }
}

async function loadIndexes() {
    const type = document.getElementById('indexTypeFilter')?.value || '';

    let url = `${API_BASE}/Read/index.php`;
    if (type) url += `?type=${type}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        const grid = document.getElementById('indexesGrid');

        if (!data.success) {
            grid.innerHTML = '<div class="empty-state">Failed to load indexes</div>';
            return;
        }

        const indexes = type && data.data.mapping ? [data.data] : data.data.indexes;

        if (!indexes || indexes.length === 0) {
            grid.innerHTML = '<div class="empty-state">No index mappings found</div>';
            return;
        }

        grid.innerHTML = indexes.map(index => {
            if (index.type === 'help') {
                // Special rendering for help mapping
                return `
                    <div class="index-card help-mapping-card">
                        <div class="index-card-header">
                            <h4>Help Resource Mapping</h4>
                            <button class="action-btn" onclick="editIndex('${index.type}')" title="Add Entry" style="color: white;">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="5" x2="12" y2="19"/>
                                    <line x1="5" y1="12" x2="19" y2="12"/>
                                </svg>
                            </button>
                        </div>
                        <div class="index-card-body help-mapping-body">
                            ${Object.entries(index.mapping).map(([hid, msgCodes]) => {
                    const helpName = helpsData[hid] || `Help #${hid}`;

                    const messageList = Array.isArray(msgCodes) ? msgCodes : [];
                    return `
                                    <div class="help-mapping-item">
                                        <div class="help-mapping-header">
                                            <span class="help-name">${helpName}</span>
                                            <button class="action-btn edit" onclick="editMappingEntry('help', '${hid}', '${messageList.join(',')}')" title="Edit">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                                </svg>
                                            </button>
                                        </div>
                                        <div class="help-message-tags">
                                            ${messageList.map(msgCode => {
                        const msgName = indexMappings.message?.[msgCode] || `Code ${msgCode}`;
                        return `<span class="message-tag" title="${msgName}">${msgName}</span>`;
                    }).join('')}
                                        </div>
                                    </div>
                                `;
                }).join('')}
                        </div>
                    </div>
                `;
            } else {
                // Standard rendering for location/message mappings
                return `
                    <div class="index-card">
                        <div class="index-card-header">
                            <h4>${index.type} Mapping</h4>
                            <button class="action-btn" onclick="editIndex('${index.type}')" title="Add Entry" style="color: white;">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="5" x2="12" y2="19"/>
                                    <line x1="5" y1="12" x2="19" y2="12"/>
                                </svg>
                            </button>
                        </div>
                        <div class="index-card-body">
                            ${Object.entries(index.mapping).map(([code, value]) => {
                    const displayValue = Array.isArray(value) ? value.join(', ') : value;
                    const escapedValue = String(displayValue).replace(/'/g, "\\'");
                    return `
                                    <div class="mapping-item">
                                        <span class="mapping-code">${code}</span>
                                        <span class="mapping-value">${displayValue}</span>
                                        <div class="mapping-actions">
                                            <button class="action-btn edit" onclick="editMappingEntry('${index.type}', '${code}', '${escapedValue}')" title="Edit">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                `;
                }).join('')}
                        </div>
                    </div>
                `;
            }
        }).join('');

    } catch (error) {
        console.error('Indexes load error:', error);
        showToast('Failed to load indexes', 'error');
    }
}

function editIndex(type) {
    if (type === 'help') {
        // For help mapping, show help resource select and message code checkboxes
        const helpOptions = Object.entries(helpsData).map(([hid, name]) =>
            `<option value="${hid}">${name}</option>`
        ).join('');

        const messageCheckboxes = indexMappings.message ?
            Object.entries(indexMappings.message).map(([code, desc]) => `
                <label class="checkbox-card">
                    <input type="checkbox" name="messageCodes" value="${code}">
                    <div class="checkbox-card-content">
                        <span class="checkbox-indicator"></span>
                        <span class="checkbox-code">${code}</span>
                        <span class="checkbox-label">${desc}</span>
                    </div>
                </label>
            `).join('') : '';

        showModal(`Add Help Resource Mapping`, `
            <div class="form-group">
                <label class="form-label">Help Resource *</label>
                <select id="newHelpResource" class="form-select" required>
                    <option value="">Select Help Resource</option>
                    ${helpOptions}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Applicable Emergency Types *</label>
                <div class="checkbox-card-group">
                    ${messageCheckboxes}
                </div>
            </div>
        `, async () => {
            const hid = document.getElementById('newHelpResource').value;
            const checkedBoxes = document.querySelectorAll('input[name="messageCodes"]:checked');
            const messageCodes = Array.from(checkedBoxes).map(cb => parseInt(cb.value));

            if (!hid) {
                showToast('Please select a help resource', 'error');
                return;
            }
            if (messageCodes.length === 0) {
                showToast('Please select at least one message type', 'error');
                return;
            }

            const res = await fetch(`${API_BASE}/Update/index.php`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: type,
                    add: { [hid]: messageCodes }
                })
            });
            const result = await res.json();

            if (result.success) {
                showToast('Help mapping added successfully', 'success');
                loadIndexes();
                loadIndexMappings();
            } else {
                showToast(result.message || 'Update failed', 'error');
            }
        });
    } else {
        // For location/message mappings, use standard code/value input
        showModal(`Add Entry to ${type} Mapping`, `
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Code (Integer) *</label>
                    <input type="number" id="newMappingCode" class="form-input" min="0" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Value *</label>
                    <input type="text" id="newMappingValue" class="form-input" required>
                </div>
            </div>
        `, async () => {
            const code = document.getElementById('newMappingCode').value;
            const value = document.getElementById('newMappingValue').value;

            if (!code || !value) {
                showToast('Please fill in both fields', 'error');
                return;
            }

            const res = await fetch(`${API_BASE}/Update/index.php`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: type,
                    add: { [code]: value }
                })
            });
            const result = await res.json();

            if (result.success) {
                showToast('Mapping added successfully', 'success');
                loadIndexes();
                loadIndexMappings();
            } else {
                showToast(result.message || 'Update failed', 'error');
            }
        });
    }
}

function editMappingEntry(type, code, currentValue) {
    if (type === 'help') {
        // For help mapping, show message code checkboxes
        const currentCodes = currentValue.split(',').map(c => parseInt(c.trim()));
        const helpName = helpsData[code] || `Help #${code}`;

        const messageCheckboxes = indexMappings.message ?
            Object.entries(indexMappings.message).map(([msgCode, desc]) => {
                const isChecked = currentCodes.includes(parseInt(msgCode));
                return `
                    <label class="checkbox-card">
                        <input type="checkbox" name="messageCodes" value="${msgCode}" ${isChecked ? 'checked' : ''}>
                        <div class="checkbox-card-content">
                            <span class="checkbox-indicator"></span>
                            <span class="checkbox-code">${msgCode}</span>
                            <span class="checkbox-label">${desc}</span>
                        </div>
                    </label>
                `;
            }).join('') : '';

        showModal(`Edit Help Mapping: ${helpName}`, `
            <div class="form-group">
                <label class="form-label">Applicable Emergency Types *</label>
                <div class="checkbox-card-group">
                    ${messageCheckboxes}
                </div>
            </div>
        `, async () => {
            const checkedBoxes = document.querySelectorAll('input[name="messageCodes"]:checked');
            const messageCodes = Array.from(checkedBoxes).map(cb => parseInt(cb.value));

            if (messageCodes.length === 0) {
                showToast('Please select at least one message type', 'error');
                return;
            }

            const res = await fetch(`${API_BASE}/Update/index.php`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: type,
                    add: { [code]: messageCodes }
                })
            });
            const result = await res.json();

            if (result.success) {
                showToast('Help mapping updated successfully', 'success');
                loadIndexes();
                loadIndexMappings();
            } else {
                showToast(result.message || 'Update failed', 'error');
            }
        });
    } else {
        // For location/message mappings, use standard value input
        showModal(`Edit ${type} Mapping Entry`, `
            <div class="form-group">
                <label class="form-label">Code</label>
                <input type="text" class="form-input" value="${code}" disabled>
            </div>
            <div class="form-group">
                <label class="form-label">Value *</label>
                <input type="text" id="editMappingValue" class="form-input" value="${currentValue}" required>
            </div>
        `, async () => {
            const value = document.getElementById('editMappingValue').value;

            if (!value) {
                showToast('Please enter a value', 'error');
                return;
            }

            const res = await fetch(`${API_BASE}/Update/index.php`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: type,
                    add: { [code]: value }
                })
            });
            const result = await res.json();

            if (result.success) {
                showToast('Mapping updated successfully', 'success');
                loadIndexes();
                loadIndexMappings();
            } else {
                showToast(result.message || 'Update failed', 'error');
            }
        });
    }
}

/* ===== Modal Functions ===== */
function initModals() {
    const overlay = document.getElementById('modalOverlay');
    const closeBtn = document.getElementById('modalClose');
    const cancelBtn = document.getElementById('modalCancel');

    closeBtn?.addEventListener('click', hideModal);
    cancelBtn?.addEventListener('click', hideModal);

    overlay?.addEventListener('click', (e) => {
        if (e.target === overlay) hideModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') hideModal();
    });
}

let modalSubmitHandler = null;

function showModal(title, content, onSubmit = null, viewOnly = false) {
    const overlay = document.getElementById('modalOverlay');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalFooter = document.getElementById('modalFooter');
    const submitBtn = document.getElementById('modalSubmit');

    modalTitle.textContent = title;
    modalBody.innerHTML = content;

    if (viewOnly) {
        modalFooter.style.display = 'none';
    } else {
        modalFooter.style.display = 'flex';

        // Remove old handler
        if (modalSubmitHandler) {
            submitBtn.removeEventListener('click', modalSubmitHandler);
        }

        // Add new handler
        modalSubmitHandler = async () => {
            if (onSubmit) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Saving...';
                try {
                    await onSubmit();
                    hideModal();
                } catch (error) {
                    console.error(error);
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Save';
                }
            }
        };
        submitBtn.addEventListener('click', modalSubmitHandler);
    }

    overlay.classList.add('active');
}

function hideModal() {
    const overlay = document.getElementById('modalOverlay');
    const modalFooter = document.getElementById('modalFooter');
    overlay.classList.remove('active');
    modalFooter.style.display = 'flex';
}

/* ===== Filters ===== */
function initFilters() {
    // Message filters
    document.getElementById('messageStatusFilter')?.addEventListener('change', loadMessages);
    document.getElementById('messagePriorityFilter')?.addEventListener('change', loadMessages);

    // Device filters
    document.getElementById('deviceStatusFilter')?.addEventListener('change', loadDevices);

    // Help filters
    document.getElementById('helpStatusFilter')?.addEventListener('change', loadHelps);

    // Index filters
    document.getElementById('indexTypeFilter')?.addEventListener('change', loadIndexes);
}

/* ===== Logout ===== */
function initLogout() {
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        try {
            await fetch(`${API_BASE}/auth/logout.php`);
            window.location.href = '../login.php';
        } catch (error) {
            window.location.href = '../login.php';
        }
    });
}

/* ===== Helper Functions ===== */
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    toastMessage.textContent = message;
    toast.className = `toast visible ${type}`;

    setTimeout(() => {
        toast.classList.remove('visible');
    }, 3000);
}

function formatTime(timestamp) {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function truncate(str, maxLength) {
    if (!str) return '';
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
}

async function loadDevicesForSelect() {
    try {
        const res = await fetch(`${API_BASE}/Read/device.php`);
        const data = await res.json();

        if (data.success && data.data.devices) {
            return data.data.devices.map(d =>
                `<option value="${d.DID}">${d.device_name || 'Device ' + d.DID} (${d.location_name || 'Unknown'})</option>`
            ).join('');
        }
    } catch (error) {
        console.error('Failed to load devices for select:', error);
    }
    return '';
}
