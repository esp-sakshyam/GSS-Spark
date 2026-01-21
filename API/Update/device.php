<?php
/**
 * LifeLine Device Update API
 * Updates an existing device
 * 
 * Usage:
 * PUT /API/Update/device.php
 * Body: { "DID": 1, "status": "inactive", ... }
 */

require_once '../../database.php';

// Only accept PUT requests
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    sendResponse(false, null, 'Method not allowed', 405);
}

// Get input data
$input = getJSONInput();

// Validate required field
if (!isset($input['DID'])) {
    sendResponse(false, null, 'Device ID (DID) is required', 400);
}

$deviceId = (int) $input['DID'];

try {
    $db = getDB();

    // Check if device exists
    $checkStmt = $db->prepare("SELECT DID FROM devices WHERE DID = :did");
    $checkStmt->execute(['did' => $deviceId]);

    if (!$checkStmt->fetch()) {
        sendResponse(false, null, 'Device not found', 404);
    }

    // Build update query dynamically
    $updates = [];
    $params = ['did' => $deviceId];

    // Updatable fields
    $allowedFields = ['device_name', 'LID', 'status', 'last_ping'];

    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            // Validate status
            if ($field === 'status') {
                $validStatuses = ['active', 'inactive', 'maintenance'];
                if (!in_array($input[$field], $validStatuses)) {
                    sendResponse(false, null, 'Invalid status. Must be one of: ' . implode(', ', $validStatuses), 400);
                }
            }

            $updates[] = "$field = :$field";
            $params[$field] = $input[$field];
        }
    }

    if (empty($updates)) {
        sendResponse(false, null, 'No fields to update', 400);
    }

    // Execute update
    $query = "UPDATE devices SET " . implode(', ', $updates) . " WHERE DID = :did";
    $stmt = $db->prepare($query);
    $stmt->execute($params);

    // Fetch updated device
    $fetchStmt = $db->prepare("
        SELECT d.*, 
               JSON_UNQUOTE(JSON_EXTRACT(i.mapping, CONCAT('\$.', d.LID))) as location_name
        FROM devices d
        LEFT JOIN indexes i ON i.type = 'location'
        WHERE d.DID = :did
    ");
    $fetchStmt->execute(['did' => $deviceId]);
    $device = $fetchStmt->fetch();

    sendResponse(true, $device, 'Device updated successfully');

} catch (PDOException $e) {
    error_log('Device update error: ' . $e->getMessage());
    sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
}
?>