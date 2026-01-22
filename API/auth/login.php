<?php
/**
 * LifeLine Login API
 * Handles user authentication
 */

require_once '../../database.php';

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, null, 'Method not allowed', 405);
}

// Get input data
$input = getJSONInput();

// Validate required fields
$missing = validateRequired($input, ['email', 'password']);
if (!empty($missing)) {
    sendResponse(false, null, 'Missing required fields: ' . implode(', ', $missing), 400);
}

$email = trim($input['email']);
$password = $input['password'];
$remember = isset($input['remember']) ? $input['remember'] : false;

try {
    $db = getDB();

    // Find user by email
    $stmt = $db->prepare("SELECT UID, name, email, password, role FROM user WHERE email = :email LIMIT 1");
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch();

    if (!$user) {
        sendResponse(false, null, 'Invalid email or password', 401);
    }

    // Verify password
    if (!password_verify($password, $user['password'])) {
        sendResponse(false, null, 'Invalid email or password', 401);
    }

    // Update last login
    $updateStmt = $db->prepare("UPDATE user SET last_login = NOW() WHERE UID = :uid");
    $updateStmt->execute(['uid' => $user['UID']]);

    // Start session
    session_start();
    $_SESSION['user_id'] = $user['UID'];
    $_SESSION['user_name'] = $user['name'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['user_role'] = $user['role'];
    $_SESSION['logged_in'] = true;

    // Generate simple token for API use
    $token = bin2hex(random_bytes(32));
    $_SESSION['api_token'] = $token;

    // Set remember me cookie if requested
    if ($remember) {
        $expiry = time() + (30 * 24 * 60 * 60); // 30 days
        setcookie('lifeline_remember', $token, $expiry, '/', '', false, true);
    }

    sendResponse(true, [
        'user' => [
            'id' => $user['UID'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role']
        ],
        'token' => $token
    ], 'Login successful');

} catch (PDOException $e) {
    error_log('Login error: ' . $e->getMessage());
    sendResponse(false, null, 'Database error', 500);
}
?>