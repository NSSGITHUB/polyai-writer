<?php
/**
 * 撥號聯絡人 API
 * GET: 取得聯絡人列表
 * POST: 新增/批次匯入聯絡人
 * PUT: 更新聯絡人狀態
 * DELETE: 刪除聯絡人
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
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
        $status = $_GET['status'] ?? '';
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = min(100, max(1, intval($_GET['limit'] ?? 50)));
        $offset = ($page - 1) * $limit;

        if (empty($userId)) {
            echo json_encode(['success' => false, 'error' => '缺少 user_id']);
            exit;
        }

        $where = "WHERE user_id = ?";
        $params = [$userId];

        if (!empty($status)) {
            $where .= " AND status = ?";
            $params[] = $status;
        }

        // 取得總數
        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM dial_contacts $where");
        $countStmt->execute($params);
        $total = $countStmt->fetchColumn();

        // 取得資料
        $params[] = $limit;
        $params[] = $offset;
        $stmt = $pdo->prepare("SELECT * FROM dial_contacts $where ORDER BY created_at DESC LIMIT ? OFFSET ?");
        $stmt->execute($params);
        $contacts = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 取得各狀態統計
        $statsStmt = $pdo->prepare("
            SELECT status, COUNT(*) as count FROM dial_contacts WHERE user_id = ? GROUP BY status
        ");
        $statsStmt->execute([$userId]);
        $statusCounts = [];
        while ($row = $statsStmt->fetch(PDO::FETCH_ASSOC)) {
            $statusCounts[$row['status']] = intval($row['count']);
        }

        echo json_encode([
            'success' => true,
            'data' => $contacts,
            'total' => intval($total),
            'page' => $page,
            'limit' => $limit,
            'status_counts' => $statusCounts,
        ]);

    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $userId = $input['user_id'] ?? '';

        if (empty($userId)) {
            echo json_encode(['success' => false, 'error' => '缺少 user_id']);
            exit;
        }

        // 批次匯入
        if (isset($input['contacts']) && is_array($input['contacts'])) {
            $inserted = 0;
            $stmt = $pdo->prepare("
                INSERT INTO dial_contacts (user_id, name, phone, company, email, notes, tags)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");

            foreach ($input['contacts'] as $contact) {
                if (empty($contact['phone'])) continue;
                $stmt->execute([
                    $userId,
                    $contact['name'] ?? '未命名',
                    $contact['phone'],
                    $contact['company'] ?? null,
                    $contact['email'] ?? null,
                    $contact['notes'] ?? null,
                    $contact['tags'] ?? null,
                ]);
                $inserted++;
            }

            echo json_encode(['success' => true, 'message' => "成功匯入 {$inserted} 筆聯絡人"]);
        } else {
            // 單筆新增
            $stmt = $pdo->prepare("
                INSERT INTO dial_contacts (user_id, name, phone, company, email, notes, tags)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $userId,
                $input['name'] ?? '未命名',
                $input['phone'] ?? '',
                $input['company'] ?? null,
                $input['email'] ?? null,
                $input['notes'] ?? null,
                $input['tags'] ?? null,
            ]);

            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId(), 'message' => '聯絡人已新增']);
        }

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

        $allowedFields = ['name', 'phone', 'company', 'email', 'notes', 'tags', 'status'];
        foreach ($allowedFields as $field) {
            if (isset($input[$field])) {
                $updates[] = "$field = ?";
                $params[] = $input[$field];
            }
        }

        if (isset($input['status']) && in_array($input['status'], ['called', 'answered', 'no_answer', 'busy', 'failed'])) {
            $updates[] = "last_called_at = NOW()";
            $updates[] = "call_count = call_count + 1";
        }

        if (empty($updates)) {
            echo json_encode(['success' => false, 'error' => '沒有要更新的欄位']);
            exit;
        }

        $params[] = $id;
        $params[] = $userId;
        $stmt = $pdo->prepare("UPDATE dial_contacts SET " . implode(', ', $updates) . " WHERE id = ? AND user_id = ?");
        $stmt->execute($params);

        echo json_encode(['success' => true, 'message' => '聯絡人已更新']);

    } elseif ($method === 'DELETE') {
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $input['id'] ?? 0;
        $userId = $input['user_id'] ?? '';

        if (empty($id) || empty($userId)) {
            echo json_encode(['success' => false, 'error' => '缺少必要參數']);
            exit;
        }

        $stmt = $pdo->prepare("DELETE FROM dial_contacts WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);

        echo json_encode(['success' => true, 'message' => '聯絡人已刪除']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
