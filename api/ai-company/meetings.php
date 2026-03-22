<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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
    // GET - 取得會議列表或單一會議
    if ($method === 'GET') {
        $userId = $_GET['user_id'] ?? '';
        $meetingId = $_GET['meeting_id'] ?? '';

        if ($meetingId) {
            $stmt = $db->prepare('SELECT * FROM ai_meetings WHERE id = ? AND user_id = ?');
            $stmt->execute([$meetingId, $userId]);
            $meeting = $stmt->fetch();

            if (!$meeting) {
                http_response_code(404);
                echo json_encode(['error' => '找不到此會議']);
                exit;
            }

            // 取得參與者
            $stmt = $db->prepare('
                SELECT a.* FROM ai_meeting_participants mp
                JOIN ai_agents a ON a.id = mp.agent_id
                WHERE mp.meeting_id = ?
            ');
            $stmt->execute([$meetingId]);
            $meeting['participants'] = $stmt->fetchAll();

            // 取得決策
            $stmt = $db->prepare('SELECT * FROM ai_decisions WHERE meeting_id = ?');
            $stmt->execute([$meetingId]);
            $meeting['decisions'] = $stmt->fetchAll();

            echo json_encode(['success' => true, 'meeting' => $meeting]);
        } else {
            $stmt = $db->prepare('SELECT * FROM ai_meetings WHERE user_id = ? ORDER BY created_at DESC LIMIT 50');
            $stmt->execute([$userId]);
            $meetings = $stmt->fetchAll();

            foreach ($meetings as &$m) {
                $stmt2 = $db->prepare('SELECT COUNT(*) as cnt FROM ai_meeting_participants WHERE meeting_id = ?');
                $stmt2->execute([$m['id']]);
                $m['participant_count'] = $stmt2->fetch()['cnt'];
            }

            echo json_encode(['success' => true, 'meetings' => $meetings]);
        }
    }

    // POST - 建立新會議
    elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);

        $userId = $data['user_id'] ?? '';
        $title = $data['title'] ?? '';
        $agenda = $data['agenda'] ?? '';
        $meetingType = $data['meeting_type'] ?? 'regular';
        $participantIds = $data['participant_ids'] ?? [];

        if (empty($userId) || empty($title) || empty($agenda)) {
            http_response_code(400);
            echo json_encode(['error' => '缺少必填欄位']);
            exit;
        }

        $stmt = $db->prepare('
            INSERT INTO ai_meetings (user_id, title, agenda, meeting_type, status)
            VALUES (?, ?, ?, ?, "pending")
        ');
        $stmt->execute([$userId, $title, $agenda, $meetingType]);
        $meetingId = $db->lastInsertId();

        // 加入參與者
        if (!empty($participantIds)) {
            $stmtPart = $db->prepare('INSERT INTO ai_meeting_participants (meeting_id, agent_id) VALUES (?, ?)');
            foreach ($participantIds as $agentId) {
                $stmtPart->execute([$meetingId, $agentId]);
            }
        }

        echo json_encode(['success' => true, 'meeting_id' => $meetingId]);
    }

} catch (Exception $e) {
    error_log('ai-company/meetings error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
