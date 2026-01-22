<?php
/**
 * LifeLine Email Receivers Delete API
 * Removes an email from the database
 */

require_once '../../database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    sendResponse(false, null, 'Method not allowed', 405);
}

$input = getJSONInput();

$missing = validateRequired($input, ['sn']);
if (!empty($missing)) {
    sendResponse(false, null, 'Missing required fields: ' . implode(', ', $missing), 400);
}

$sn = (int) $input['sn'];

try {
    $db = getDB();

    // Check if email exists
    $checkStmt = $db->prepare("SELECT sn FROM emails WHERE sn = :sn");
    $checkStmt->execute(['sn' => $sn]);

    if (!$checkStmt->fetch()) {
        sendResponse(false, null, 'Email not found', 404);
    }

    $stmt = $db->prepare("DELETE FROM emails WHERE sn = :sn");
    $stmt->execute(['sn' => $sn]);

    sendResponse(true, null, 'Email deleted successfully');

} catch (PDOException $e) {
    error_log('Email delete error: ' . $e->getMessage());
    sendResponse(false, null, 'Database error', 500);
}
?>