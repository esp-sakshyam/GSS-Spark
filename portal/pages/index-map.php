<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Index Mappings - LifeLine Portal</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../css/shared.css">
    <link rel="stylesheet" href="../css/index-map.css">
</head>
<body>
    <div class="page-container">
        <!-- Page Header -->
        <div class="page-header">
            <div class="header-content">
                <h1>Index Mappings</h1>
                <p class="header-subtitle">Configure message code to location and help resource mappings</p>
            </div>
            <div class="header-actions">
                <button class="btn btn-secondary" id="refreshBtn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                    Refresh
                </button>
                <button class="btn btn-primary" id="addMappingBtn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Add Mapping
                </button>
            </div>
        </div>

        <!-- Stats -->
        <div class="mapping-stats">
            <div class="stat-item">
                <span class="stat-value" id="totalMappings">0</span>
                <span class="stat-label">Total Mappings</span>
            </div>
            <div class="stat-item">
                <span class="stat-value" id="uniqueLocations">0</span>
                <span class="stat-label">Unique Locations</span>
            </div>
            <div class="stat-item">
                <span class="stat-value" id="uniqueMessages">0</span>
                <span class="stat-label">Message Codes</span>
            </div>
            <div class="stat-item">
                <span class="stat-value" id="linkedHelps">0</span>
                <span class="stat-label">Linked Resources</span>
            </div>
        </div>

        <!-- Filters -->
        <div class="filter-bar">
            <select class="filter-select" id="filterLocation">
                <option value="">All Locations</option>
            </select>
            <div class="filter-search">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input type="text" class="filter-input" id="searchInput" placeholder="Search mappings...">
            </div>
        </div>

        <!-- Mappings Grid -->
        <div class="mappings-container">
            <div class="mappings-grid" id="mappingsGrid">
                <div class="loading-state">Loading mappings...</div>
            </div>
        </div>
    </div>

    <!-- Add/Edit Mapping Modal -->
    <div class="modal-overlay" id="mappingModal">
        <div class="modal">
            <div class="modal-header">
                <h3 id="modalTitle">Add Mapping</h3>
                <button class="modal-close" onclick="closeModal('mappingModal')">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
            <div class="modal-body">
                <form id="mappingForm">
                    <input type="hidden" id="mappingId">
                    
                    <div class="form-group">
                        <label class="form-label" for="mappingLocation">Location</label>
                        <input type="text" class="form-input" id="mappingLocation" placeholder="e.g., Main Lobby" required>
                        <small class="form-hint">The physical location this code maps to</small>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="mappingMessage">Message Code</label>
                        <input type="text" class="form-input mono" id="mappingMessage" placeholder="e.g., 0x01 or FIRE_ALARM" required>
                        <small class="form-hint">The code received from devices</small>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Linked Help Resources</label>
                        <div class="help-selector" id="helpSelector">
                            <!-- Rendered by JS -->
                        </div>
                        <small class="form-hint">Select resources to respond to this message</small>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('mappingModal')">Cancel</button>
                <button class="btn btn-primary" id="saveMappingBtn">Save Mapping</button>
            </div>
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal-overlay" id="deleteModal">
        <div class="modal" style="max-width: 400px;">
            <div class="modal-header">
                <h3>Delete Mapping</h3>
                <button class="modal-close" onclick="closeModal('deleteModal')">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to delete the mapping for <strong id="deleteLocation"></strong>?</p>
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
