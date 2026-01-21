<?php
/**
 * LifeLine Message Create API
 * Creates a new emergency message
 * This is typically called by the LoRa gateway when receiving alerts
 */

require_once '../../database.php';

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, null, 'Method not allowed', 405);
}

// Get input data
$input = getJSONInput();

// Validate required fields
$missing = validateRequired($input, ['DID', 'message_code']);
if (!empty($missing)) {
    sendResponse(false, null, 'Missing required fields: ' . implode(', ', $missing), 400);
}

// Extract and sanitize data
$did = (int) $input['DID'];
$rssi = isset($input['RSSI']) ? (int) $input['RSSI'] : null;
$messageCode = (int) $input['message_code'];
$priority = isset($input['priority']) ? $input['priority'] : 'medium';
$status = isset($input['status']) ? $input['status'] : 'pending';
$notes = isset($input['notes']) ? trim($input['notes']) : null;

// Validate priority
$validPriorities = ['low', 'medium', 'high', 'critical'];
if (!in_array($priority, $validPriorities)) {
    sendResponse(false, null, 'Invalid priority. Must be one of: ' . implode(', ', $validPriorities), 400);
}

// Validate status
$validStatuses = ['pending', 'acknowledged', 'resolved', 'escalated'];
if (!in_array($status, $validStatuses)) {
    sendResponse(false, null, 'Invalid status. Must be one of: ' . implode(', ', $validStatuses), 400);
}

try {
    $db = getDB();

    // Verify device exists
    $deviceStmt = $db->prepare("SELECT DID FROM devices WHERE DID = :did");
    $deviceStmt->execute(['did' => $did]);

    if (!$deviceStmt->fetch()) {
        sendResponse(false, null, 'Device not found', 404);
    }

    // Auto-determine priority based on message code if not specified
    // Critical messages (codes 1-5): altitude sickness, injury, illness, SAR, avalanche
    $criticalCodes = [1, 2, 4, 5];
    $highCodes = [3, 6, 7, 8, 9];

    if (!isset($input['priority'])) {
        if (in_array($messageCode, $criticalCodes)) {
            $priority = 'critical';
        } elseif (in_array($messageCode, $highCodes)) {
            $priority = 'high';
        }
    }

    // Insert new message
    $stmt = $db->prepare("
        INSERT INTO messages (DID, RSSI, message_code, priority, status, notes, timestamp) 
        VALUES (:did, :rssi, :message_code, :priority, :status, :notes, NOW())
    ");

    $stmt->execute([
        'did' => $did,
        'rssi' => $rssi,
        'message_code' => $messageCode,
        'priority' => $priority,
        'status' => $status,
        'notes' => $notes
    ]);

    $messageId = $db->lastInsertId();

    // Update device last_ping
    $updateDeviceStmt = $db->prepare("UPDATE devices SET last_ping = NOW() WHERE DID = :did");
    $updateDeviceStmt->execute(['did' => $did]);

    // Fetch created message with expanded data
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

    sendResponse(true, $message, 'Emergency message created successfully', 201);

} catch (PDOException $e) {
    error_log('Message create error: ' . $e->getMessage());
    sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
}
?>