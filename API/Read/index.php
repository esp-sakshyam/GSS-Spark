<?php
/**
 * LifeLine Index Read API
 * Retrieves index mapping(s) for decoding LoRa integer codes
 * 
 * Usage:
 * GET /API/Read/index.php - Get all index mappings
 * GET /API/Read/index.php?type=location - Get specific type mapping
 * GET /API/Read/index.php?id=1 - Get by ID
 * GET /API/Read/index.php?decode=true&type=message&code=1 - Decode a specific code
 */

require_once '../../database.php';

// Only accept GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(false, null, 'Method not allowed', 405);
}

try {
    $db = getDB();

    // Special decode mode - decode a specific code
    if (isset($_GET['decode']) && $_GET['decode'] === 'true') {
        if (!isset($_GET['type']) || !isset($_GET['code'])) {
            sendResponse(false, null, 'Decode mode requires type and code parameters', 400);
        }

        $type = $_GET['type'];
        $code = $_GET['code'];

        $stmt = $db->prepare("
            SELECT JSON_UNQUOTE(JSON_EXTRACT(mapping, CONCAT('\$.', :code))) as decoded_value
            FROM indexes 
            WHERE type = :type
        ");
        $stmt->execute(['type' => $type, 'code' => $code]);
        $result = $stmt->fetch();

        if (!$result || $result['decoded_value'] === null) {
            sendResponse(false, null, 'Code not found in mapping', 404);
        }

        sendResponse(true, [
            'type' => $type,
            'code' => $code,
            'value' => $result['decoded_value']
        ], 'Code decoded successfully');
    }

    // Get by ID
    if (isset($_GET['id'])) {
        $indexId = (int) $_GET['id'];

        $stmt = $db->prepare("SELECT * FROM indexes WHERE IID = :iid");
        $stmt->execute(['iid' => $indexId]);
        $index = $stmt->fetch();

        if (!$index) {
            sendResponse(false, null, 'Index mapping not found', 404);
        }

        // Decode JSON mapping
        $index['mapping'] = json_decode($index['mapping'], true);

        sendResponse(true, $index, 'Index mapping retrieved successfully');
    }

    // Get by type
    if (isset($_GET['type'])) {
        $type = $_GET['type'];

        $stmt = $db->prepare("SELECT * FROM indexes WHERE type = :type");
        $stmt->execute(['type' => $type]);
        $index = $stmt->fetch();

        if (!$index) {
            sendResponse(false, null, 'Index mapping for type not found', 404);
        }

        // Decode JSON mapping
        $index['mapping'] = json_decode($index['mapping'], true);

        sendResponse(true, $index, 'Index mapping retrieved successfully');
    }

    // Get all mappings
    $stmt = $db->query("SELECT * FROM indexes ORDER BY type ASC");
    $indexes = $stmt->fetchAll();

    // Decode JSON mappings
    foreach ($indexes as &$index) {
        $index['mapping'] = json_decode($index['mapping'], true);
    }

    sendResponse(true, [
        'indexes' => $indexes,
        'total' => count($indexes)
    ], 'Index mappings retrieved successfully');

} catch (PDOException $e) {
    error_log('Index read error: ' . $e->getMessage());
    sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
}
?>