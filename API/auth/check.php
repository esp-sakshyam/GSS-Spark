<?php
/**
 * LifeLine Session Check API
 * Verifies if user is authenticated
 */

require_once '../../database.php';

session_start();

// Check if user is logged in
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    sendResponse(false, null, 'Not authenticated', 401);
}

// Return user info
sendResponse(true, [
    'user' => [
        'id' => $_SESSION['user_id'],
        'name' => $_SESSION['user_name'],
        'email' => $_SESSION['user_email'],
        'role' => $_SESSION['user_role']
    ]
], 'Authenticated');
?>