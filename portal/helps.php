<!DOCTYPE html>
<html lang="en" data-theme="dark">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Responders - LifeLine</title>
    <link rel="stylesheet" href="https://site-assets.fontawesome.com/releases/v7.1.0/css/all.css">
    <link rel="stylesheet" href="https://site-assets.fontawesome.com/releases/v7.1.0/css/sharp-thin.css">
    <link rel="stylesheet" href="https://site-assets.fontawesome.com/releases/v7.1.0/css/sharp-solid.css">
    <link rel="stylesheet" href="https://site-assets.fontawesome.com/releases/v7.1.0/css/sharp-regular.css">
    <link rel="stylesheet" href="https://site-assets.fontawesome.com/releases/v7.1.0/css/sharp-light.css">
    <link rel="stylesheet" href="css/shared.css">
    <link rel="stylesheet" href="css/helps.css">
</head>

<body>
    <div class="header">
        <h1><i class="fa-solid fa-user-helmet-safety"></i> Responders</h1>
        <button class="btn btn-primary" onclick="openModal('create')"><i class="fa-solid fa-plus"></i> Add
            Responder</button>
    </div>

    <div class="stats-bar">
        <div class="stat-item">
            <span class="stat-number" id="total-count">-</span>
            <span class="stat-label">Total</span>
        </div>
        <div class="stat-item">
            <span class="stat-number text-success" id="available-count">-</span>
            <span class="stat-label">Available</span>
        </div>
        <div class="stat-item">
            <span class="stat-number text-warning" id="dispatched-count">-</span>
            <span class="stat-label">Dispatched</span>
        </div>
        <div class="stat-item">
            <span class="stat-number text-danger" id="busy-count">-</span>
            <span class="stat-label">Busy</span>
        </div>
    </div>

    <div class="toolbar">
        <div class="toolbar-left">
            <div class="search-box">
                <i class="fa-solid fa-magnifying-glass search-icon"></i>
                <input type="text" id="search-input" placeholder="Search responders...">
            </div>
            <select class="filter-select" id="status-filter">
                <option value="">All Status</option>
                <option value="available">Available</option>
                <option value="dispatched">Dispatched</option>
                <option value="busy">Busy</option>
            </select>
        </div>
        <button class="btn" onclick="loadHelps()"><i class="fa-solid fa-arrows-rotate"></i> Refresh</button>
    </div>

    <div id="table-container">
        <div class="loading">
            <span class="spinner"></span>
            Loading responders...
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
                <span class="modal-title" id="modal-title"><i class="fa-solid fa-plus-circle"></i> Add Responder</span>
                <button class="modal-close" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <form id="help-form">
                    <input type="hidden" id="help-id">

                    <div class="form-row">
                        <div class="form-group">
                            <label for="help-name"><i class="fa-solid fa-user"></i> Name *</label>
                            <input type="text" id="help-name" placeholder="Nepal Army Rescue Team" required>
                        </div>

                        <div class="form-group">
                            <label for="help-contact"><i class="fa-solid fa-phone"></i> Contact *</label>
                            <input type="text" id="help-contact" placeholder="+977-1-4412345" required>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="help-location"><i class="fa-solid fa-location-dot"></i> Location</label>
                            <input type="text" id="help-location" placeholder="Namche Bazaar">
                        </div>

                        <div class="form-group">
                            <label for="help-eta"><i class="fa-solid fa-clock"></i> ETA</label>
                            <input type="text" id="help-eta" placeholder="30 minutes">
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="help-status"><i class="fa-solid fa-circle-dot"></i> Status</label>
                        <select id="help-status">
                            <option value="available">Available</option>
                            <option value="dispatched">Dispatched</option>
                            <option value="busy">Busy</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label><i class="fa-solid fa-list-check"></i> Responds To (Message Types)</label>
                        <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">
                            Select which emergency types this responder handles
                        </p>
                        <div class="multi-select-container" id="messages-select">
                            <div class="multi-select-trigger" onclick="toggleDropdown()" tabindex="0">
                                <span class="placeholder" id="select-placeholder"><i
                                        class="fa-solid fa-hand-pointer"></i> Click to select message
                                    types...</span>
                            </div>
                            <div class="multi-select-dropdown" id="messages-dropdown">
                                <!-- Options populated by JS -->
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn" onclick="closeModal()"><i class="fa-solid fa-xmark"></i> Cancel</button>
                <button class="btn btn-primary" onclick="saveHelp()"><i class="fa-solid fa-floppy-disk"></i>
                    Save</button>
            </div>
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal-overlay" id="delete-modal">
        <div class="modal" style="max-width: 400px;">
            <div class="modal-header">
                <span class="modal-title"><i class="fa-solid fa-trash-can"></i> Confirm Delete</span>
                <button class="modal-close" onclick="closeDeleteModal()"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <p><i class="fa-solid fa-triangle-exclamation" style="color: var(--danger);"></i> Are you sure you want
                    to delete this responder?</p>
                <p style="color: var(--text-muted); font-size: 13px; margin-top: 8px;">
                    This action cannot be undone.
                </p>
            </div>
            <div class="modal-footer">
                <button class="btn" onclick="closeDeleteModal()"><i class="fa-solid fa-xmark"></i> Cancel</button>
                <button class="btn btn-primary" style="background: var(--danger); border-color: var(--danger);"
                    onclick="confirmDelete()"><i class="fa-solid fa-trash-can"></i> Delete</button>
            </div>
        </div>
    </div>

    <!-- Toast -->
    <div class="toast" id="toast">
        <i class="fa-solid fa-circle-check"></i>
        <span id="toast-message"></span>
    </div>

    <script src="js/helps.js"></script>
</body>

</html>