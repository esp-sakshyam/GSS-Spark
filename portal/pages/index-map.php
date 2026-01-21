<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Index Mappings - LifeLine Portal</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet">
    <link rel="stylesheet" href="../css/shared.css">
    <link rel="stylesheet" href="../css/index-map.css">
</head>

<body>
    <div class="page-container">
        <!-- Page Header -->
        <div class="page-header">
            <div class="header-content">
                <h1>Index Mappings</h1>
                <p class="header-subtitle">Configure code to text mappings for locations, messages, and help resources
                </p>
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
                <button class="btn btn-primary" id="addEntryBtn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add Entry
                </button>
            </div>
        </div>

        <!-- Stats -->
        <div class="mapping-stats">
            <div class="stat-item">
                <span class="stat-value" id="totalLocations">0</span>
                <span class="stat-label">Locations</span>
            </div>
            <div class="stat-item">
                <span class="stat-value" id="totalMessages">0</span>
                <span class="stat-label">Messages</span>
            </div>
            <div class="stat-item">
                <span class="stat-value" id="totalHelps">0</span>
                <span class="stat-label">Help Resources</span>
            </div>
        </div>

        <!-- Filters -->
        <div class="filter-bar">
            <select class="filter-select" id="filterType">
                <option value="">All Types</option>
                <option value="location">Location Mappings</option>
                <option value="message">Message Mappings</option>
                <option value="help">Help Mappings</option>
            </select>
        </div>

        <!-- Mappings Grid -->
        <div class="mappings-container">
            <div class="mappings-grid" id="mappingsGrid">
                <div class="loading-state">Loading mappings...</div>
            </div>
        </div>
    </div>

    <!-- Add/Edit Entry Modal -->
    <div class="modal-overlay" id="entryModal">
        <div class="modal">
            <div class="modal-header">
                <h3 id="entryModalTitle">Add Entry</h3>
                <button class="modal-close" onclick="closeModal('entryModal')">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <form id="entryForm">
                    <div class="form-group">
                        <label class="form-label" for="entryType">Type</label>
                        <select class="form-select" id="entryType" required>
                            <option value="location">Location</option>
                            <option value="message">Message</option>
                            <option value="help">Help Resource</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="entryCode">Code / ID</label>
                        <input type="text" class="form-input mono" id="entryCode" placeholder="e.g., 1, 2, 3..."
                            required>
                        <small class="form-hint">The numeric code or ID</small>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="entryValue">Value</label>
                        <input type="text" class="form-input" id="entryValue"
                            placeholder="Text value or comma-separated codes for help" required>
                        <small class="form-hint">For help type: enter comma-separated message codes (e.g., 1, 2,
                            5)</small>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('entryModal')">Cancel</button>
                <button class="btn btn-primary" id="saveEntryBtn">Save Entry</button>
            </div>
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal-overlay" id="deleteModal">
        <div class="modal" style="max-width: 400px;">
            <div class="modal-header">
                <h3>Delete Entry</h3>
                <button class="modal-close" onclick="closeModal('deleteModal')">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <p id="deleteMessage">Are you sure you want to delete this entry?</p>
                <p class="text-muted">This action cannot be undone.</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('deleteModal')">Cancel</button>
                <button class="btn btn-danger" id="confirmDeleteBtn">Delete</button>
            </div>
        </div>
    </div>

    <script src="../js/shared.js"></script>
    <script src="../js/index-map.js"></script>
</body>

</html>