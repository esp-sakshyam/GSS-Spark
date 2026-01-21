<?php
/**
 * LifeLine Message Read API
 * Retrieves emergency message(s) from the database with decoded information
 * 
 * Usage:
 * GET /API/Read/message.php - Get all messages
 * GET /API/Read/message.php?id=1 - Get specific message
 * GET /API/Read/message.php?status=pending - Filter by status
 * GET /API/Read/message.php?priority=critical - Filter by priority
 * GET /API/Read/message.php?did=1 - Filter by device ID
 */

require_once '../../database.php';

// Only accept GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(false, null, 'Method not allowed', 405);
}

try {
    $db = getDB();

    // Base query with joins to decode message and location
    $baseSelect = "
        SELECT m.*, 
               d.device_name, d.LID, d.status as device_status,
               JSON_UNQUOTE(JSON_EXTRACT(il.mapping, CONCAT('\$.', d.LID))) as location_name,
               JSON_UNQUOTE(JSON_EXTRACT(im.mapping, CONCAT('\$.', m.message_code))) as message_text
        FROM messages m
        JOIN devices d ON m.DID = d.DID
        LEFT JOIN indexes il ON il.type = 'location'
        LEFT JOIN indexes im ON im.type = 'message'
    ";

    // Check if specific message ID is requested
    if (isset($_GET['id'])) {
        $messageId = (int) $_GET['id'];

        $stmt = $db->prepare($baseSelect . " WHERE m.MID = :mid");
        $stmt->execute(['mid' => $messageId]);
        $message = $stmt->fetch();

        if (!$message) {
            sendResponse(false, null, 'Message not found', 404);
        }

        sendResponse(true, $message, 'Message retrieved successfully');
    }

    // Build query for multiple messages
    $query = $baseSelect . " WHERE 1=1";
    $params = [];

    // Filter by device ID
    if (isset($_GET['did'])) {
        $query .= " AND m.DID = :did";
        $params['did'] = (int) $_GET['did'];
    }

    // Filter by location ID
    if (isset($_GET['lid'])) {
        $query .= " AND d.LID = :lid";
        $params['lid'] = (int) $_GET['lid'];
    }

    // Filter by message code
    if (isset($_GET['message_code'])) {
        $query .= " AND m.message_code = :message_code";
        $params['message_code'] = (int) $_GET['message_code'];
    }

    // Filter by date range
    if (isset($_GET['from'])) {
        $query .= " AND m.timestamp >= :from_date";
        $params['from_date'] = $_GET['from'];
    }

    if (isset($_GET['to'])) {
        $query .= " AND m.timestamp <= :to_date";
        $params['to_date'] = $_GET['to'];
    }

    // Order by (newest first)
    $query .= " ORDER BY m.timestamp DESC";

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
    $messages = $stmt->fetchAll();

    // Get total count for pagination
    $countQuery = "
        SELECT COUNT(*) FROM messages m
        JOIN devices d ON m.DID = d.DID
        WHERE 1=1
    ";
    if (isset($_GET['did']))
        $countQuery .= " AND m.DID = :did";
    if (isset($_GET['lid']))
        $countQuery .= " AND d.LID = :lid";
    if (isset($_GET['message_code']))
        $countQuery .= " AND m.message_code = :message_code";
    if (isset($_GET['from']))
        $countQuery .= " AND m.timestamp >= :from_date";
    if (isset($_GET['to']))
        $countQuery .= " AND m.timestamp <= :to_date";

    $countStmt = $db->prepare($countQuery);
    foreach ($params as $key => $value) {
        $countStmt->bindValue($key, $value);
    }
    $countStmt->execute();
    $total = $countStmt->fetchColumn();

    sendResponse(true, [
        'messages' => $messages,
        'total' => (int) $total,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => (int) $total,
            'pages' => ceil($total / $limit)
        ]
    ], 'Messages retrieved successfully');

} catch (PDOException $e) {
    error_log('Message read error: ' . $e->getMessage());
    sendResponse(false, null, 'Database error: ' . $e->getMessage(), 500);
}
?>