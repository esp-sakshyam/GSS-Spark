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

$messageId = (int)$input['MID'];

try {
    $db = getDB();
    
    // Check if message exists
    $checkStmt = $db->prepare("SELECT MID, status FROM messages WHERE MID = :mid");
    $checkStmt->execute(['mid' => $messageId]);
    $existing = $checkStmt->fetch();
    
    if (!$existing) {
        sendResponse(false, null, 'Message not found', 404);
    }
    
    // Build update query dynamically
    $updates = [];
    $params = ['mid' => $messageId];
    
    // Updatable fields
    $allowedFields = ['priority', 'status', 'notes'];
    
    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            // Validate priority
            if ($field === 'priority') {
                $validPriorities = ['low', 'medium', 'high', 'critical'];
                if (!in_array($input[$field], $validPriorities)) {
                    sendResponse(false, null, 'Invalid priority. Must be one of: ' . implode(', ', $validPriorities), 400);
                }
            }
            
            // Validate status
            if ($field === 'status') {
                $validStatuses = ['pending', 'acknowledged', 'resolved', 'escalated'];
                if (!in_array($input[$field], $validStatuses)) {
                    sendResponse(false, null, 'Invalid status. Must be one of: ' . implode(', ', $validStatuses), 400);
                }
                
                // Set resolved_at timestamp when status changes to resolved
                if ($input[$field] === 'resolved' && $existing['status'] !== 'resolved') {
                    $updates[] = "resolved_at = NOW()";
                }
            }
            
            $updates[] = "$field = :$field";
            $params[$field] = is_string($input[$field]) ? trim($input[$field]) : $input[$field];
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
