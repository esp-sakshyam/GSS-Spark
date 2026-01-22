<?php
/**
 * LifeLine Email Receivers Create API
 * Adds a new email to the database
 */

require_once '../../database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, null, 'Method not allowed', 405);
}

$input = getJSONInput();

$missing = validateRequired($input, ['email']);
if (!empty($missing)) {
    sendResponse(false, null, 'Missing required fields: ' . implode(', ', $missing), 400);
}

$email = trim($input['email']);

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendResponse(false, null, 'Invalid email format', 400);
}

try {
    $db = getDB();

    // Check if email already exists
    $checkStmt = $db->prepare("SELECT sn FROM emails WHERE email = :email");
    $checkStmt->execute(['email' => $email]);

    if ($checkStmt->fetch()) {
        sendResponse(false, null, 'Email already exists', 409);
    }

    $stmt = $db->prepare("INSERT INTO emails (email) VALUES (:email)");
    $stmt->execute(['email' => $email]);

    $sn = $db->lastInsertId();

    sendResponse(true, ['sn' => $sn, 'email' => $email], 'Email added successfully', 201);

} catch (PDOException $e) {
    error_log('Email create error: ' . $e->getMessage());
    sendResponse(false, null, 'Database error', 500);
}
?>