<?php
/**
 * SIP 設定 API
 * GET: 取得 SIP 設定
 * POST: 儲存/更新 SIP 設定
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db-config.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $userId = $_GET['user_id'] ?? '';
        if (empty($userId)) {
            echo json_encode(['success' => false, 'error' => '缺少 user_id']);
            exit;
        }

        $stmt = $pdo->prepare("SELECT * FROM sip_settings WHERE user_id = ? AND is_active = 1 LIMIT 1");
        $stmt->execute([$userId]);
        $settings = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($settings) {
            // 密碼遮罩
            $settings['sip_password'] = str_repeat('*', strlen($settings['sip_password']));
        }

        echo json_encode(['success' => true, 'data' => $settings]);

    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $userId = $input['user_id'] ?? '';

        if (empty($userId)) {
            echo json_encode(['success' => false, 'error' => '缺少 user_id']);
            exit;
        }

        $fields = [
            'sip_server' => $input['sip_server'] ?? 'sip.hinet.net',
            'sip_port' => intval($input['sip_port'] ?? 5060),
            'sip_username' => $input['sip_username'] ?? '',
            'sip_password' => $input['sip_password'] ?? '',
            'sip_domain' => $input['sip_domain'] ?? '',
            'display_name' => $input['display_name'] ?? '',
            'caller_id' => $input['caller_id'] ?? '',
            'transport' => $input['transport'] ?? 'wss',
            'stun_server' => $input['stun_server'] ?? 'stun:stun.l.google.com:19302',
        ];

        if (empty($fields['sip_username'])) {
            echo json_encode(['success' => false, 'error' => '請填寫 SIP 帳號']);
            exit;
        }

        // 檢查是否已有設定
        $stmt = $pdo->prepare("SELECT id, sip_password FROM sip_settings WHERE user_id = ? LIMIT 1");
        $stmt->execute([$userId]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        // 如果密碼是遮罩，保留原密碼
        if ($existing && preg_match('/^\*+$/', $fields['sip_password'])) {
            $fields['sip_password'] = $existing['sip_password'];
        }

        if (empty($fields['sip_password'])) {
            echo json_encode(['success' => false, 'error' => '請填寫 SIP 密碼']);
            exit;
        }

        if ($existing) {
            $stmt = $pdo->prepare("
                UPDATE sip_settings SET
                    sip_server = ?, sip_port = ?, sip_username = ?, sip_password = ?,
                    sip_domain = ?, display_name = ?, caller_id = ?, transport = ?,
                    stun_server = ?, is_active = 1
                WHERE user_id = ?
            ");
            $stmt->execute([
                $fields['sip_server'], $fields['sip_port'], $fields['sip_username'],
                $fields['sip_password'], $fields['sip_domain'], $fields['display_name'],
                $fields['caller_id'], $fields['transport'], $fields['stun_server'],
                $userId
            ]);
        } else {
            $stmt = $pdo->prepare("
                INSERT INTO sip_settings (user_id, sip_server, sip_port, sip_username, sip_password,
                    sip_domain, display_name, caller_id, transport, stun_server)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $userId, $fields['sip_server'], $fields['sip_port'], $fields['sip_username'],
                $fields['sip_password'], $fields['sip_domain'], $fields['display_name'],
                $fields['caller_id'], $fields['transport'], $fields['stun_server']
            ]);
        }

        echo json_encode(['success' => true, 'message' => 'SIP 設定已儲存']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
