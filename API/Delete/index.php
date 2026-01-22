<?php
/**
 * LifeLine Index Delete API
 * Deletes an index mapping from the database
 * 
 * WARNING: Deleting an index mapping will break message/location decoding
 * This should only be used with extreme caution
 * 
 * Usage:
 * DELETE /API/Delete/index.php?id=1
 * DELETE /API/Delete/index.php?type=location
 */

require_once '../../database.php';

// Only accept DELETE requests
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    sendResponse(false, null, 'Method not allowed', 405);
}

// Get index identifier
if (!isset($_GET['id']) && !isset($_GET['type'])) {
    sendResponse(false, null, 'Index ID or type is required', 400);
}

try {
    $db = getDB();

    // Find the index
    if (isset($_GET['id'])) {
        $checkStmt = $db->prepare("SELECT IID, type, description FROM indexes WHERE IID = :iid");
        $checkStmt->execute(['iid' => (int) $_GET['id']]);
    } else {
        $checkStmt = $db->prepare("SELECT IID, type, description FROM indexes WHERE type = :type");
        $checkStmt->execute(['type' => $_GET['type']]);
    }

    $index = $checkStmt->fetch();

    if (!$index) {
        sendResponse(false, null, 'Index mapping not found', 404);
    }

    // Delete index
    $deleteStmt = $db->prepare("DELETE FROM indexes WHERE IID = :iid");
    $deleteStmt->execute(['iid' => $index['IID']]);

    sendResponse(true, [
        'deleted_id' => $index['IID'],
        'type' => $index['type'],
        'warning' => 'Index mapping deleted. Any messages/devices using this mapping will no longer decode properly.'
    ], 'Index mapping deleted successfully');

} catch (PDOException $e) {
    error_log('Index delete error: ' . $e->getMessage());
    sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
}
?>