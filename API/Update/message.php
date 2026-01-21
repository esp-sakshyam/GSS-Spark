<?php
/**
 * LifeLine Message Update API
 * Updates an existing emergency message (primarily for status updates)
 * 
 * Usage:
 * PUT /API/Update/message.php
 * Body: { "MID": 1, "status": "acknowledged", "notes": "Rescue team dispatched" }
 */

require_once '../../database.php';

// Only accept PUT requests
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    sendResponse(false, null, 'Method not allowed', 405);
}

// Get input data
$input = getJSONInput();

// Validate required field
if (!isset($input['MID'])) {
    sendResponse(false, null, 'Message ID (MID) is required', 400);
}

$messageId = (int) $input['MID'];

try {
    $db = getDB();

    // Check if message exists
    $checkStmt = $db->prepare("SELECT MID FROM messages WHERE MID = :mid");
    $checkStmt->execute(['mid' => $messageId]);
    $existing = $checkStmt->fetch();

    if (!$existing) {
        sendResponse(false, null, 'Message not found', 404);
    }

    // Build update query dynamically
    $updates = [];
    $params = ['mid' => $messageId];

    // Updatable fields (simplified - only RSSI and message_code)
    $allowedFields = ['RSSI', 'message_code'];

    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            $updates[] = "$field = :$field";
            $params[$field] = (int) $input[$field];
        }
    }

    if (empty($updates)) {
        sendResponse(false, null, 'No fields to update', 400);
    }

    // Execute update
    $query = "UPDATE messages SET " . implode(', ', $updates) . " WHERE MID = :mid";
    $stmt = $db->prepare($query);
    $stmt->execute($params);

    // Fetch updated message with decoded data
    $fetchStmt = $db->prepare("
        SELECT m.*, 
               d.device_name, d.LID,
               JSON_UNQUOTE(JSON_EXTRACT(il.mapping, CONCAT('\$.', d.LID))) as location_name,
               JSON_UNQUOTE(JSON_EXTRACT(im.mapping, CONCAT('\$.', m.message_code))) as message_text
        FROM messages m
        JOIN devices d ON m.DID = d.DID
        LEFT JOIN indexes il ON il.type = 'location'
        LEFT JOIN indexes im ON im.type = 'message'
        WHERE m.MID = :mid
    ");
    $fetchStmt->execute(['mid' => $messageId]);
    $message = $fetchStmt->fetch();

    sendResponse(true, $message, 'Message updated successfully');

} catch (PDOException $e) {
    error_log('Message update error: ' . $e->getMessage());
    sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
}
?>