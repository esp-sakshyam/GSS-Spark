<?php
/**
 * LifeLine Device Delete API
 * Deletes a device from the database
 * 
 * Usage:
 * DELETE /API/Delete/device.php?id=1
 */

require_once '../../database.php';

// Only accept DELETE requests
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    sendResponse(false, null, 'Method not allowed', 405);
}

// Get device ID
if (!isset($_GET['id'])) {
    sendResponse(false, null, 'Device ID is required', 400);
}

$deviceId = (int) $_GET['id'];

try {
    $db = getDB();

    // Check if device exists
    $checkStmt = $db->prepare("SELECT DID, device_name FROM devices WHERE DID = :did");
    $checkStmt->execute(['did' => $deviceId]);
    $device = $checkStmt->fetch();

    if (!$device) {
        sendResponse(false, null, 'Device not found', 404);
    }

    // Delete device (messages will cascade delete due to FK constraint)
    $deleteStmt = $db->prepare("DELETE FROM devices WHERE DID = :did");
    $deleteStmt->execute(['did' => $deviceId]);

    sendResponse(true, [
        'deleted_id' => $deviceId,
        'device_name' => $device['device_name']
    ], 'Device deleted successfully');

} catch (PDOException $e) {
    error_log('Device delete error: ' . $e->getMessage());
    sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
}
?>