<?php
/**
 * LifeLine Helps Read API
 * Retrieves help resource(s) from the database
 * 
 * Usage:
 * GET /API/Read/helps.php - Get all help resources
 * GET /API/Read/helps.php?id=1 - Get specific help resource
 * GET /API/Read/helps.php?status=available - Filter by status
 * GET /API/Read/helps.php?type=medical - Filter by type
 */

require_once '../../database.php';

// Only accept GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(false, null, 'Method not allowed', 405);
}

try {
    $db = getDB();

    // Check if specific help ID is requested
    if (isset($_GET['id'])) {
        $helpId = (int) $_GET['id'];

        $stmt = $db->prepare("SELECT * FROM helps WHERE HID = :hid");
        $stmt->execute(['hid' => $helpId]);
        $help = $stmt->fetch();

        if (!$help) {
            sendResponse(false, null, 'Help resource not found', 404);
        }

        // Decode for_messages JSON (handle empty string case)
        if (isset($help['for_messages'])) {
            $decoded = json_decode($help['for_messages'], true);
            $help['for_messages'] = is_array($decoded) ? $decoded : [];
        } else {
            $help['for_messages'] = [];
        }

        sendResponse(true, $help, 'Help resource retrieved successfully');
    }

    // Build query for multiple help resources
    $query = "SELECT * FROM helps WHERE 1=1";
    $params = [];

    // Filter by status
    if (isset($_GET['status'])) {
        $query .= " AND status = :status";
        $params['status'] = $_GET['status'];
    }

    // Search by name
    if (isset($_GET['search'])) {
        $query .= " AND (name LIKE :search OR location LIKE :search)";
        $params['search'] = '%' . $_GET['search'] . '%';
    }

    // Order by
    $query .= " ORDER BY status ASC, name ASC";

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
    $helps = $stmt->fetchAll();

    // Decode for_messages JSON for each help resource (handle empty string case)
    foreach ($helps as &$help) {
        if (isset($help['for_messages'])) {
            $decoded = json_decode($help['for_messages'], true);
            $help['for_messages'] = is_array($decoded) ? $decoded : [];
        } else {
            $help['for_messages'] = [];
        }
    }

    // Get total count for pagination
    $countQuery = "SELECT COUNT(*) FROM helps WHERE 1=1";
    if (isset($_GET['status'])) {
        $countQuery .= " AND status = :status";
    }
    if (isset($_GET['search'])) {
        $countQuery .= " AND (name LIKE :search OR location LIKE :search)";
    }

    $countStmt = $db->prepare($countQuery);
    foreach ($params as $key => $value) {
        if ($key !== 'limit' && $key !== 'offset') {
            $countStmt->bindValue($key, $value);
        }
    }
    $countStmt->execute();
    $total = $countStmt->fetchColumn();

    sendResponse(true, [
        'helps' => $helps,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => (int) $total,
            'pages' => ceil($total / $limit)
        ]
    ], 'Help resources retrieved successfully');

} catch (PDOException $e) {
    error_log('Help read error: ' . $e->getMessage());
    sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
}
?>