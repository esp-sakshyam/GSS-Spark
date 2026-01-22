<?php
/**
 * LifeLine Email Receivers Update API
 * Updates an existing email in the database
 */

require_once '../../database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'PATCH') {
    sendResponse(false, null, 'Method not allowed', 405);
}

$input = getJSONInput();

$missing = validateRequired($input, ['sn', 'email']);
if (!empty($missing)) {
    sendResponse(false, null, 'Missing required fields: ' . implode(', ', $missing), 400);
}

$sn = (int) $input['sn'];
$email = trim($input['email']);

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendResponse(false, null, 'Invalid email format', 400);
}

try {
    $db = getDB();

    // Check if email exists
    $checkStmt = $db->prepare("SELECT sn FROM emails WHERE sn = :sn");
    $checkStmt->execute(['sn' => $sn]);

    if (!$checkStmt->fetch()) {
        sendResponse(false, null, 'Email not found', 404);
    }

    // Check if new email is already used by another record
    $dupStmt = $db->prepare("SELECT sn FROM emails WHERE email = :email AND sn != :sn");
    $dupStmt->execute(['email' => $email, 'sn' => $sn]);

    if ($dupStmt->fetch()) {
        sendResponse(false, null, 'Email already exists', 409);
    }

    $stmt = $db->prepare("UPDATE emails SET email = :email WHERE sn = :sn");
    $stmt->execute(['email' => $email, 'sn' => $sn]);

    sendResponse(true, ['sn' => $sn, 'email' => $email], 'Email updated successfully');

} catch (PDOException $e) {
    error_log('Email update error: ' . $e->getMessage());
    sendResponse(false, null, 'Database error', 500);
}
?>