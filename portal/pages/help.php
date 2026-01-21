<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Help Resources - LifeLine Portal</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet">
    <link rel="stylesheet" href="../css/shared.css">
    <link rel="stylesheet" href="../css/help.css">
</head>

<body>
    <div class="page-container">
        <!-- Page Header -->
        <div class="page-header">
            <div class="header-content">
                <h1>Help Resources</h1>
                <p class="header-subtitle">Manage emergency responders and help resources</p>
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
                <button class="btn btn-primary" id="addHelpBtn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add Resource
                </button>
            </div>
        </div>

        <!-- Status Overview -->
        <div class="status-overview">
            <div class="status-card available">
                <div class="status-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                </div>
                <div class="status-info">
                    <div class="status-count" id="availableCount">0</div>
                    <div class="status-label">Available</div>
                </div>
            </div>
            <div class="status-card busy">
                <div class="status-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                </div>
                <div class="status-info">
                    <div class="status-count" id="busyCount">0</div>
                    <div class="status-label">Busy</div>
                </div>
            </div>
            <div class="status-card dispatched">
                <div class="status-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                    </svg>
                </div>
                <div class="status-info">
                    <div class="status-count" id="dispatchedCount">0</div>
                    <div class="status-label">Dispatched</div>
                </div>
            </div>
            <div class="status-card total">
                <div class="status-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                </div>
                <div class="status-info">
                    <div class="status-count" id="totalCount">0</div>
                    <div class="status-label">Total Resources</div>
                </div>
            </div>
        </div>

        <!-- Filters -->
        <div class="filter-bar">
            <select class="filter-select" id="filterStatus">
                <option value="">All Status</option>
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="dispatched">Dispatched</option>
            </select>
            <div class="filter-search">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input type="text" class="filter-input" id="searchInput" placeholder="Search resources...">
            </div>
        </div>

        <!-- Help Resources Table -->
        <div class="card">
            <div class="card-body" style="padding: 0;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width: 60px">ID</th>
                            <th>Name</th>
                            <th>Contact</th>
                            <th>ETA</th>
                            <th>Location</th>
                            <th>Status</th>
                            <th style="width: 120px">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="helpTableBody">
                        <tr>
                            <td colspan="7" class="loading-cell">Loading resources...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Add/Edit Help Modal -->
    <div class="modal-overlay" id="helpModal">
        <div class="modal">
            <div class="modal-header">
                <h3 id="modalTitle">Add Resource</h3>
                <button class="modal-close" onclick="closeModal('helpModal')">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <form id="helpForm">
                    <input type="hidden" id="helpId">

                    <div class="form-group">
                        <label class="form-label" for="helpName">Name</label>
                        <input type="text" class="form-input" id="helpName" placeholder="e.g., Fire Station Alpha"
                            required>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="helpContact">Contact Info</label>
                        <input type="text" class="form-input" id="helpContact" placeholder="e.g., +1 555-0123">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label" for="helpEta">ETA (minutes)</label>
                            <input type="number" class="form-input" id="helpEta" placeholder="e.g., 15" min="1">
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="helpStatus">Status</label>
                            <select class="form-select" id="helpStatus">
                                <option value="available">Available</option>
                                <option value="busy">Busy</option>
                                <option value="dispatched">Dispatched</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="helpLocation">Location / Area</label>
                        <input type="text" class="form-input" id="helpLocation" placeholder="e.g., North District">
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('helpModal')">Cancel</button>
                <button class="btn btn-primary" id="saveHelpBtn">Save Resource</button>
            </div>
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal-overlay" id="deleteModal">
        <div class="modal" style="max-width: 400px;">
            <div class="modal-header">
                <h3>Delete Resource</h3>
                <button class="modal-close" onclick="closeModal('deleteModal')">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to delete <strong id="deleteHelpName"></strong>?</p>
                <p class="text-muted">This action cannot be undone.</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('deleteModal')">Cancel</button>
                <button class="btn btn-danger" id="confirmDeleteBtn">Delete</button>
            </div>
        </div>
    </div>

    <!-- Dispatch Modal -->
    <div class="modal-overlay" id="dispatchModal">
        <div class="modal" style="max-width: 450px;">
            <div class="modal-header">
                <h3>Dispatch Resource</h3>
                <button class="modal-close" onclick="closeModal('dispatchModal')">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <p>Dispatch <strong id="dispatchHelpName"></strong> to respond?</p>
                <p class="text-muted">This will change their status to "dispatched".</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal('dispatchModal')">Cancel</button>
                <button class="btn btn-primary" id="confirmDispatchBtn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px">
                        <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                    </svg>
                    Dispatch Now
                </button>
            </div>
        </div>
    </div>

    <script src="../js/shared.js"></script>
    <script src="../js/help.js"></script>
</body>

</html>