<?php
/**
 * LifeLine FCM Token Registration API
 * Saves or updates FCM tokens for push notifications
 */

require_once '../../database.php';

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, null, 'Method not allowed', 405);
}

// Get input data
$input = getJSONInput();

// Validate required fields
$missing = validateRequired($input, ['token']);
if (!empty($missing)) {
    sendResponse(false, null, 'Missing required fields: ' . implode(', ', $missing), 400);
}

$token = trim($input['token']);
$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;
$userId = isset($input['user_id']) ? (int) $input['user_id'] : null;

if (empty($token)) {
    sendResponse(false, null, 'Token cannot be empty', 400);
}

try {
    $db = getDB();

    // Check if token already exists
    $checkStmt = $db->prepare("SELECT id, active FROM fcm_tokens WHERE token = :token");
    $checkStmt->execute(['token' => $token]);
    $existing = $checkStmt->fetch();

    if ($existing) {
        // Update existing token (reactivate if it was deactivated)
        $updateStmt = $db->prepare("
            UPDATE fcm_tokens 
            SET active = 1, 
                user_agent = :user_agent, 
                user_id = :user_id,
                updated_at = NOW() 
            WHERE token = :token
        ");
        $updateStmt->execute([
            'token' => $token,
            'user_agent' => $userAgent,
            'user_id' => $userId
        ]);

        sendResponse(true, ['id' => $existing['id'], 'action' => 'updated'], 'Token updated successfully');
    } else {
        // Insert new token
        $insertStmt = $db->prepare("
            INSERT INTO fcm_tokens (token, user_agent, user_id, active, created_at) 
            VALUES (:token, :user_agent, :user_id, 1, NOW())
        ");
        $insertStmt->execute([
            'token' => $token,
            'user_agent' => $userAgent,
            'user_id' => $userId
        ]);

        $tokenId = $db->lastInsertId();
        sendResponse(true, ['id' => $tokenId, 'action' => 'created'], 'Token registered successfully', 201);
    }

} catch (PDOException $e) {
    error_log('FCM token registration error: ' . $e->getMessage());
    sendResponse(false, null, 'Database error', 500);
}
?>