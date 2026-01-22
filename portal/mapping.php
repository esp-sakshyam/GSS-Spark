<!DOCTYPE html>
<html lang="en" data-theme="dark">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Index Mapping - LifeLine</title>
    <link rel="stylesheet" href="https://site-assets.fontawesome.com/releases/v7.1.0/css/all.css">
    <link rel="stylesheet" href="https://site-assets.fontawesome.com/releases/v7.1.0/css/sharp-thin.css">
    <link rel="stylesheet" href="https://site-assets.fontawesome.com/releases/v7.1.0/css/sharp-solid.css">
    <link rel="stylesheet" href="https://site-assets.fontawesome.com/releases/v7.1.0/css/sharp-regular.css">
    <link rel="stylesheet" href="https://site-assets.fontawesome.com/releases/v7.1.0/css/sharp-light.css">
    <link rel="stylesheet" href="css/shared.css">
    <link rel="stylesheet" href="css/mapping.css">
</head>

<body>
    <div class="header">
        <h1><i class="fa-solid fa-diagram-project"></i> Index Mapping</h1>
        <button class="btn btn-primary" onclick="openCreateModal()"><i class="fa-solid fa-plus"></i> New
            Mapping</button>
    </div>

    <div class="stats-bar">
        <div class="stat-item">
            <span class="stat-number" id="total-count">-</span>
            <span class="stat-label">Total Indexes</span>
        </div>
        <div class="stat-item">
            <span class="stat-number text-info" id="location-count">-</span>
            <span class="stat-label">Location</span>
        </div>
        <div class="stat-item">
            <span class="stat-number text-warning" id="message-count">-</span>
            <span class="stat-label">Message</span>
        </div>
    </div>

    <div class="toolbar">
        <div class="toolbar-left">
            <select class="filter-select" id="type-filter">
                <option value="">All Types</option>
                <option value="location">Location</option>
                <option value="message">Message</option>
            </select>
            <input type="text" class="search-input" id="search-input" placeholder="Search mappings...">
        </div>
        <button class="btn" onclick="loadIndexes()"><i class="fa-solid fa-arrows-rotate"></i> Refresh</button>
    </div>

    <!-- Index Cards Container -->
    <div id="indexes-container">
        <div class="loading">
            <span class="spinner"></span>
            Loading index mappings...
        </div>
    </div>

    <!-- Create/Edit Modal -->
    <div class="modal-overlay" id="edit-modal">
        <div class="modal modal-lg">
            <div class="modal-header">
                <span class="modal-title" id="modal-title"><i class="fa-solid fa-plus-circle"></i> New Index
                    Mapping</span>
                <button class="modal-close" onclick="closeEditModal()"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <form id="index-form">
                    <input type="hidden" id="edit-id">

                    <div class="form-group">
                        <label for="index-type"><i class="fa-solid fa-tag"></i> Type *</label>
                        <select id="index-type" required>
                            <option value="">Select Type</option>
                            <option value="location">Location</option>
                            <option value="message">Message</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="index-description"><i class="fa-solid fa-align-left"></i> Description</label>
                        <textarea id="index-description" rows="2"
                            placeholder="Describe what this index maps..."></textarea>
                    </div>

                    <div class="form-group">
                        <label><i class="fa-solid fa-list-ol"></i> Mapping Entries</label>
                        <div class="mapping-entries" id="mapping-entries">
                            <!-- Dynamic entries will be added here -->
                        </div>
                        <button type="button" class="btn btn-sm" onclick="addMappingEntry()">
                            <i class="fa-solid fa-plus"></i> Add Entry
                        </button>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn" onclick="closeEditModal()"><i class="fa-solid fa-xmark"></i> Cancel</button>
                <button class="btn btn-primary" onclick="saveIndex()"><i class="fa-solid fa-check"></i> Save</button>
            </div>
        </div>
    </div>

    <!-- View Modal -->
    <div class="modal-overlay" id="view-modal">
        <div class="modal modal-lg">
            <div class="modal-header">
                <span class="modal-title"><i class="fa-solid fa-eye"></i> <span id="view-title">Index
                        Details</span></span>
                <button class="modal-close" onclick="closeViewModal()"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body" id="view-content">
            </div>
            <div class="modal-footer">
                <button class="btn" onclick="closeViewModal()"><i class="fa-solid fa-xmark"></i> Close</button>
                <button class="btn btn-primary" id="view-edit-btn" onclick="editFromView()"><i
                        class="fa-solid fa-pen"></i> Edit</button>
            </div>
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal-overlay" id="delete-modal">
        <div class="modal modal-sm">
            <div class="modal-header">
                <span class="modal-title"><i class="fa-solid fa-triangle-exclamation"></i> Confirm Delete</span>
                <button class="modal-close" onclick="closeDeleteModal()"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <p class="delete-warning">
                    <i class="fa-solid fa-exclamation-circle"></i>
                    Are you sure you want to delete this index mapping?
                </p>
                <p class="delete-info">
                    Type: <strong id="delete-type">-</strong><br>
                    This action cannot be undone and may affect message/device decoding.
                </p>
            </div>
            <div class="modal-footer">
                <button class="btn" onclick="closeDeleteModal()"><i class="fa-solid fa-xmark"></i> Cancel</button>
                <button class="btn btn-danger" onclick="confirmDelete()"><i class="fa-solid fa-trash"></i>
                    Delete</button>
            </div>
        </div>
    </div>

    <!-- Add Single Entry Modal -->
    <div class="modal-overlay" id="add-entry-modal">
        <div class="modal modal-sm">
            <div class="modal-header">
                <span class="modal-title"><i class="fa-solid fa-plus"></i> Add Mapping Entry</span>
                <button class="modal-close" onclick="closeAddEntryModal()"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
                <input type="hidden" id="add-entry-iid">
                <div class="form-group">
                    <label for="new-entry-code"><i class="fa-solid fa-hashtag"></i> Code *</label>
                    <input type="number" id="new-entry-code" placeholder="e.g., 16" required min="1">
                </div>
                <div class="form-group">
                    <label for="new-entry-value"><i class="fa-solid fa-text"></i> Value *</label>
                    <input type="text" id="new-entry-value" placeholder="e.g., New Location Name" required>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn" onclick="closeAddEntryModal()"><i class="fa-solid fa-xmark"></i> Cancel</button>
                <button class="btn btn-primary" onclick="saveNewEntry()"><i class="fa-solid fa-plus"></i> Add</button>
            </div>
        </div>
    </div>

    <!-- Toast Notification -->
    <div class="toast" id="toast">
        <i class="fa-solid fa-circle-check"></i>
        <span id="toast-message">Success</span>
    </div>

    <script src="js/mapping.js"></script>
</body>

</html>