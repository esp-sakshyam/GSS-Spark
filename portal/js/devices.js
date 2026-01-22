// Devices Page JavaScript
const API_BASE = '../API';
let devices = [];
let locations = {};
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

// Toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const icon = toast.querySelector('i');

    toast.className = `toast show ${type}`;
    toastMessage.textContent = message;
    icon.className = type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation';

    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Load locations for dropdowns
async function loadLocations() {
    try {
        const res = await fetch(`${API_BASE}/Read/index.php?type=location`);
        const data = await res.json();
        if (data.success && data.data.mapping) {
            locations = data.data.mapping;
            populateLocationDropdowns();
        }
    } catch (error) {
        console.error('Error loading locations:', error);
    }
}

function populateLocationDropdowns() {
    const filterSelect = document.getElementById('location-filter');
    const formSelect = document.getElementById('device-location');

    // Clear existing options (keep first)
    filterSelect.innerHTML = '<option value="">All Locations</option>';
    formSelect.innerHTML = '<option value="">Select Location</option>';

    Object.entries(locations).forEach(([code, name]) => {
        filterSelect.innerHTML += `<option value="${code}">${name}</option>`;
        formSelect.innerHTML += `<option value="${code}">${name}</option>`;
    });
}

// Load devices
async function loadDevices() {
    const container = document.getElementById('table-container');
    container.innerHTML = '<div class="loading"><span class="spinner"></span>Loading devices...</div>';

    try {
        const status = document.getElementById('status-filter').value;
        const lid = document.getElementById('location-filter').value;
        const search = document.getElementById('search-input').value;

        let url = `${API_BASE}/Read/device.php?page=${currentPage}&limit=20`;
        if (status) url += `&status=${status}`;
        if (lid) url += `&lid=${lid}`;

        const res = await fetch(url);
        const data = await res.json();

        if (data.success) {
            devices = data.data.devices || data.data || [];
            const pagination = data.data.pagination;

            if (pagination) {
                totalPages = pagination.pages;
                updatePagination(pagination);
            }

            // Client-side search filter
            if (search) {
                devices = devices.filter(d =>
                    (d.device_name && d.device_name.toLowerCase().includes(search.toLowerCase())) ||
                    (d.location_name && d.location_name.toLowerCase().includes(search.toLowerCase()))
                );
            }

            renderTable();
        } else {
            container.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><i class="fa-solid fa-triangle-exclamation"></i></div><div class="empty-state-text">${data.message}</div></div>`;
        }
    } catch (error) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><i class="fa-solid fa-circle-xmark"></i></div><div class="empty-state-text">Error loading devices</div></div>`;
        console.error('Error:', error);
    }
}

function renderTable() {
    const container = document.getElementById('table-container');

    if (devices.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fa-solid fa-microchip"></i></div>
                <div class="empty-state-text">No devices found</div>
                <button class="btn btn-primary" onclick="openModal('create')">
                    <i class="fa-solid fa-plus"></i> Add First Device
                </button>
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
                    <th>Device Name</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Last Ping</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${devices.map(device => `
                    <tr>
                        <td><span style="color: var(--text-muted);">#${device.DID}</span></td>
                        <td><i class="fa-solid fa-microchip" style="color: var(--text-muted); margin-right: 8px;"></i>${device.device_name || 'Unnamed Device'}</td>
                        <td><i class="fa-solid fa-location-dot" style="color: var(--accent); margin-right: 8px;"></i>${device.location_name || locations[device.LID] || 'Unknown'}</td>
                        <td>
                            <span class="status-badge ${device.status || 'inactive'}">
                                <i class="fa-solid fa-circle"></i>
                                ${(device.status || 'inactive').charAt(0).toUpperCase() + (device.status || 'inactive').slice(1)}
                            </span>
                        </td>
                        <td><i class="fa-solid fa-clock" style="color: var(--text-muted); margin-right: 8px;"></i>${formatTime(device.last_ping)}</td>
                        <td class="actions">
                            <button class="btn btn-icon view" onclick="viewLocation('${device.location_name || locations[device.LID] || ''}')" title="View on Map">
                                <i class="fa-solid fa-map-location-dot"></i>
                            </button>
                            <button class="btn btn-icon edit" onclick="openModal('edit', ${device.DID})" title="Edit">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="btn btn-icon delete" onclick="openDeleteModal(${device.DID})" title="Delete">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    document.getElementById('pagination').style.display = 'flex';
}

function formatTime(timestamp) {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = (now - date) / 1000;

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
}

function updatePagination(pagination) {
    const info = document.getElementById('pagination-info');
    const controls = document.getElementById('pagination-controls');

    const start = (pagination.page - 1) * pagination.limit + 1;
    const end = Math.min(pagination.page * pagination.limit, pagination.total);
    info.textContent = `Showing ${start}-${end} of ${pagination.total}`;

    let html = '';
    html += `<button class="btn page-btn" onclick="goToPage(${pagination.page - 1})" ${pagination.page <= 1 ? 'disabled' : ''}><i class="fa-solid fa-chevron-left"></i></button>`;

    for (let i = 1; i <= pagination.pages; i++) {
        if (i <= 3 || i > pagination.pages - 2 || Math.abs(i - pagination.page) <= 1) {
            html += `<button class="btn page-btn ${i === pagination.page ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
        } else if (i === 4 || i === pagination.pages - 2) {
            html += `<span style="padding: 0 8px; color: var(--text-muted);">...</span>`;
        }
    }

    html += `<button class="btn page-btn" onclick="goToPage(${pagination.page + 1})" ${pagination.page >= pagination.pages ? 'disabled' : ''}><i class="fa-solid fa-chevron-right"></i></button>`;
    controls.innerHTML = html;
}

function goToPage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    loadDevices();
}

// Modal functions
function openModal(mode, id = null) {
    const overlay = document.getElementById('modal-overlay');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('device-form');

    form.reset();
    document.getElementById('device-id').value = '';

    if (mode === 'edit' && id) {
        title.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Edit Device';
        const device = devices.find(d => d.DID == id);
        if (device) {
            document.getElementById('device-id').value = device.DID;
            document.getElementById('device-name').value = device.device_name || '';
            document.getElementById('device-location').value = device.LID;
            document.getElementById('device-status').value = device.status || 'active';
        }
    } else {
        title.innerHTML = '<i class="fa-solid fa-plus-circle"></i> Add Device';
    }

    overlay.classList.add('active');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
}

async function saveDevice() {
    const id = document.getElementById('device-id').value;
    const deviceName = document.getElementById('device-name').value;
    const lid = document.getElementById('device-location').value;
    const status = document.getElementById('device-status').value;

    if (!lid) {
        showToast('Please select a location', 'error');
        return;
    }

    try {
        let url, method, body;

        if (id) {
            // Update
            url = `${API_BASE}/Update/device.php`;
            method = 'PUT';
            body = JSON.stringify({
                DID: parseInt(id),
                device_name: deviceName,
                LID: parseInt(lid),
                status: status
            });
        } else {
            // Create
            url = `${API_BASE}/Create/device.php`;
            method = 'POST';
            body = JSON.stringify({
                device_name: deviceName,
                LID: parseInt(lid),
                status: status
            });
        }

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: body
        });

        const data = await res.json();

        if (data.success) {
            showToast(id ? 'Device updated successfully' : 'Device created successfully');
            closeModal();
            loadDevices();
        } else {
            showToast(data.message || 'Error saving device', 'error');
        }
    } catch (error) {
        showToast('Error saving device', 'error');
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
        const res = await fetch(`${API_BASE}/Delete/device.php?id=${deleteId}`, {
            method: 'DELETE'
        });

        const data = await res.json();

        if (data.success) {
            showToast('Device deleted successfully');
            closeDeleteModal();
            loadDevices();
        } else {
            showToast(data.message || 'Error deleting device', 'error');
        }
    } catch (error) {
        showToast('Error deleting device', 'error');
        console.error('Error:', error);
    }
}

