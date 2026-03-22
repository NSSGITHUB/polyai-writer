<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

require_once __DIR__ . '/../db-config.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = getDBConnection();

try {
    // GET - 取得決策列表
    if ($method === 'GET') {
        $userId = $_GET['user_id'] ?? '';
        $status = $_GET['status'] ?? '';

        $sql = 'SELECT d.*, m.title as meeting_title FROM ai_decisions d LEFT JOIN ai_meetings m ON m.id = d.meeting_id WHERE d.user_id = ?';
        $params = [$userId];

        if ($status) {
            $sql .= ' AND d.status = ?';
            $params[] = $status;
        }

        $sql .= ' ORDER BY d.created_at DESC LIMIT 50';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        echo json_encode(['success' => true, 'decisions' => $stmt->fetchAll()]);
    }

    // PUT - 更新決策狀態
    elseif ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        $decisionId = $data['decision_id'] ?? '';
        $status = $data['status'] ?? '';

        if (empty($decisionId) || empty($status)) {
            http_response_code(400);
            echo json_encode(['error' => '缺少參數']);
            exit;
        }

        $stmt = $db->prepare('UPDATE ai_decisions SET status = ? WHERE id = ?');
        $stmt->execute([$status, $decisionId]);

        echo json_encode(['success' => true]);
    }

} catch (Exception $e) {
    error_log('ai-company/decisions error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
