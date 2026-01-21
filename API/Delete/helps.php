<?php
/**
 * LifeLine Helps Delete API
 * Deletes a help resource from the database
 * 
 * Usage:
 * DELETE /API/Delete/helps.php?id=1
 */

require_once '../../database.php';

// Only accept DELETE requests
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    sendResponse(false, null, 'Method not allowed', 405);
}

// Get help ID
if (!isset($_GET['id'])) {
    sendResponse(false, null, 'Help ID is required', 400);
}

$helpId = (int) $_GET['id'];

try {
    $db = getDB();

    // Check if help resource exists
    $checkStmt = $db->prepare("SELECT HID, name FROM helps WHERE HID = :hid");
    $checkStmt->execute(['hid' => $helpId]);
    $help = $checkStmt->fetch();

    if (!$help) {
        sendResponse(false, null, 'Help resource not found', 404);
    }

    // Delete help resource
    $deleteStmt = $db->prepare("DELETE FROM helps WHERE HID = :hid");
    $deleteStmt->execute(['hid' => $helpId]);

    sendResponse(true, [
        'deleted_id' => $helpId,
        'name' => $help['name']
    ], 'Help resource deleted successfully');

} catch (PDOException $e) {
    error_log('Help delete error: ' . $e->getMessage());
    sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
}
?>