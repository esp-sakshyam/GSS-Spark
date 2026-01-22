<!DOCTYPE html>
<html lang="en" data-theme="dark">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Messages - LifeLine</title>
    <link rel="stylesheet" href="https://site-assets.fontawesome.com/releases/v7.1.0/css/all.css">
    <link rel="stylesheet" href="https://site-assets.fontawesome.com/releases/v7.1.0/css/sharp-thin.css">
    <link rel="stylesheet" href="https://site-assets.fontawesome.com/releases/v7.1.0/css/sharp-solid.css">
    <link rel="stylesheet" href="https://site-assets.fontawesome.com/releases/v7.1.0/css/sharp-regular.css">
    <link rel="stylesheet" href="https://site-assets.fontawesome.com/releases/v7.1.0/css/sharp-light.css">
    <link rel="stylesheet" href="css/shared.css">
    <link rel="stylesheet" href="css/messages.css">
</head>

<body>
    <div class="header">
        <h1><i class="fa-solid fa-message-exclamation"></i> Emergency Messages</h1>
        <button class="btn btn-primary" onclick="openCreateModal()"><i class="fa-solid fa-plus"></i> New
            Message</button>
    </div>

    <div class="stats-bar">
        <div class="stat-item">
            <span class="stat-number" id="total-count">-</span>
            <span class="stat-label">Total</span>
        </div>
        <div class="stat-item">
            <span class="stat-number text-danger" id="active-count">-</span>
            <span class="stat-label">Active</span>
        </div>
        <div class="stat-item">
            <span class="stat-number text-success" id="resolved-count">-</span>
            <span class="stat-label">Resolved</span>
        </div>
    </div>

    <div class="toolbar">
        <div class="toolbar-left">
            <select class="filter-select" id="status-filter">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="resolved">Resolved</option>
            </select>
            <select class="filter-select" id="device-filter">
                <option value="">All Devices</option>
            </select>
            <select class="filter-select" id="message-type-filter">
                <option value="">All Message Types</option>
            </select>
            <input type="date" class="date-input" id="from-date" placeholder="From">
            <input type="date" class="date-input" id="to-date" placeholder="To">
        </div>
        <button class="btn" onclick="loadMessages()"><i class="fa-solid fa-arrows-rotate"></i> Refresh</button>
    </div>

    <div id="table-container">
        <div class="loading">
            <span class="spinner"></span>
            Loading messages...
        </div>
    </div>

    <div class="pagination" id="pagination" style="display: none;">
        <div class="pagination-info" id="pagination-info">Showing 0 of 0</div>
        <div class="pagination-controls" id="pagination-controls"></div>
    </div>

    <!-- Create Modal -->
    <div class="modal-overlay" id="create-modal">
        <div class="modal">
            <div class="modal-header">
                <span class="modal-title"><i class="fa-solid fa-plus-circle"></i> New Emergency Message</span>
                <button class="modal-close" onclick="closeCreateModal()"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <form id="message-form">
                    <div class="form-group">
                        <label for="msg-device"><i class="fa-solid fa-microchip"></i> Device *</label>
                        <select id="msg-device" required>
                            <option value="">Select Device</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="msg-type"><i class="fa-solid fa-triangle-exclamation"></i> Message Type *</label>
                        <select id="msg-type" required>
                            <option value="">Select Message Type</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="msg-rssi"><i class="fa-solid fa-signal"></i> Signal Strength (RSSI)</label>
                        <input type="number" id="msg-rssi" placeholder="-65" min="-120" max="0">
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn" onclick="closeCreateModal()" id="cancel-btn"><i class="fa-solid fa-xmark"></i>
                    Cancel</button>
                <button class="btn btn-primary" onclick="createMessage()" id="send-btn">
                    <span class="btn-text"><i class="fa-solid fa-paper-plane"></i> Create Message</span>
                    <span class="btn-loading" style="display: none;">
                        <i class="fa-solid fa-spinner fa-spin"></i> Sending...
                    </span>
                </button>
            </div>

            <!-- Progress overlay -->
            <div class="sending-overlay" id="sending-overlay">
                <div class="sending-content">
                    <div class="sending-spinner"></div>
                    <p class="sending-title">Sending Emergency Alert</p>
                    <p class="sending-subtitle" id="sending-status">Creating message...</p>
                    <div class="progress-bar">
                        <div class="progress-fill" id="progress-fill"></div>
                    </div>
                    <p class="sending-info">Sending push notifications and emails to all registered receivers</p>
                </div>
            </div>
        </div>
    </div>

    <!-- View Modal -->
    <div class="modal-overlay" id="view-modal">
        <div class="modal">
            <div class="modal-header">
                <span class="modal-title"><i class="fa-solid fa-circle-info"></i> Message Details</span>
                <button class="modal-close" onclick="closeViewModal()"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body" id="message-details">
            </div>
            <div class="modal-footer">
                <button class="btn" onclick="closeViewModal()"><i class="fa-solid fa-xmark"></i> Close</button>
            </div>
        </div>
    </div>

    <!-- Delete Modal -->
    <div class="modal-overlay" id="delete-modal">
        <div class="modal" style="max-width: 400px;">
            <div class="modal-header">
                <span class="modal-title"><i class="fa-solid fa-trash-can"></i> Confirm Delete</span>
                <button class="modal-close" onclick="closeDeleteModal()"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <p><i class="fa-solid fa-triangle-exclamation" style="color: var(--danger);"></i> Are you sure you want
                    to delete this message?</p>
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

    <script src="js/messages.js"></script>
</body>

</html>