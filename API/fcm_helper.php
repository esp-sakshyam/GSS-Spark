<?php
/**
 * LifeLine FCM (Firebase Cloud Messaging) Helper
 * Sends push notifications via Firebase HTTP v1 API
 */

require_once __DIR__ . '/../vendor/autoload.php';

class FCMHelper
{
    private $projectId;
    private $serviceAccountPath;
    private $accessToken;
    private $tokenExpiry;
    private $isConfigured = false;

    public function __construct()
    {
        $this->serviceAccountPath = __DIR__ . '/../lifeline-notification-firebase-adminsdk-fbsvc-ad9b1c5d15.json';

        // Check if service account file exists
        if (!file_exists($this->serviceAccountPath)) {
            error_log('FCM: Service account file not found: ' . $this->serviceAccountPath);
            return;
        }

        // Load service account to get project ID
        $contents = file_get_contents($this->serviceAccountPath);
        if ($contents === false) {
            error_log('FCM: Could not read service account file');
            return;
        }

        $serviceAccount = json_decode($contents, true);
        if (!$serviceAccount || !isset($serviceAccount['project_id'])) {
            error_log('FCM: Invalid service account JSON');
            return;
        }

        $this->projectId = $serviceAccount['project_id'];
        $this->isConfigured = true;
    }

    /**
     * Check if FCM is properly configured
     */
    public function isConfigured()
    {
        return $this->isConfigured;
    }

    /**
     * Get OAuth2 access token for Firebase
     */
    private function getAccessToken()
    {
        // Check if we have a valid cached token
        if ($this->accessToken && $this->tokenExpiry && time() < $this->tokenExpiry) {
            return $this->accessToken;
        }

        // Use Google Auth library to get access token
        $client = new Google\Client();
        $client->setAuthConfig($this->serviceAccountPath);
        $client->addScope('https://www.googleapis.com/auth/firebase.messaging');

        $token = $client->fetchAccessTokenWithAssertion();

        if (isset($token['access_token'])) {
            $this->accessToken = $token['access_token'];
            // Token typically expires in 3600 seconds, cache for 3500 to be safe
            $this->tokenExpiry = time() + 3500;
            return $this->accessToken;
        }

        throw new Exception('Failed to get Firebase access token');
    }

    /**
     * Send notification to a single device
     */
    public function sendToDevice($token, $title, $body, $data = [], $clickAction = null)
    {
        $message = [
            'message' => [
                'token' => $token,
                'notification' => [
                    'title' => $title,
                    'body' => $body
                ],
                'webpush' => [
                    'notification' => [
                        'icon' => '/res/lifeline.png',
                        'badge' => '/res/lifeline.png',
                        'vibrate' => [200, 100, 200, 100, 200],
                        'requireInteraction' => true,
                        'tag' => 'lifeline-emergency'
                    ],
                    'fcm_options' => [
                        'link' => $clickAction ?? '/portal/dashboard.php'
                    ]
                ],
                'data' => array_merge($data, [
                    'click_action' => $clickAction ?? '/portal/dashboard.php',
                    'title' => $title,
                    'body' => $body
                ])
            ]
        ];

        return $this->sendRequest($message);
    }

    /**
     * Send notification to multiple devices
     */
    public function sendToMultipleDevices($tokens, $title, $body, $data = [], $clickAction = null)
    {
        $results = [
            'success' => 0,
            'failure' => 0,
            'failed_tokens' => []
        ];

        foreach ($tokens as $token) {
            try {
                $response = $this->sendToDevice($token, $title, $body, $data, $clickAction);
                if ($response['success']) {
                    $results['success']++;
                } else {
                    $results['failure']++;
                    $results['failed_tokens'][] = [
                        'token' => $token,
                        'error' => $response['error'] ?? 'Unknown error'
                    ];
                }
            } catch (Exception $e) {
                $results['failure']++;
                $results['failed_tokens'][] = [
                    'token' => $token,
                    'error' => $e->getMessage()
                ];
            }
        }

        return $results;
    }

    /**
     * Send FCM request
     */
    private function sendRequest($message)
    {
        $accessToken = $this->getAccessToken();

        $url = "https://fcm.googleapis.com/v1/projects/{$this->projectId}/messages:send";

        $headers = [
            'Authorization: Bearer ' . $accessToken,
            'Content-Type: application/json'
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($message));
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);        // 10 seconds timeout
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);  // 5 seconds connect timeout

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            return ['success' => false, 'error' => 'CURL error: ' . $error];
        }

        $responseData = json_decode($response, true);

        if ($httpCode === 200) {
            return ['success' => true, 'response' => $responseData];
        }

        // Handle specific FCM errors
        $errorMessage = $responseData['error']['message'] ?? 'Unknown error';
        $errorCode = $responseData['error']['details'][0]['errorCode'] ?? '';

        // If token is invalid, we should deactivate it
        if (in_array($errorCode, ['UNREGISTERED', 'INVALID_ARGUMENT'])) {
            return [
                'success' => false,
                'error' => $errorMessage,
                'should_remove_token' => true
            ];
        }

        return ['success' => false, 'error' => $errorMessage];
    }

    /**
     * Get all active FCM tokens from database
     */
    public static function getAllActiveTokens($db)
    {
        $stmt = $db->prepare("SELECT token FROM fcm_tokens WHERE active = 1");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    /**
     * Deactivate a token (when it's no longer valid)
     */
    public static function deactivateToken($db, $token)
    {
        $stmt = $db->prepare("UPDATE fcm_tokens SET active = 0 WHERE token = :token");
        $stmt->execute(['token' => $token]);
    }

    /**
     * Send emergency notification to all registered devices
     */
    public function sendEmergencyNotification($db, $deviceName, $locationName, $messageText, $messageId = null)
    {
        // Check if FCM is configured
        if (!$this->isConfigured) {
            return ['success' => false, 'message' => 'FCM not configured - service account file missing'];
        }

        $tokens = self::getAllActiveTokens($db);

        if (empty($tokens)) {
            return ['success' => true, 'message' => 'No registered devices to notify'];
        }

        $title = "🚨 Emergency Alert";
        $body = "Emergency from {$locationName}: {$messageText}";

        if ($deviceName) {
            $body = "{$deviceName} at {$locationName}: {$messageText}";
        }

        $data = [
            'type' => 'emergency',
            'message_id' => (string) $messageId,
            'device_name' => $deviceName ?? '',
            'location' => $locationName ?? '',
            'message' => $messageText ?? ''
        ];

        $clickAction = '/portal/messages.php';

        $results = $this->sendToMultipleDevices($tokens, $title, $body, $data, $clickAction);

        // Deactivate failed tokens that should be removed
        foreach ($results['failed_tokens'] as $failed) {
            if (isset($failed['should_remove_token']) && $failed['should_remove_token']) {
                self::deactivateToken($db, $failed['token']);
            }
        }

        return $results;
    }
}
?>