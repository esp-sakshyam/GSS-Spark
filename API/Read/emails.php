<?php
/**
 * LifeLine Email Receivers Read API
 * Retrieves email(s) from the database
 */

require_once '../../database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(false, null, 'Method not allowed', 405);
}

try {
    $db = getDB();

    if (isset($_GET['sn'])) {
        $sn = (int) $_GET['sn'];
        $stmt = $db->prepare("SELECT * FROM emails WHERE sn = :sn");
        $stmt->execute(['sn' => $sn]);
        $email = $stmt->fetch();

        if (!$email) {
            sendResponse(false, null, 'Email not found', 404);
        }

        sendResponse(true, $email, 'Email retrieved successfully');
    }

    $stmt = $db->query("SELECT * FROM emails ORDER BY sn ASC");
    $emails = $stmt->fetchAll();

    sendResponse(true, [
        'emails' => $emails,
        'total' => count($emails)
    ], 'Emails retrieved successfully');

} catch (PDOException $e) {
    error_log('Email read error: ' . $e->getMessage());
    sendResponse(false, null, 'Database error', 500);
}
?>