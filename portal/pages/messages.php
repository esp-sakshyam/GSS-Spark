<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Messages - LifeLine Portal</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet">
    <link rel="stylesheet" href="../css/shared.css">
    <link rel="stylesheet" href="../css/messages.css">
</head>

<body>
    <div class="page-container">
        <!-- Page Header -->
        <div class="page-header">
            <div class="header-content">
                <h1>Messages</h1>
                <p class="header-subtitle">View and manage all received messages from devices</p>
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
            </div>
        </div>

        <!-- Filters -->
        <div class="filter-bar">
            <select class="filter-select" id="filterDevice">
                <option value="">All Devices</option>
            </select>
            <select class="filter-select" id="filterCode">
                <option value="">All Message Codes</option>
            </select>
            <select class="filter-select" id="filterTime">
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
            </select>
            <div class="filter-search">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input type="text" class="filter-input" id="searchInput" placeholder="Search messages...">
            </div>
        </div>

        <!-- Messages Table -->
        <div class="card">
            <div class="card-body" style="padding: 0;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width: 60px">ID</th>
                            <th>Device</th>
                            <th>Message Code</th>
                            <th>Decoded Message</th>
                            <th>RSSI</th>
                            <th>Timestamp</th>
                            <th style="width: 100px">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="messagesTableBody">
                        <tr>
                            <td colspan="7" class="loading-cell">Loading messages...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Pagination -->
        <div class="pagination" id="pagination">
            <!-- Rendered by JS -->
        </div>
    </div>

    <!-- View Message Modal -->
    <div class="modal-overlay" id="viewMessageModal">
        <div class="modal">
            <div class="modal-header">
                <h3>Message Details</h3>
                <button class="modal-close" onclick="closeModal('viewMessageModal')">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="modal-body" id="messageDetails">
                <!-- Rendered by JS -->
            </div>
        </div>
    </div>

    <script src="../js/shared.js"></script>
    <script src="../js/messages.js"></script>
</body>

</html>