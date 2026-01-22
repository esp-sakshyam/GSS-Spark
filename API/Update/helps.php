<?php
/**
 * LifeLine Helps Update API
 * Updates an existing help resource
 * 
 * Usage:
 * PUT /API/Update/helps.php
 * Body: { "HID": 1, "status": "dispatched", ... }
 */

require_once '../../database.php';

// Only accept PUT requests
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    sendResponse(false, null, 'Method not allowed', 405);
}

// Get input data
$input = getJSONInput();

// Validate required field
if (!isset($input['HID'])) {
    sendResponse(false, null, 'Help ID (HID) is required', 400);
}

$helpId = (int) $input['HID'];

try {
    $db = getDB();

    // Check if help resource exists
    $checkStmt = $db->prepare("SELECT HID FROM helps WHERE HID = :hid");
    $checkStmt->execute(['hid' => $helpId]);

    if (!$checkStmt->fetch()) {
        sendResponse(false, null, 'Help resource not found', 404);
    }

    // Build update query dynamically
    $updates = [];
    $params = ['hid' => $helpId];

    // Updatable fields
    $allowedFields = ['name', 'contact', 'eta', 'status', 'location'];

    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            // Validate status
            if ($field === 'status') {
                $validStatuses = ['available', 'dispatched', 'busy'];
                if (!in_array($input[$field], $validStatuses)) {
                    sendResponse(false, null, 'Invalid status. Must be one of: ' . implode(', ', $validStatuses), 400);
                }
            }

            $updates[] = "$field = :$field";
            $params[$field] = trim($input[$field]);
        }
    }

    // Handle for_messages array separately
    if (isset($input['for_messages'])) {
        $forMessages = $input['for_messages'];
        if (!is_array($forMessages)) {
            // Handle string input (e.g., "1,2,3" or empty)
            if (is_string($forMessages) && !empty($forMessages)) {
                $forMessages = array_map('intval', explode(',', $forMessages));
            } else {
                $forMessages = [];
            }
        }
        $updates[] = "for_messages = :for_messages";
        $params['for_messages'] = empty($forMessages) ? '' : json_encode(array_map('intval', $forMessages));
    }

    if (empty($updates)) {
        sendResponse(false, null, 'No fields to update', 400);
    }

    // Execute update
    $query = "UPDATE helps SET " . implode(', ', $updates) . " WHERE HID = :hid";
    $stmt = $db->prepare($query);
    $stmt->execute($params);

    // Fetch updated help resource
    $fetchStmt = $db->prepare("SELECT * FROM helps WHERE HID = :hid");
    $fetchStmt->execute(['hid' => $helpId]);
    $help = $fetchStmt->fetch();

    // Decode for_messages JSON for response
    if ($help && isset($help['for_messages'])) {
        $decoded = json_decode($help['for_messages'], true);
        $help['for_messages'] = is_array($decoded) ? $decoded : [];
    }

    sendResponse(true, $help, 'Help resource updated successfully');

} catch (PDOException $e) {
    error_log('Help update error: ' . $e->getMessage());
    sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
}
?>