// Map Modal Variables
let currentMapLocation = null;

// Get Google Maps embed URL for a location
function getGoogleMapsEmbedUrl(locationName) {
    const query = encodeURIComponent(locationName + ", Nepal");
    return `https://www.google.com/maps?q=${query}&output=embed`;
}

function viewLocation(locationName) {
    if (!locationName) {
        showToast('No location specified for this device', 'error');
        return;
    }

    currentMapLocation = locationName;

    // Open modal
    document.getElementById('map-modal').classList.add('active');
    document.getElementById('map-modal-title').innerHTML = `<i class="fa-solid fa-location-dot"></i> ${locationName}`;
    document.getElementById('map-location-name').textContent = locationName;

    // Load Google Maps embed directly
    const embedUrl = getGoogleMapsEmbedUrl(locationName);
    document.getElementById('map-container').innerHTML = `
        <iframe 
            src="${embedUrl}" 
            loading="lazy"
            style="width: 100%; height: 100%; border: none;"
            allowfullscreen
            referrerpolicy="no-referrer-when-downgrade"
        ></iframe>
    `;
}

function closeMapModal() {
    document.getElementById('map-modal').classList.remove('active');
    currentMapLocation = null;
}

function openInGoogleMaps() {
    if (currentMapLocation) {
        window.open(`https://www.google.com/maps/search/${encodeURIComponent(currentMapLocation + ", Nepal")}`, '_blank');
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
document.getElementById('search-input').addEventListener('input', debounce(loadDevices, 300));
document.getElementById('status-filter').addEventListener('change', () => { currentPage = 1; loadDevices(); });
document.getElementById('location-filter').addEventListener('change', () => { currentPage = 1; loadDevices(); });

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    syncTheme();
    loadLocations().then(() => loadDevices());
});
