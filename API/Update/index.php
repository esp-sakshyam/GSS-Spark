<?php
/**
 * LifeLine Index Update API
 * Updates an existing index mapping
 * 
 * Can update entire mapping or add/update individual codes
 * 
 * Usage:
 * PUT /API/Update/index.php
 * Body: { "type": "location", "mapping": {...} } - Replace entire mapping
 * Body: { "type": "location", "add": { "16": "New Village" } } - Add/update specific codes
 * Body: { "type": "location", "remove": ["15", "16"] } - Remove specific codes
 */

require_once '../../database.php';

// Only accept PUT requests
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    sendResponse(false, null, 'Method not allowed', 405);
}

// Get input data
$input = getJSONInput();

// Validate required field - either IID or type required
if (!isset($input['IID']) && !isset($input['type'])) {
    sendResponse(false, null, 'Either Index ID (IID) or type is required', 400);
}

try {
    $db = getDB();

    // Find the index by ID or type
    if (isset($input['IID'])) {
        $findStmt = $db->prepare("SELECT * FROM indexes WHERE IID = :iid");
        $findStmt->execute(['iid' => (int) $input['IID']]);
    } else {
        $findStmt = $db->prepare("SELECT * FROM indexes WHERE type = :type");
        $findStmt->execute(['type' => $input['type']]);
    }

    $existing = $findStmt->fetch();

    if (!$existing) {
        sendResponse(false, null, 'Index mapping not found', 404);
    }

    $indexId = $existing['IID'];
    $currentMapping = json_decode($existing['mapping'], true);

    // Handle different update modes
    $newMapping = $currentMapping;

    // Mode 1: Replace entire mapping
    if (isset($input['mapping'])) {
        if (!is_array($input['mapping'])) {
            sendResponse(false, null, 'Mapping must be an object', 400);
        }
        $newMapping = $input['mapping'];
    }

    // Mode 2: Add/update specific codes
    if (isset($input['add'])) {
        if (!is_array($input['add'])) {
            sendResponse(false, null, 'Add must be an object with code-value pairs', 400);
        }
        foreach ($input['add'] as $code => $value) {
            $newMapping[$code] = $value;
        }
    }

    // Mode 3: Remove specific codes
    if (isset($input['remove'])) {
        if (!is_array($input['remove'])) {
            sendResponse(false, null, 'Remove must be an array of codes', 400);
        }
        foreach ($input['remove'] as $code) {
            unset($newMapping[$code]);
        }
    }

    // Prepare update
    $updates = ['mapping = :mapping', 'updated_at = NOW()'];
    $params = [
        'iid' => $indexId,
        'mapping' => json_encode($newMapping)
    ];

    // Optional: update description
    if (isset($input['description'])) {
        $updates[] = 'description = :description';
        $params['description'] = trim($input['description']);
    }

    // Execute update
    $query = "UPDATE indexes SET " . implode(', ', $updates) . " WHERE IID = :iid";
    $stmt = $db->prepare($query);
    $stmt->execute($params);

    // Fetch updated index
    $fetchStmt = $db->prepare("SELECT * FROM indexes WHERE IID = :iid");
    $fetchStmt->execute(['iid' => $indexId]);
    $index = $fetchStmt->fetch();

    // Decode JSON mapping for response
    $index['mapping'] = json_decode($index['mapping'], true);

    sendResponse(true, $index, 'Index mapping updated successfully');

} catch (PDOException $e) {
    error_log('Index update error: ' . $e->getMessage());
    sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
}
?>