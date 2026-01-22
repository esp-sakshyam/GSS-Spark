<?php
/**
 * LifeLine Helps Create API
 * Creates a new help resource/responder
 */

require_once '../../database.php';

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, null, 'Method not allowed', 405);
}

// Get input data
$input = getJSONInput();

// Validate required fields
$missing = validateRequired($input, ['name', 'contact']);
if (!empty($missing)) {
    sendResponse(false, null, 'Missing required fields: ' . implode(', ', $missing), 400);
}

// Extract and sanitize data
$name = trim($input['name']);
$contact = trim($input['contact']);
$eta = isset($input['eta']) ? trim($input['eta']) : null;
$status = isset($input['status']) ? $input['status'] : 'available';
$location = isset($input['location']) ? trim($input['location']) : null;
$forMessages = isset($input['for_messages']) ? $input['for_messages'] : [];

// Validate status
$validStatuses = ['available', 'dispatched', 'busy'];
if (!in_array($status, $validStatuses)) {
    sendResponse(false, null, 'Invalid status. Must be one of: ' . implode(', ', $validStatuses), 400);
}

// Validate and encode for_messages as JSON array
if (!is_array($forMessages)) {
    // Handle string input (e.g., "1,2,3" or empty)
    if (is_string($forMessages) && !empty($forMessages)) {
        $forMessages = array_map('intval', explode(',', $forMessages));
    } else {
        $forMessages = [];
    }
}
$forMessagesJson = empty($forMessages) ? '' : json_encode(array_map('intval', $forMessages));

try {
    $db = getDB();

    // Insert new help resource
    $stmt = $db->prepare("
        INSERT INTO helps (name, contact, eta, status, location, for_messages) 
        VALUES (:name, :contact, :eta, :status, :location, :for_messages)
    ");

    $stmt->execute([
        'name' => $name,
        'contact' => $contact,
        'eta' => $eta,
        'status' => $status,
        'location' => $location,
        'for_messages' => $forMessagesJson
    ]);

    $helpId = $db->lastInsertId();

    // Fetch created help resource
    $fetchStmt = $db->prepare("SELECT * FROM helps WHERE HID = :hid");
    $fetchStmt->execute(['hid' => $helpId]);
    $help = $fetchStmt->fetch();

    // Decode for_messages JSON for response
    if ($help && isset($help['for_messages'])) {
        $decoded = json_decode($help['for_messages'], true);
        $help['for_messages'] = is_array($decoded) ? $decoded : [];
    }

    sendResponse(true, $help, 'Help resource created successfully', 201);

} catch (PDOException $e) {
    error_log('Help create error: ' . $e->getMessage());
    sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
}
?>