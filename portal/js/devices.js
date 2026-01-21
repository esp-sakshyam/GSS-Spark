/* ===== LifeLine Portal - Devices JavaScript ===== */
console.log('[Devices] devices.js loading...');
console.log('[Devices] window.LifeLine =', window.LifeLine);

// Wait for LifeLine to be available
if (!window.LifeLine) {
    console.error('[Devices] LifeLine not loaded! Make sure shared.js is included before this file.');
    throw new Error('LifeLine not loaded');
}

const LL = window.LifeLine;
const apiGet = LL.apiGet;
const apiPost = LL.apiPost;
const apiPut = LL.apiPut;
const apiDelete = LL.apiDelete;
const formatTime = LL.formatTime;
const showToast = LL.showToast;
const openModal = LL.openModal;
const closeModal = LL.closeModal;
const initModalClose = LL.initModalClose;
const getIcon = LL.getIcon;

console.log('[Devices] Functions loaded - apiGet:', typeof apiGet);

// ===== State =====
let allDevices = [];
let filteredDevices = [];
let locations = [];
let deleteTargetId = null;

// ===== DOM Elements =====
let devicesGrid;
let filterStatus, filterLocation;
let refreshBtn, addDeviceBtn, saveDeviceBtn, confirmDeleteBtn;
let deviceForm, deviceId, deviceName, deviceLocation, deviceStatus;
let activeCount, inactiveCount, maintenanceCount, totalCount;

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    initElements();
    initEventListeners();
    loadData();
});

function initElements() {
    devicesGrid = document.getElementById('devicesGrid');
    filterStatus = document.getElementById('filterStatus');
    filterLocation = document.getElementById('filterLocation');
    refreshBtn = document.getElementById('refreshBtn');
    addDeviceBtn = document.getElementById('addDeviceBtn');
    saveDeviceBtn = document.getElementById('saveDeviceBtn');
    confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    deviceForm = document.getElementById('deviceForm');
    deviceId = document.getElementById('deviceId');
    deviceName = document.getElementById('deviceName');
    deviceLocation = document.getElementById('deviceLocation');
    deviceStatus = document.getElementById('deviceStatus');

    activeCount = document.getElementById('activeCount');
    inactiveCount = document.getElementById('inactiveCount');
    maintenanceCount = document.getElementById('maintenanceCount');
    totalCount = document.getElementById('totalCount');
}

function initEventListeners() {
    refreshBtn?.addEventListener('click', () => {
        refreshBtn.classList.add('spin');
        loadData().finally(() => {
            setTimeout(() => refreshBtn.classList.remove('spin'), 500);
        });
    });

    addDeviceBtn?.addEventListener('click', () => openAddModal());
    saveDeviceBtn?.addEventListener('click', saveDevice);
    confirmDeleteBtn?.addEventListener('click', confirmDelete);

    filterStatus?.addEventListener('change', applyFilters);
    filterLocation?.addEventListener('change', applyFilters);

    initModalClose('deviceModal');
    initModalClose('deleteModal');
}

// ===== Load Data =====
async function loadData() {
    try {
        const [devicesRes, indexesRes] = await Promise.all([
            apiGet('Read/device.php'),
            apiGet('Read/index.php')
        ]);

        allDevices = devicesRes.data?.devices || [];

        // Get locations from the location index mapping
        const indexData = indexesRes.data?.indexes || [];
        const locationIndex = indexData.find(i => i.type === 'location');
        if (locationIndex && locationIndex.mapping) {
            // Convert mapping object to array of {code, name} for dropdowns
            locations = Object.entries(locationIndex.mapping).map(([code, name]) => ({ code, name }));
        } else {
            locations = [];
        }

        populateFilters();
        updateStatusCounts();
        applyFilters();

    } catch (error) {
        console.error('Load error:', error);
        showToast('Failed to load devices', 'error');
        devicesGrid.innerHTML = '<div class="empty-state"><p>Failed to load devices</p></div>';
    }
}

// ===== Populate Filters =====
function populateFilters() {
    // Location filter
    if (filterLocation) {
        const locationOptions = locations.map(l =>
            `<option value="${l.code}">${l.name}</option>`
        ).join('');
        filterLocation.innerHTML = `<option value="">All Locations</option>${locationOptions}`;
    }

    // Location select in modal
    if (deviceLocation) {
        const locationOptions = locations.map(l =>
            `<option value="${l.code}">${l.name}</option>`
        ).join('');
        deviceLocation.innerHTML = `<option value="">Select location...</option>${locationOptions}`;
    }
}

// ===== Update Status Counts =====
function updateStatusCounts() {
    const active = allDevices.filter(d => d.status === 'active').length;
    const inactive = allDevices.filter(d => d.status === 'inactive').length;
    const maintenance = allDevices.filter(d => d.status === 'maintenance').length;

    if (activeCount) activeCount.textContent = active;
    if (inactiveCount) inactiveCount.textContent = inactive;
    if (maintenanceCount) maintenanceCount.textContent = maintenance;
    if (totalCount) totalCount.textContent = allDevices.length;
}

// ===== Apply Filters =====
function applyFilters() {
    const statusFilter = filterStatus?.value || '';
    const locationFilter = filterLocation?.value || '';

    filteredDevices = allDevices.filter(device => {
        if (statusFilter && device.status !== statusFilter) return false;
        if (locationFilter && String(device.LID) !== locationFilter) return false;
        return true;
    });

    renderDevices();
}

