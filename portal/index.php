<?php
/**
 * LifeLine Emergency Response System - Control Portal
 * Main layout with navigation and iframe for page content
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
    <title>Control Portal | LifeLine</title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet">

    <!-- Styles -->
    <link rel="stylesheet" href="css/index.css">
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
            <a href="pages/dashboard.php" class="nav-item active" data-page="dashboard">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                </svg>
                <span>Dashboard</span>
            </a>
            <a href="pages/messages.php" class="nav-item" data-page="messages">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
                <span>Messages</span>
            </a>
            <a href="pages/devices.php" class="nav-item" data-page="devices">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
                <span>Devices</span>
            </a>
            <a href="pages/help.php" class="nav-item" data-page="help">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>Help Resources</span>
            </a>
            <a href="pages/index-map.php" class="nav-item" data-page="index-map">
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

    <!-- Mobile Menu Toggle -->
    <button class="menu-toggle" id="menuToggle">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
    </button>

    <!-- Main Content Area -->
    <main class="main-content">
        <div class="iframe-container">
            <div class="loading-overlay" id="loadingOverlay">
                <div class="loader"></div>
            </div>
            <iframe id="contentFrame" src="pages/dashboard.php" frameborder="0"></iframe>
        </div>
    </main>

    <!-- Toast Notification -->
    <div class="toast" id="toast">
        <span id="toastMessage"></span>
    </div>

    <script src="js/index.js"></script>
</body>

</html>