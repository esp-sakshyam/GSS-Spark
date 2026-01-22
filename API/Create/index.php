<?php
/**
 * LifeLine Index Create API
 * Creates a new mapping index for LoRa integer codes
 * 
 * The indexes table maps integer codes sent by LoRa devices to meaningful data
 * Types: location, message, help, status
 */

require_once '../../database.php';

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, null, 'Method not allowed', 405);
}

// Get input data
$input = getJSONInput();

// Validate required fields
$missing = validateRequired($input, ['type', 'mapping']);
if (!empty($missing)) {
    sendResponse(false, null, 'Missing required fields: ' . implode(', ', $missing), 400);
}

$type = trim($input['type']);
$mapping = $input['mapping'];
$description = isset($input['description']) ? trim($input['description']) : null;

// Validate type
$validTypes = ['location', 'message', 'help', 'status'];
if (!in_array($type, $validTypes)) {
    sendResponse(false, null, 'Invalid type. Must be one of: ' . implode(', ', $validTypes), 400);
}

// Validate mapping is array/object and convert to JSON
if (!is_array($mapping)) {
    sendResponse(false, null, 'Mapping must be an object with integer keys and string values', 400);
}

// Ensure mapping is valid JSON object
$mappingJson = json_encode($mapping);
if ($mappingJson === false) {
    sendResponse(false, null, 'Invalid mapping format', 400);
}

try {
    $db = getDB();

    // Check if type already exists (unique constraint)
    $checkStmt = $db->prepare("SELECT IID FROM indexes WHERE type = :type");
    $checkStmt->execute(['type' => $type]);

    if ($checkStmt->fetch()) {
        sendResponse(false, null, 'Index mapping for this type already exists. Use update instead.', 409);
    }

    // Insert new index mapping
    $stmt = $db->prepare("
        INSERT INTO indexes (type, mapping, description, updated_at) 
        VALUES (:type, :mapping, :description, NOW())
    ");

    $stmt->execute([
        'type' => $type,
        'mapping' => $mappingJson,
        'description' => $description
    ]);

    $indexId = $db->lastInsertId();

    // Fetch created index
    $fetchStmt = $db->prepare("SELECT * FROM indexes WHERE IID = :iid");
    $fetchStmt->execute(['iid' => $indexId]);
    $index = $fetchStmt->fetch();

    // Decode mapping JSON for response
    $index['mapping'] = json_decode($index['mapping'], true);

    sendResponse(true, $index, 'Index mapping created successfully', 201);

} catch (PDOException $e) {
    error_log('Index create error: ' . $e->getMessage());
    sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
}
?>