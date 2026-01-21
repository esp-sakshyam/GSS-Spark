<?php
/**
 * LifeLine Device Create API
 * Creates a new device in the mesh network
 */

require_once '../../database.php';

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, null, 'Method not allowed', 405);
}

// Get input data
$input = getJSONInput();

// Validate required fields
$missing = validateRequired($input, ['LID']);
if (!empty($missing)) {
    sendResponse(false, null, 'Missing required fields: ' . implode(', ', $missing), 400);
}

// Extract and sanitize data
$deviceName = isset($input['device_name']) ? trim($input['device_name']) : null;
$lid = (int) $input['LID'];
$status = isset($input['status']) ? $input['status'] : 'active';

// Validate status
$validStatuses = ['active', 'inactive', 'maintenance'];
if (!in_array($status, $validStatuses)) {
    sendResponse(false, null, 'Invalid status. Must be one of: ' . implode(', ', $validStatuses), 400);
}

try {
    $db = getDB();

    // Insert new device
    $stmt = $db->prepare("
        INSERT INTO devices (device_name, LID, status, last_ping) 
        VALUES (:device_name, :lid, :status, NOW())
    ");

    $stmt->execute([
        'device_name' => $deviceName,
        'lid' => $lid,
        'status' => $status
    ]);

    $deviceId = $db->lastInsertId();

    // Fetch created device
    $fetchStmt = $db->prepare("SELECT * FROM devices WHERE DID = :did");
    $fetchStmt->execute(['did' => $deviceId]);
    $device = $fetchStmt->fetch();

    sendResponse(true, $device, 'Device created successfully', 201);

} catch (PDOException $e) {
    error_log('Device create error: ' . $e->getMessage());
    sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
}
?>