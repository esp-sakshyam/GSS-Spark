<?php
/**
 * LifeLine Logout API
 * Handles user session termination
 */

require_once '../../database.php';

session_start();

// Clear session data
$_SESSION = [];

// Destroy session cookie
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 42000,
        $params["path"],
        $params["domain"],
        $params["secure"],
        $params["httponly"]
    );
}

// Destroy session
session_destroy();

// Clear remember me cookie
if (isset($_COOKIE['lifeline_remember'])) {
    setcookie('lifeline_remember', '', time() - 3600, '/');
}

sendResponse(true, null, 'Logged out successfully');
?>