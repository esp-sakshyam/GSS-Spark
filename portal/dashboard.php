<!DOCTYPE html>
<html lang="en" data-theme="dark">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - LifeLine</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://site-assets.fontawesome.com/releases/v7.1.0/css/all.css">
    <link rel="stylesheet" href="css/shared.css">
    <link rel="stylesheet" href="css/dashboard.css">
</head>

<body>
    <!-- Header -->
    <div class="header">
        <h1><i class="fa-solid fa-grid-2"></i> Dashboard</h1>
        <div class="live-indicator">
            <div class="pulse-dot" id="live-dot"></div>
            <span class="live-text" id="live-text">Listening...</span>
        </div>
    </div>

    <!-- Stats Overview -->
    <section class="stats-grid">
        <div class="stat-card">
            <div class="stat-card-icon"><i class="fa-solid fa-microchip"></i></div>
            <div class="stat-content">
                <div class="stat-label">Total Devices</div>
                <div class="stat-value" id="stat-total">-</div>
                <div class="stat-sub" id="stat-total-sub">Loading...</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-card-icon success"><i class="fa-solid fa-signal-bars"></i></div>
            <div class="stat-content">
                <div class="stat-label">Active Devices</div>
                <div class="stat-value success" id="stat-active">-</div>
                <div class="stat-sub" id="stat-active-sub">Online now</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-card-icon warning"><i class="fa-solid fa-signal-bars-slash"></i></div>
            <div class="stat-content">
                <div class="stat-label">Offline Devices</div>
                <div class="stat-value warning" id="stat-offline">-</div>
                <div class="stat-sub" id="stat-offline-sub">Needs attention</div>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-card-icon danger"><i class="fa-solid fa-bell"></i></div>
            <div class="stat-content">
                <div class="stat-label">Active Alerts</div>
                <div class="stat-value" id="stat-alerts">-</div>
                <div class="stat-sub" id="stat-alerts-sub">Pending review</div>
            </div>
        </div>
    </section>

    <!-- Main Content Grid -->
    <div class="dashboard-grid">
        <!-- Alerts Section -->
        <section class="alerts-section">
            <div class="section-header">
                <span class="section-title"><i class="fa-solid fa-bell"></i> Emergency Alerts</span>
                <span class="badge" id="alert-count"><i class="fa-solid fa-circle-check"></i> 0 Active</span>
            </div>
            <div class="alerts-container" id="alerts-container">
                <div class="loading">
                    <span class="spinner"></span>
                    Loading alerts...
                </div>
            </div>
        </section>

        <!-- Device Status Section -->
        <section class="activity-section">
            <div class="section-header">
                <span class="section-title"><i class="fa-solid fa-tower-broadcast"></i> Device Status</span>
                <span class="badge neutral" id="device-count"><i class="fa-solid fa-microchip"></i> 0 Devices</span>
            </div>
            <div class="activity-list" id="device-list">
                <div class="loading">
                    <span class="spinner"></span>
                    Loading devices...
                </div>
            </div>
        </section>
    </div>

    <!-- Alert Detail Modal -->
    <div class="modal-overlay" id="alert-modal">
        <div class="modal modal-lg">
            <div class="modal-header">
                <span class="modal-title" id="modal-alert-title">
                    <i class="fa-solid fa-bell"></i> Alert Details
                </span>
                <button class="modal-close" onclick="closeAlertModal()"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body" id="modal-alert-body">
                <!-- Alert details will be inserted here -->
            </div>
            <div class="modal-footer">
                <button class="btn" onclick="closeAlertModal()"><i class="fa-solid fa-xmark"></i> Close</button>
                <button class="btn btn-success" onclick="resolveAlert(currentAlert?.MID)">
                    <i class="fa-solid fa-circle-check"></i> Mark Resolved
                </button>
                <button class="btn btn-primary" id="btn-open-maps" onclick="openCurrentInMaps()">
                    <i class="fa-solid fa-map-location-dot"></i> Open in Google Maps
                </button>
            </div>
        </div>
    </div>

    <script src="js/dashboard.js"></script>
</body>

</html>