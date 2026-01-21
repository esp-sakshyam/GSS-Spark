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

// Validate status
$validStatuses = ['available', 'dispatched', 'busy'];
if (!in_array($status, $validStatuses)) {
    sendResponse(false, null, 'Invalid status. Must be one of: ' . implode(', ', $validStatuses), 400);
}

try {
    $db = getDB();

    // Insert new help resource
    $stmt = $db->prepare("
        INSERT INTO helps (name, contact, eta, status, location) 
        VALUES (:name, :contact, :eta, :status, :location)
    ");

    $stmt->execute([
        'name' => $name,
        'contact' => $contact,
        'eta' => $eta,
        'status' => $status,
        'location' => $location
    ]);

    $helpId = $db->lastInsertId();

    // Fetch created help resource
    $fetchStmt = $db->prepare("SELECT * FROM helps WHERE HID = :hid");
    $fetchStmt->execute(['hid' => $helpId]);
    $help = $fetchStmt->fetch();

    sendResponse(true, $help, 'Help resource created successfully', 201);

} catch (PDOException $e) {
    error_log('Help create error: ' . $e->getMessage());
    sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
}
?>