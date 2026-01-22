<?php
/**
 * LifeLine Email Helper
 * Sends emergency email notifications via SMTP
 */

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class EmailHelper
{
    private $host = 'localhost';  // Use localhost since we're on the same server
    private $username = 'lifeline@zenithkandel.com.np';
    private $password = '8038@Zenith';
    private $port = 465;
    private $fromName = 'LifeLine Emergency';

    /**
     * Send email to a single recipient
     */
    public function sendEmail($to, $subject, $htmlBody, $textBody = null, $debug = false)
    {
        $mail = new PHPMailer(true);

        try {
            // Server settings
            $mail->isSMTP();
            $mail->Host = $this->host;
            $mail->SMTPAuth = true;
            $mail->Username = $this->username;
            $mail->Password = $this->password;
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;  // SSL on port 465
            $mail->Port = $this->port;

            // Timeout settings
            $mail->Timeout = 30;       // 30 seconds timeout
            $mail->SMTPKeepAlive = false;

            // Debug mode for troubleshooting
            $mail->SMTPDebug = $debug ? SMTP::DEBUG_CONNECTION : 0;

            // SSL options - allow self-signed certificates
            $mail->SMTPOptions = [
                'ssl' => [
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true
                ]
            ];

            // Recipients
            $mail->setFrom($this->username, $this->fromName);
            $mail->addAddress($to);
            $mail->addReplyTo($this->username, $this->fromName);

            // Content
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body = $htmlBody;
            $mail->AltBody = $textBody ?? strip_tags($htmlBody);

            $mail->send();
            return ['success' => true];
        } catch (Exception $e) {
            error_log('Email send error: ' . $mail->ErrorInfo);
            return ['success' => false, 'error' => $mail->ErrorInfo];
        }
    }

    /**
     * Send email to multiple recipients
     */
    public function sendToMultiple($recipients, $subject, $htmlBody, $textBody = null)
    {
        $results = [
            'success' => 0,
            'failure' => 0,
            'failed_emails' => []
        ];

        foreach ($recipients as $email) {
            $result = $this->sendEmail($email, $subject, $htmlBody, $textBody);
            if ($result['success']) {
                $results['success']++;
            } else {
                $results['failure']++;
                $results['failed_emails'][] = [
                    'email' => $email,
                    'error' => $result['error'] ?? 'Unknown error'
                ];
            }
        }

        return $results;
    }

    /**
     * Get all email recipients from database
     */
    public static function getAllEmails($db)
    {
        $stmt = $db->query("SELECT email FROM emails");
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    /**
     * Send emergency notification to all registered emails
     */
    public function sendEmergencyEmail($db, $deviceName, $locationName, $messageText, $messageId = null, $timestamp = null)
    {
        $emails = self::getAllEmails($db);

        if (empty($emails)) {
            return ['success' => true, 'message' => 'No email recipients configured'];
        }

        $timestamp = $timestamp ?? date('Y-m-d H:i:s');

        $subject = "🚨 EMERGENCY ALERT - {$locationName}";

        $htmlBody = $this->buildEmailTemplate($deviceName, $locationName, $messageText, $messageId, $timestamp);
        $textBody = $this->buildTextEmail($deviceName, $locationName, $messageText, $messageId, $timestamp);

        return $this->sendToMultiple($emails, $subject, $htmlBody, $textBody);
    }

    /**
     * Build HTML email template
     */
    private function buildEmailTemplate($deviceName, $locationName, $messageText, $messageId, $timestamp)
    {
        return '
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🚨 EMERGENCY ALERT</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 30px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 15px; background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 4px; margin-bottom: 20px;">
                                        <p style="margin: 0; font-size: 18px; color: #991b1b; font-weight: bold;">' . htmlspecialchars($messageText) . '</p>
                                    </td>
                                </tr>
                            </table>
                            
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 25px;">
                                <tr>
                                    <td width="50%" style="padding: 10px 0;">
                                        <p style="margin: 0; color: #666; font-size: 12px; text-transform: uppercase;">Location</p>
                                        <p style="margin: 5px 0 0 0; color: #333; font-size: 16px; font-weight: bold;">📍 ' . htmlspecialchars($locationName) . '</p>
                                    </td>
                                    <td width="50%" style="padding: 10px 0;">
                                        <p style="margin: 0; color: #666; font-size: 12px; text-transform: uppercase;">Device</p>
                                        <p style="margin: 5px 0 0 0; color: #333; font-size: 16px; font-weight: bold;">📡 ' . htmlspecialchars($deviceName ?? 'Unknown') . '</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td width="50%" style="padding: 10px 0;">
                                        <p style="margin: 0; color: #666; font-size: 12px; text-transform: uppercase;">Time</p>
                                        <p style="margin: 5px 0 0 0; color: #333; font-size: 16px;">🕐 ' . htmlspecialchars($timestamp) . '</p>
                                    </td>
                                    <td width="50%" style="padding: 10px 0;">
                                        <p style="margin: 0; color: #666; font-size: 12px; text-transform: uppercase;">Message ID</p>
                                        <p style="margin: 5px 0 0 0; color: #333; font-size: 16px;">#' . htmlspecialchars($messageId ?? 'N/A') . '</p>
                                    </td>
                                </tr>
                            </table>
                            
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                                <tr>
                                    <td align="center">
                                        <a href="https://zenithkandel.com.np/lifeline/portal/" style="display: inline-block; background-color: #dc2626; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">View in Portal →</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f8f8; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                            <p style="margin: 0; color: #888; font-size: 12px;">LifeLine Emergency Response System</p>
                            <p style="margin: 5px 0 0 0; color: #aaa; font-size: 11px;">This is an automated emergency notification.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>';
    }

    /**
     * Build plain text email
     */
    private function buildTextEmail($deviceName, $locationName, $messageText, $messageId, $timestamp)
    {
        return "
🚨 EMERGENCY ALERT

{$messageText}

Location: {$locationName}
Device: " . ($deviceName ?? 'Unknown') . "
Time: {$timestamp}
Message ID: #{$messageId}

View in Portal: https://zenithkandel.com.np/lifeline/portal/

---
LifeLine Emergency Response System
This is an automated emergency notification.
";
    }
}
