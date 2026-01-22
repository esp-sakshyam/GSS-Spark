<!DOCTYPE html>
<html lang="en" data-theme="dark">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Devices - LifeLine</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://site-assets.fontawesome.com/releases/v7.1.0/css/all.css">
    <link rel="stylesheet" href="css/shared.css">
    <link rel="stylesheet" href="css/devices.css">
</head>

<body>
    <div class="header">
        <h1><i class="fa-solid fa-microchip"></i> Devices</h1>
        <button class="btn btn-primary" onclick="openModal('create')">
            <i class="fa-solid fa-plus"></i> Add Device
        </button>
    </div>

    <div class="toolbar">
        <div class="toolbar-left">
            <div class="search-box">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input type="text" id="search-input" placeholder="Search devices...">
            </div>
            <select class="filter-select" id="status-filter">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
            </select>
            <select class="filter-select" id="location-filter">
                <option value="">All Locations</option>
            </select>
        </div>
        <button class="btn" onclick="loadDevices()">
            <i class="fa-solid fa-arrows-rotate"></i> Refresh
        </button>
    </div>

    <div id="table-container">
        <div class="loading">
            <span class="spinner"></span>
            Loading devices...
        </div>
    </div>

    <div class="pagination" id="pagination" style="display: none;">
        <div class="pagination-info" id="pagination-info">Showing 0 of 0</div>
        <div class="pagination-controls" id="pagination-controls"></div>
    </div>

    <!-- Create/Edit Modal -->
    <div class="modal-overlay" id="modal-overlay">
        <div class="modal">
            <div class="modal-header">
                <span class="modal-title" id="modal-title">
                    <i class="fa-solid fa-plus-circle"></i> Add Device
                </span>
                <button class="modal-close" onclick="closeModal()">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="device-form">
                    <input type="hidden" id="device-id">

                    <div class="form-group">
                        <label for="device-name">Device Name</label>
                        <input type="text" id="device-name" placeholder="ESP-Node-01">
                    </div>

                    <div class="form-group">
                        <label for="device-location">Location *</label>
                        <select id="device-location" required>
                            <option value="">Select Location</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="device-status">Status</label>
                        <select id="device-status">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="maintenance">Maintenance</option>
                        </select>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn" onclick="closeModal()">
                    <i class="fa-solid fa-xmark"></i> Cancel
                </button>
                <button class="btn btn-primary" onclick="saveDevice()">
                    <i class="fa-solid fa-check"></i> Save
                </button>
            </div>
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal-overlay" id="delete-modal">
        <div class="modal" style="max-width: 420px;">
            <div class="modal-header">
                <span class="modal-title">
                    <i class="fa-solid fa-trash-can text-danger"></i> Confirm Delete
                </span>
                <button class="modal-close" onclick="closeDeleteModal()">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to delete this device?</p>
                <p style="color: var(--text-muted); font-size: 13px; margin-top: 8px;">
                    <i class="fa-solid fa-circle-info"></i> This will also delete all associated messages.
                </p>
            </div>
            <div class="modal-footer">
                <button class="btn" onclick="closeDeleteModal()">
                    <i class="fa-solid fa-xmark"></i> Cancel
                </button>
                <button class="btn btn-danger" onclick="confirmDelete()">
                    <i class="fa-solid fa-trash-can"></i> Delete
                </button>
            </div>
        </div>
    </div>

    <!-- Map Modal -->
    <div class="modal-overlay" id="map-modal">
        <div class="modal" style="max-width: 700px;">
            <div class="modal-header">
                <span class="modal-title" id="map-modal-title">
                    <i class="fa-solid fa-location-dot"></i> Location
                </span>
                <button class="modal-close" onclick="closeMapModal()">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="modal-body" style="padding: 0;">
                <div class="map-container" id="map-container">
                    <div class="map-loading">
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        <span>Loading map...</span>
                    </div>
                </div>
                <div class="map-info" id="map-info">
                    <span class="map-location-name" id="map-location-name"></span>
                    <button class="btn btn-primary" id="open-gmaps-btn" onclick="openInGoogleMaps()">
                        <i class="fa-solid fa-map-location-dot"></i> Open in Google Maps
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Toast -->
    <div class="toast" id="toast">
        <i class="fa-solid fa-circle-check"></i>
        <span id="toast-message"></span>
    </div>

    <script src="js/devices.js"></script>
</body>

</html>