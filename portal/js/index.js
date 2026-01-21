/**
 * LifeLine Portal - Main Navigation Controller
 * Handles navigation, iframe loading, and global state
 */

// API Base URL
const API_BASE = '../API';

// DOM Elements
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menuToggle');
const contentFrame = document.getElementById('contentFrame');
const loadingOverlay = document.getElementById('loadingOverlay');
const logoutBtn = document.getElementById('logoutBtn');
const navItems = document.querySelectorAll('.nav-item');

// Current active page
let currentPage = 'dashboard';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initMobileMenu();
    initLogout();
    initIframeListener();

    // Check URL hash for initial page
    const hash = window.location.hash.substring(1);
    if (hash) {
        navigateTo(hash);
    }
});

/**
 * Initialize navigation click handlers
 */
function initNavigation() {
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            if (page) {
                navigateTo(page);
                // Close mobile menu
                if (window.innerWidth <= 768) {
                    closeMobileMenu();
                }
            }
        });
    });
}

/**
 * Navigate to a page
 */
function navigateTo(page) {
    if (page === currentPage) return;

    // Update active state
    navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });

    // Show loading
    showLoading();

    // Update iframe src
    const pagePath = `pages/${page}.php`;
    contentFrame.src = pagePath;

    // Update URL hash
    window.location.hash = page;

    currentPage = page;
}

/**
 * Initialize iframe load listener
 */
function initIframeListener() {
    contentFrame.addEventListener('load', () => {
        hideLoading();

        // Sync page title
        try {
            const iframeTitle = contentFrame.contentDocument?.title;
            if (iframeTitle) {
                document.title = `${iframeTitle} | LifeLine`;
            }
        } catch (e) {
            // Cross-origin restriction - ignore
        }
    });

    // Initial load complete
    contentFrame.addEventListener('load', hideLoading, { once: true });
}

/**
 * Initialize mobile menu
 */
function initMobileMenu() {
    menuToggle?.addEventListener('click', toggleMobileMenu);

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 &&
            sidebar.classList.contains('open') &&
            !sidebar.contains(e.target) &&
            !menuToggle.contains(e.target)) {
            closeMobileMenu();
        }
    });
}

function toggleMobileMenu() {
    sidebar.classList.toggle('open');
    menuToggle.classList.toggle('active');
}

function closeMobileMenu() {
    sidebar.classList.remove('open');
    menuToggle.classList.remove('active');
}

/**
 * Initialize logout
 */
function initLogout() {
    logoutBtn?.addEventListener('click', async () => {
        try {
            await fetch(`${API_BASE}/auth/logout.php`);
            window.location.href = '../login.php';
        } catch (error) {
            window.location.href = '../login.php';
        }
    });
}

/**
 * Loading state management
 */
function showLoading() {
    loadingOverlay.classList.add('visible');
}

function hideLoading() {
    loadingOverlay.classList.remove('visible');
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    toastMessage.textContent = message;
    toast.className = `toast visible ${type}`;

    setTimeout(() => {
        toast.classList.remove('visible');
    }, 3000);
}

/**
 * Refresh current page in iframe
 */
function refreshCurrentPage() {
    showLoading();
    contentFrame.contentWindow.location.reload();
}

// Expose functions globally for iframe communication
window.portalNav = {
    navigateTo,
    showToast,
    refreshCurrentPage,
    showLoading,
    hideLoading
};