// ===== Render Devices =====
function renderDevices() {
    if (!devicesGrid) return;

    if (filteredDevices.length === 0) {
        devicesGrid.innerHTML = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                    <rect x="9" y="9" width="6" height="6"></rect>
                    <line x1="9" y1="1" x2="9" y2="4"></line>
                    <line x1="15" y1="1" x2="15" y2="4"></line>
                    <line x1="9" y1="20" x2="9" y2="23"></line>
                    <line x1="15" y1="20" x2="15" y2="23"></line>
                    <line x1="20" y1="9" x2="23" y2="9"></line>
                    <line x1="20" y1="14" x2="23" y2="14"></line>
                    <line x1="1" y1="9" x2="4" y2="9"></line>
                    <line x1="1" y1="14" x2="4" y2="14"></line>
                </svg>
                <h3>No Devices Found</h3>
                <p>Get started by adding your first device</p>
                <button class="btn btn-primary" onclick="openAddModal()">
                    ${getIcon('plus')} Add Device
                </button>
            </div>
        `;
        return;
    }

    devicesGrid.innerHTML = filteredDevices.map(device => `
        <div class="device-card" data-did="${device.DID}">
            <div class="device-card-header">
                <div class="device-main-info">
                    <div class="device-name">${device.device_name || `Device ${device.DID}`}</div>
                    <div class="device-id">ID: ${device.DID}</div>
                </div>
                <div class="device-status-indicator ${device.status || 'inactive'}">
                    <span class="status-dot"></span>
                    ${device.status || 'inactive'}
                </div>
            </div>
            <div class="device-card-body">
                <div class="device-meta-grid">
                    <div class="device-meta-item">
                        <span class="device-meta-label">Location</span>
                        <span class="device-meta-value">${device.location_name || 'Not assigned'}</span>
                    </div>
                    <div class="device-meta-item">
                        <span class="device-meta-label">Last Ping</span>
                        <span class="device-meta-value">${device.last_ping ? formatTime(device.last_ping) : 'Never'}</span>
                    </div>
                </div>
            </div>
            <div class="device-card-footer">
                <button class="action-btn edit" title="Edit" onclick="editDevice(${device.DID})">
                    ${getIcon('edit')}
                </button>
                <button class="action-btn delete" title="Delete" onclick="openDeleteModal(${device.DID})">
                    ${getIcon('trash')}
                </button>
            </div>
        </div>
    `).join('');
}

// ===== Modal Actions =====
function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Add Device';
    deviceForm.reset();
    deviceId.value = '';
    deviceStatus.value = 'active';
    openModal('deviceModal');
}

function editDevice(did) {
    const device = allDevices.find(d => d.DID == did);
    if (!device) return;

    document.getElementById('modalTitle').textContent = 'Edit Device';
    deviceId.value = device.DID;
    deviceName.value = device.device_name || '';
    deviceLocation.value = device.location_name || '';
    deviceStatus.value = device.status || 'inactive';

    openModal('deviceModal');
}

function openDeleteModal(did) {
    const device = allDevices.find(d => d.DID == did);
    if (!device) return;

    deleteTargetId = did;
    document.getElementById('deleteDeviceName').textContent = device.device_name || `Device ${did}`;
    openModal('deleteModal');
}

// ===== CRUD Operations =====
async function saveDevice() {
    const name = deviceName.value.trim();
    const location = deviceLocation.value;
    const status = deviceStatus.value;
    const id = deviceId.value;

    if (!name) {
        showToast('Please enter a device name', 'error');
        return;
    }

    try {
        saveDeviceBtn.disabled = true;
        saveDeviceBtn.textContent = 'Saving...';

        // Find location LID if location is selected
        let lid = null;
        if (location) {
            // We need to get the LID from indexes
            const indexesRes = await apiGet('Read/index.php');
            const indexes = indexesRes.data?.indexes || [];
            const matchingIndex = indexes.find(i => i.location === location);
            lid = matchingIndex?.LID || null;
        }

        if (id) {
            // Update existing device
            await apiPut('Update/device.php', {
                DID: id,
                device_name: name,
                LID: lid,
                status: status
            });
            showToast('Device updated successfully', 'success');
        } else {
            // Create new device
            await apiPost('Create/device.php', {
                device_name: name,
                LID: lid,
                status: status
            });
            showToast('Device created successfully', 'success');
        }

        closeModal('deviceModal');
        await loadData();

    } catch (error) {
        console.error('Save error:', error);
        showToast('Failed to save device', 'error');
    } finally {
        saveDeviceBtn.disabled = false;
        saveDeviceBtn.textContent = 'Save Device';
    }
}

async function confirmDelete() {
    if (!deleteTargetId) return;

    try {
        confirmDeleteBtn.disabled = true;
        confirmDeleteBtn.textContent = 'Deleting...';

        await apiDelete(`Delete/device.php?DID=${deleteTargetId}`);
        showToast('Device deleted successfully', 'success');

        closeModal('deleteModal');
        deleteTargetId = null;
        await loadData();

    } catch (error) {
        console.error('Delete error:', error);
        showToast('Failed to delete device', 'error');
    } finally {
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.textContent = 'Delete';
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
window.editDevice = editDevice;
window.openAddModal = openAddModal;
window.openDeleteModal = openDeleteModal;
window.closeModal = closeModal;
