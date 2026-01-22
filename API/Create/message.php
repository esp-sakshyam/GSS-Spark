<?php
/**
 * LifeLine Message Create API
 * Creates a new emergency message
 * This is typically called by the LoRa gateway when receiving alerts
 */

require_once '../../database.php';
require_once '../../vendor/autoload.php';
require_once '../fcm_helper.php';
require_once '../email_helper.php';

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

try {
    $db = getDB();

    // Verify device exists
    $deviceStmt = $db->prepare("SELECT DID FROM devices WHERE DID = :did");
    $deviceStmt->execute(['did' => $did]);

    if (!$deviceStmt->fetch()) {
        sendResponse(false, null, 'Device not found', 404);
    }

    // Insert new message
    $stmt = $db->prepare("
        INSERT INTO messages (DID, RSSI, message_code, timestamp) 
        VALUES (:did, :rssi, :message_code, NOW())
    ");

    $stmt->execute([
        'did' => $did,
        'rssi' => $rssi,
        'message_code' => $messageCode
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

    // Send push notifications to all registered devices
    try {
        $fcm = new FCMHelper();
        if ($fcm->isConfigured()) {
            $notificationResult = $fcm->sendEmergencyNotification(
                $db,
                $message['device_name'] ?? null,
                $message['location_name'] ?? 'Unknown Location',
                $message['message_text'] ?? 'Emergency Alert',
                $messageId
            );

            $message['notification_sent'] = true;
            $message['notifications'] = [
                'success' => $notificationResult['success'] ?? 0,
                'failure' => $notificationResult['failure'] ?? 0
            ];
        } else {
            $message['notification_sent'] = false;
            $message['notification_error'] = 'FCM not configured';
        }
    } catch (Exception $e) {
        error_log('FCM notification error: ' . $e->getMessage());
        $message['notification_sent'] = false;
        $message['notification_error'] = $e->getMessage();
    }

    // Send email notifications to all registered email addresses
    try {
        $emailHelper = new EmailHelper();
        $emailResult = $emailHelper->sendEmergencyEmail(
            $db,
            $message['device_name'] ?? null,
            $message['location_name'] ?? 'Unknown Location',
            $message['message_text'] ?? 'Emergency Alert',
            $messageId,
            $message['timestamp'] ?? null
        );

        $message['email_sent'] = true;
        $message['emails'] = [
            'success' => $emailResult['success'] ?? 0,
            'failure' => $emailResult['failure'] ?? 0
        ];
    } catch (Exception $e) {
        error_log('Email notification error: ' . $e->getMessage());
        $message['email_sent'] = false;
        $message['email_error'] = $e->getMessage();
    }

    sendResponse(true, $message, 'Emergency message created successfully', 201);

} catch (PDOException $e) {
    error_log('Message create error: ' . $e->getMessage());
    sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
}
?>