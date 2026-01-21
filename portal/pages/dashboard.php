<?php
/**
 * LifeLine Portal - Dashboard Page
 * Overview of system status with stats and recent activity
 */
session_start();
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    header('HTTP/1.1 401 Unauthorized');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet">
    <link rel="stylesheet" href="../css/shared.css">
    <link rel="stylesheet" href="../css/dashboard.css">
</head>

<body>
    <div class="page-container">
        <!-- Page Header -->
        <header class="page-header">
            <div class="header-content">
                <h1>Dashboard</h1>
                <p class="header-subtitle">System overview and recent activity</p>
            </div>
            <button class="btn btn-secondary" id="refreshBtn" title="Refresh">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                <span>Refresh</span>
            </button>
        </header>

        <!-- Stats Grid -->
        <section class="stats-grid">
            <div class="stat-card" data-stat="messages">
                <div class="stat-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                </div>
                <div class="stat-content">
                    <span class="stat-value" id="statMessages">-</span>
                    <span class="stat-label">Total Messages</span>
                </div>
            </div>
            <div class="stat-card" data-stat="devices">
                <div class="stat-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="4" y="4" width="16" height="16" rx="2" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                </div>
                <div class="stat-content">
                    <span class="stat-value" id="statDevices">-</span>
                    <span class="stat-label">Active Devices</span>
                </div>
            </div>
            <div class="stat-card" data-stat="helps">
                <div class="stat-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                    </svg>
                </div>
                <div class="stat-content">
                    <span class="stat-value" id="statHelps">-</span>
                    <span class="stat-label">Available Resources</span>
                </div>
            </div>
            <div class="stat-card" data-stat="locations">
                <div class="stat-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                    </svg>
                </div>
                <div class="stat-content">
                    <span class="stat-value" id="statLocations">-</span>
                    <span class="stat-label">Locations Covered</span>
                </div>
            </div>
        </section>

        <!-- Latest Alert Section (Prominent) -->
        <section class="latest-alert-section" id="latestAlert">
            <div class="alert-loading">
                <div class="spinner"></div>
                <p>Loading latest alert...</p>
            </div>
        </section>

        <!-- Dashboard Grid -->
        <section class="dashboard-grid">
            <!-- Recent Messages -->
            <div class="card">
                <div class="card-header">
                    <h3>Recent Emergency Messages</h3>
                    <button class="link-btn" onclick="parent.portalNav?.navigateTo('messages')">View All →</button>
                </div>
                <div class="card-body">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Location</th>
                                <th>Message</th>
                                <th>Device</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody id="recentMessagesTable">
                            <tr>
                                <td colspan="4" class="loading-cell">Loading...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Device Status -->
            <div class="card">
                <div class="card-header">
                    <h3>Device Status</h3>
                    <button class="link-btn" onclick="parent.portalNav?.navigateTo('devices')">View All →</button>
                </div>
                <div class="card-body">
                    <div class="device-list" id="deviceStatusList">
                        <div class="loading-cell">Loading...</div>
                    </div>
                </div>
            </div>
        </section>
    </div>

    <script src="../js/shared.js"></script>
    <script src="../js/dashboard.js"></script>
</body>

</html>