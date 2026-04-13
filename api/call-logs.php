<?php
/**
 * 通話記錄 API
 * GET: 取得通話記錄
 * POST: 新增通話記錄
 * PUT: 更新通話狀態
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
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
        $contactId = $_GET['contact_id'] ?? '';
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = min(100, max(1, intval($_GET['limit'] ?? 50)));
        $offset = ($page - 1) * $limit;

        if (empty($userId)) {
            echo json_encode(['success' => false, 'error' => '缺少 user_id']);
            exit;
        }

        $where = "WHERE cl.user_id = ?";
        $params = [$userId];

        if (!empty($contactId)) {
            $where .= " AND cl.contact_id = ?";
            $params[] = $contactId;
        }

        // 通話記錄（含聯絡人姓名）
        $params[] = $limit;
        $params[] = $offset;
        $stmt = $pdo->prepare("
            SELECT cl.*, dc.name as contact_name, dc.company as contact_company
            FROM call_logs cl
            LEFT JOIN dial_contacts dc ON cl.contact_id = dc.id
            $where
            ORDER BY cl.started_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute($params);
        $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 通話統計
        $statsStmt = $pdo->prepare("SELECT * FROM call_stats WHERE user_id = ?");
        $statsStmt->execute([$userId]);
        $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => $logs,
            'stats' => $stats ?: [
                'total_calls' => 0,
                'completed_calls' => 0,
                'answered_calls' => 0,
                'avg_duration' => 0,
                'today_calls' => 0,
            ],
        ]);

    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $userId = $input['user_id'] ?? '';

        if (empty($userId)) {
            echo json_encode(['success' => false, 'error' => '缺少 user_id']);
            exit;
        }

        $stmt = $pdo->prepare("
            INSERT INTO call_logs (user_id, contact_id, phone_number, direction, status, ai_script)
            VALUES (?, ?, ?, ?, 'initiated', ?)
        ");
        $stmt->execute([
            $userId,
            $input['contact_id'] ?? null,
            $input['phone_number'] ?? '',
            $input['direction'] ?? 'outbound',
            $input['ai_script'] ?? null,
        ]);

        $logId = $pdo->lastInsertId();
        echo json_encode(['success' => true, 'id' => $logId]);

    } elseif ($method === 'PUT') {
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $input['id'] ?? 0;
        $userId = $input['user_id'] ?? '';

        if (empty($id) || empty($userId)) {
            echo json_encode(['success' => false, 'error' => '缺少必要參數']);
            exit;
        }

        $updates = [];
        $params = [];

        $allowedFields = ['status', 'duration', 'ai_transcript', 'recording_url', 'notes'];
        foreach ($allowedFields as $field) {
            if (isset($input[$field])) {
                $updates[] = "$field = ?";
                $params[] = $input[$field];
            }
        }

        if (isset($input['status']) && in_array($input['status'], ['completed', 'failed', 'cancelled'])) {
            $updates[] = "ended_at = NOW()";
        }

        if (empty($updates)) {
            echo json_encode(['success' => false, 'error' => '沒有要更新的欄位']);
            exit;
        }

        $params[] = $id;
        $params[] = $userId;
        $stmt = $pdo->prepare("UPDATE call_logs SET " . implode(', ', $updates) . " WHERE id = ? AND user_id = ?");
        $stmt->execute($params);

        echo json_encode(['success' => true, 'message' => '通話記錄已更新']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
