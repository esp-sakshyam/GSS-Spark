<?php
/**
 * LifeLine Device Read API
 * Retrieves device(s) from the database
 * 
 * Usage:
 * GET /API/Read/device.php - Get all devices
 * GET /API/Read/device.php?id=1 - Get specific device
 * GET /API/Read/device.php?status=active - Filter by status
 * GET /API/Read/device.php?lid=1 - Filter by location
 */

require_once '../../database.php';

// Only accept GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(false, null, 'Method not allowed', 405);
}

try {
    $db = getDB();

    // Check if specific device ID is requested
    if (isset($_GET['id'])) {
        $deviceId = (int) $_GET['id'];

        $stmt = $db->prepare("
            SELECT d.*, 
                   JSON_UNQUOTE(JSON_EXTRACT(i.mapping, CONCAT('\$.', d.LID))) as location_name
            FROM devices d
            LEFT JOIN indexes i ON i.type = 'location'
            WHERE d.DID = :did
        ");
        $stmt->execute(['did' => $deviceId]);
        $device = $stmt->fetch();

        if (!$device) {
            sendResponse(false, null, 'Device not found', 404);
        }

        sendResponse(true, $device, 'Device retrieved successfully');
    }

    // Build query for multiple devices
    $query = "
        SELECT d.*, 
               JSON_UNQUOTE(JSON_EXTRACT(i.mapping, CONCAT('\$.', d.LID))) as location_name
        FROM devices d
        LEFT JOIN indexes i ON i.type = 'location'
        WHERE 1=1
    ";
    $params = [];

    // Filter by status
    if (isset($_GET['status'])) {
        $query .= " AND d.status = :status";
        $params['status'] = $_GET['status'];
    }

    // Filter by location
    if (isset($_GET['lid'])) {
        $query .= " AND d.LID = :lid";
        $params['lid'] = (int) $_GET['lid'];
    }

    // Order by
    $query .= " ORDER BY d.last_ping DESC";

    // Pagination
    $page = isset($_GET['page']) ? max(1, (int) $_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? min(100, max(1, (int) $_GET['limit'])) : 50;
    $offset = ($page - 1) * $limit;

    $query .= " LIMIT :limit OFFSET :offset";

    $stmt = $db->prepare($query);

    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue('offset', $offset, PDO::PARAM_INT);

    $stmt->execute();
    $devices = $stmt->fetchAll();

    // Get total count for pagination
    $countQuery = "SELECT COUNT(*) FROM devices WHERE 1=1";
    if (isset($_GET['status'])) {
        $countQuery .= " AND status = :status";
    }
    if (isset($_GET['lid'])) {
        $countQuery .= " AND LID = :lid";
    }

    $countStmt = $db->prepare($countQuery);
    if (isset($_GET['status'])) {
        $countStmt->bindValue('status', $_GET['status']);
    }
    if (isset($_GET['lid'])) {
        $countStmt->bindValue('lid', (int) $_GET['lid'], PDO::PARAM_INT);
    }
    $countStmt->execute();
    $total = $countStmt->fetchColumn();

    sendResponse(true, [
        'devices' => $devices,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => (int) $total,
            'pages' => ceil($total / $limit)
        ]
    ], 'Devices retrieved successfully');

} catch (PDOException $e) {
    error_log('Device read error: ' . $e->getMessage());
    sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
}
?>