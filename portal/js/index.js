// LifeLine Portal - Main JavaScript

const API_BASE = '../API';
let pollInterval = null;

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('lifeline-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Sync theme to iframe
    syncThemeToIframe();
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('lifeline-theme', newTheme);

    // Sync theme to iframe
    syncThemeToIframe();
}

function syncThemeToIframe() {
    const iframe = document.getElementById('content-frame');
    if (iframe && iframe.contentDocument) {
        const theme = document.documentElement.getAttribute('data-theme');
        iframe.contentDocument.documentElement.setAttribute('data-theme', theme);
    }
}

// Navigation Management
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const iframe = document.getElementById('content-frame');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            // Update active state
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Load page in iframe
            const href = item.getAttribute('href');
            iframe.src = href;
        });
    });

    // Sync theme when iframe loads
    iframe.addEventListener('load', () => {
        syncThemeToIframe();
    });
}

// Connection Status
function updateConnectionStatus(connected, message = '') {
    const dot = document.getElementById('connection-dot');
    const text = document.getElementById('connection-text');

    if (connected) {
        dot.className = 'status-dot connected';
        text.textContent = message || 'Connected';
    } else {
        dot.className = 'status-dot error';
        text.textContent = message || 'Disconnected';
    }
}

// API Health Check
async function checkConnection() {
    try {
        const response = await fetch(`${API_BASE}/Read/index.php?type=location`);
        if (response.ok) {
            updateConnectionStatus(true, 'Connected');
            return true;
        } else {
            updateConnectionStatus(false, 'API Error');
            return false;
        }
    } catch (error) {
        updateConnectionStatus(false, 'Offline');
        return false;
    }
}

// Start polling for connection
function startConnectionPolling() {
    checkConnection();
    pollInterval = setInterval(checkConnection, 10000); // Check every 10 seconds
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavigation();
    startConnectionPolling();

    // Theme toggle button
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
});

// Expose functions for iframe communication
window.lifelinePortal = {
    toggleTheme,
    updateConnectionStatus,
    getTheme: () => document.documentElement.getAttribute('data-theme')
};
