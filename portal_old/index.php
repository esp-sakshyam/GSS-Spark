<?php
/**
 * LifeLine Emergency Response System - Control Portal
 * Dashboard for managing devices, messages, helps, and indexes
 */

session_start();

// Check if user is logged in
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    header('Location: ../login.php');
    exit;
}

$userName = $_SESSION['user_name'] ?? 'User';
$userRole = $_SESSION['user_role'] ?? 'operator';
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Control Portal | LifeLine Emergency Response System</title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet">

    <!-- Styles -->
    <link rel="stylesheet" href="portal.css">
</head>

<body>
    <!-- Sidebar Navigation -->
    <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
            <a href="../index.html" class="logo">
                <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                    <circle cx="20" cy="20" r="18" stroke="currentColor" stroke-width="2" />
                    <circle cx="20" cy="20" r="8" fill="currentColor" />
                    <path d="M20 2 L20 8 M20 32 L20 38 M2 20 L8 20 M32 20 L38 20" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" />
                </svg>
                <span>LifeLine</span>
            </a>
        </div>

        <nav class="sidebar-nav">
            <a href="#dashboard" class="nav-item active" data-section="dashboard">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                </svg>
                <span>Dashboard</span>
            </a>
            <a href="#messages" class="nav-item" data-section="messages">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
                <span>Messages</span>
            </a>
            <a href="#devices" class="nav-item" data-section="devices">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
                <span>Devices</span>
            </a>
            <a href="#helps" class="nav-item" data-section="helps">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>Help Resources</span>
            </a>
            <a href="#indexes" class="nav-item" data-section="indexes">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="4 7 4 4 20 4 20 7" />
                    <line x1="9" y1="20" x2="15" y2="20" />
                    <line x1="12" y1="4" x2="12" y2="20" />
                </svg>
                <span>Index Mappings</span>
            </a>
        </nav>

        <div class="sidebar-footer">
            <div class="user-info">
                <div class="user-avatar">
                    <?php echo strtoupper(substr($userName, 0, 1)); ?>
                </div>
                <div class="user-details">
                    <span class="user-name"><?php echo htmlspecialchars($userName); ?></span>
                    <span class="user-role"><?php echo ucfirst($userRole); ?></span>
                </div>
            </div>
            <button class="logout-btn" id="logoutBtn" title="Logout">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
            </button>
        </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
        <!-- Header -->
        <header class="header">
            <button class="menu-toggle" id="menuToggle">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
            </button>
            <h1 class="page-title" id="pageTitle">Dashboard</h1>
            <div class="header-actions">
                <button class="refresh-btn" id="refreshBtn" title="Refresh Data">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="23 4 23 10 17 10" />
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>
                </button>
            </div>
        </header>

        <!-- Dashboard Section -->
        <section class="content-section active" id="dashboardSection">
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon messages">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                        </svg>
                    </div>
                    <div class="stat-content">
                        <span class="stat-value" id="statMessages">0</span>
                        <span class="stat-label">Total Messages</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon devices">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="4" y="4" width="16" height="16" rx="2" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                    </div>
                    <div class="stat-content">
                        <span class="stat-value" id="statDevices">0</span>
                        <span class="stat-label">Active Devices</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon helps">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                        </svg>
                    </div>
                    <div class="stat-content">
                        <span class="stat-value" id="statHelps">0</span>
                        <span class="stat-label">Available Resources</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon locations">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                        </svg>
                    </div>
                    <div class="stat-content">
                        <span class="stat-value" id="statLocations">0</span>
                        <span class="stat-label">Locations Covered</span>
                    </div>
                </div>
            </div>

            <div class="dashboard-grid">
                <div class="card recent-messages">
                    <div class="card-header">
                        <h3>Recent Emergency Messages</h3>
                        <a href="#messages" class="view-all" data-section="messages">View All</a>
                    </div>
                    <div class="card-body">
                        <div class="table-container">
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
                                        <td colspan="4" class="loading">Loading...</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="card device-status">
                    <div class="card-header">
                        <h3>Device Status Overview</h3>
                        <a href="#devices" class="view-all" data-section="devices">View All</a>
                    </div>
                    <div class="card-body">
                        <div class="device-status-list" id="deviceStatusList">
                            <div class="loading">Loading...</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Messages Section -->
        <section class="content-section" id="messagesSection">
            <div class="section-header">
                <div class="filters">
                    <select id="messageCodeFilter" class="filter-select">
                        <option value="">All Message Types</option>
                    </select>
                </div>
                <button class="btn btn-primary" id="createMessageBtn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    New Message
                </button>
            </div>

            <div class="card">
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Device</th>
                                <th>Location</th>
                                <th>Message</th>
                                <th>RSSI</th>
                                <th>Time</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="messagesTable">
                            <tr>
                                <td colspan="7" class="loading">Loading...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>

        <!-- Devices Section -->
        <section class="content-section" id="devicesSection">
            <div class="section-header">
                <div class="filters">
                    <select id="deviceStatusFilter" class="filter-select">
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="maintenance">Maintenance</option>
                    </select>
                </div>
                <button class="btn btn-primary" id="createDeviceBtn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Device
                </button>
            </div>

            <div class="card">
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Device Name</th>
                                <th>Location</th>
                                <th>Status</th>
                                <th>Last Ping</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="devicesTable">
                            <tr>
                                <td colspan="6" class="loading">Loading...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>

        <!-- Helps Section -->
        <section class="content-section" id="helpsSection">
            <div class="section-header">
                <div class="filters">
                    <select id="helpStatusFilter" class="filter-select">
                        <option value="">All Statuses</option>
                        <option value="available">Available</option>
                        <option value="dispatched">Dispatched</option>
                        <option value="busy">Busy</option>
                    </select>
                </div>
                <button class="btn btn-primary" id="createHelpBtn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Resource
                </button>
            </div>

            <div class="card">
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Contact</th>
                                <th>Location</th>
                                <th>ETA</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="helpsTable">
                            <tr>
                                <td colspan="7" class="loading">Loading...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>

        <!-- Indexes Section -->
        <section class="content-section" id="indexesSection">
            <div class="section-header">
                <div class="filters">
                    <select id="indexTypeFilter" class="filter-select">
                        <option value="">All Types</option>
                        <option value="location">Location</option>
                        <option value="message">Message</option>
                        <option value="help">Help</option>
                    </select>
                </div>
            </div>

            <div class="indexes-grid" id="indexesGrid">
                <div class="loading">Loading...</div>
            </div>
        </section>
    </main>

    <!-- Modal -->
    <div class="modal-overlay" id="modalOverlay">
        <div class="modal" id="modal">
            <div class="modal-header">
                <h3 id="modalTitle">Modal Title</h3>
                <button class="modal-close" id="modalClose">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>
            <div class="modal-body" id="modalBody">
                <!-- Dynamic content -->
            </div>
            <div class="modal-footer" id="modalFooter">
                <button class="btn btn-secondary" id="modalCancel">Cancel</button>
                <button class="btn btn-primary" id="modalSubmit">Save</button>
            </div>
        </div>
    </div>

    <!-- Toast Notification -->
    <div class="toast" id="toast">
        <span class="toast-message" id="toastMessage"></span>
    </div>

    <!-- JavaScript -->
    <script src="portal.js"></script>
</body>

</html>