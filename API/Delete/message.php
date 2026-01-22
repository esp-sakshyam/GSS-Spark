<?php
/**
 * LifeLine Message Delete API
 * Deletes a message from the database
 * Note: This should typically only be used for cleaning up test data
 * In production, messages should be archived rather than deleted
 * 
 * Usage:
 * DELETE /API/Delete/message.php?id=1
 */

require_once '../../database.php';

// Only accept DELETE requests
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    sendResponse(false, null, 'Method not allowed', 405);
}

// Get message ID
if (!isset($_GET['id'])) {
    sendResponse(false, null, 'Message ID is required', 400);
}

$messageId = (int) $_GET['id'];

try {
    $db = getDB();

    // Check if message exists and get its details for logging
    $checkStmt = $db->prepare("
        SELECT m.MID, m.message_code, m.status, d.device_name 
        FROM messages m 
        JOIN devices d ON m.DID = d.DID 
        WHERE m.MID = :mid
    ");
    $checkStmt->execute(['mid' => $messageId]);
    $message = $checkStmt->fetch();

    if (!$message) {
        sendResponse(false, null, 'Message not found', 404);
    }

    // Warn if deleting non-resolved message
    if ($message['status'] !== 'resolved') {
        // Still allow deletion but include warning
        $warning = 'Warning: Deleting a message that is not resolved';
    }

    // Delete message
    $deleteStmt = $db->prepare("DELETE FROM messages WHERE MID = :mid");
    $deleteStmt->execute(['mid' => $messageId]);

    $response = [
        'deleted_id' => $messageId,
        'device_name' => $message['device_name'],
        'message_code' => $message['message_code']
    ];

    if (isset($warning)) {
        $response['warning'] = $warning;
    }

    sendResponse(true, $response, 'Message deleted successfully');

} catch (PDOException $e) {
    error_log('Message delete error: ' . $e->getMessage());
    sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
}
?>