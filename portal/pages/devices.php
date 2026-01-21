<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Devices - LifeLine Portal</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet">
    <link rel="stylesheet" href="../css/shared.css">
    <link rel="stylesheet" href="../css/devices.css">
</head>

<body>
    <div class="page-container">
        <!-- Page Header -->
        <div class="page-header">
            <div class="header-content">
                <h1>Devices</h1>
                <p class="header-subtitle">Manage all registered LoRa devices in the system</p>
            </div>
            <div class="header-actions">
                <button class="btn btn-secondary" id="refreshBtn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="23 4 23 10 17 10"></polyline>
                        <polyline points="1 20 1 14 7 14"></polyline>
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                    </svg>
                    Refresh
                </button>
                <button class="btn btn-primary" id="addDeviceBtn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add Device
                </button>
            </div>
        </div>

        <!-- Status Overview -->
        <div class="status-overview">
            <div class="status-card active">
                <div class="status-count" id="activeCount">0</div>
                <div class="status-label">Active</div>
            </div>
            <div class="status-card inactive">
                <div class="status-count" id="inactiveCount">0</div>
                <div class="status-label">Inactive</div>
            </div>
            <div class="status-card maintenance">
                <div class="status-count" id="maintenanceCount">0</div>
                <div class="status-label">Maintenance</div>
            </div>
            <div class="status-card total">
                <div class="status-count" id="totalCount">0</div>
                <div class="status-label">Total</div>
            </div>
        </div>

        <!-- Filters -->
        <div class="filter-bar">
            <select class="filter-select" id="filterStatus">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
            </select>
            <select class="filter-select" id="filterLocation">
                <option value="">All Locations</option>
            </select>
        </div>

        <!-- Devices Grid -->
        <div class="devices-grid" id="devicesGrid">
            <div class="loading-state">Loading devices...</div>
        </div>
    </div>

    <!-- Add/Edit Device Modal -->
    <div class="modal-overlay" id="deviceModal">
        <div class="modal">
            <div class="modal-header">
                <h3 id="modalTitle">Add Device</h3>
                <button class="modal-close" onclick="closeModal('deviceModal')">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <form id="deviceForm">
                    <input type="hidden" id="deviceId">

                    <div class="form-group">
                        <label class="form-label" for="deviceName">Device Name</label>
                        <input type="text" class="form-input" id="deviceName" placeholder="e.g., Lobby Sensor" required>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="deviceLocation">Location</label>
                        <select class="form-select" id="deviceLocation">
                            <option value="">Select location...</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="deviceStatus">Status</label>
                        <select class="form-select" id="deviceStatus">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="maintenance">Maintenance</option>
                        </select>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('deviceModal')">Cancel</button>
                <button class="btn btn-primary" id="saveDeviceBtn">Save Device</button>
            </div>
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal-overlay" id="deleteModal">
        <div class="modal" style="max-width: 400px;">
            <div class="modal-header">
                <h3>Delete Device</h3>
                <button class="modal-close" onclick="closeModal('deleteModal')">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to delete <strong id="deleteDeviceName"></strong>?</p>
                <p class="text-muted">This action cannot be undone. All messages from this device will also be deleted.
                </p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('deleteModal')">Cancel</button>
                <button class="btn btn-danger" id="confirmDeleteBtn">Delete</button>
            </div>
        </div>
    </div>

    <script src="../js/shared.js"></script>
    <script src="../js/devices.js"></script>
</body>

</html>