<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
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
    // GET - 取得員工列表或單一員工
    if ($method === 'GET') {
        $userId = $_GET['user_id'] ?? '';
        $agentId = $_GET['agent_id'] ?? '';

        if ($agentId) {
            // 取得單一員工（含技能和最近記憶）
            $stmt = $db->prepare('SELECT * FROM ai_agents WHERE id = ? AND user_id = ?');
            $stmt->execute([$agentId, $userId]);
            $agent = $stmt->fetch();

            if (!$agent) {
                http_response_code(404);
                echo json_encode(['error' => '找不到此員工']);
                exit;
            }

            // 取得技能
            $stmt = $db->prepare('
                SELECT s.*, ags.proficiency
                FROM ai_agent_skills ags
                JOIN ai_skills s ON s.id = ags.skill_id
                WHERE ags.agent_id = ?
            ');
            $stmt->execute([$agentId]);
            $agent['skills'] = $stmt->fetchAll();

            // 取得最近記憶 (最近 10 筆)
            $stmt = $db->prepare('
                SELECT * FROM ai_memory
                WHERE agent_id = ?
                ORDER BY created_at DESC LIMIT 10
            ');
            $stmt->execute([$agentId]);
            $agent['recent_memories'] = $stmt->fetchAll();

            // 取得最近工作日誌 (最近 5 筆)
            $stmt = $db->prepare('
                SELECT * FROM ai_work_logs
                WHERE agent_id = ?
                ORDER BY created_at DESC LIMIT 5
            ');
            $stmt->execute([$agentId]);
            $agent['recent_logs'] = $stmt->fetchAll();

            echo json_encode(['success' => true, 'agent' => $agent]);
        } else {
            // 取得所有員工
            $stmt = $db->prepare('SELECT * FROM ai_agents WHERE user_id = ? ORDER BY role ASC, created_at ASC');
            $stmt->execute([$userId]);
            $agents = $stmt->fetchAll();

            // 附加技能數量
            foreach ($agents as &$agent) {
                $stmt2 = $db->prepare('SELECT COUNT(*) as cnt FROM ai_agent_skills WHERE agent_id = ?');
                $stmt2->execute([$agent['id']]);
                $agent['skill_count'] = $stmt2->fetch()['cnt'];
            }

            echo json_encode(['success' => true, 'agents' => $agents]);
        }
    }

    // POST - 新增員工
    elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);

        $userId = $data['user_id'] ?? '';
        $name = $data['name'] ?? '';
        $title = $data['title'] ?? '';
        $role = $data['role'] ?? 'employee';
        $cLevelType = $data['c_level_type'] ?? null;
        $personality = $data['personality'] ?? '{}';
        $responsibilities = $data['responsibilities'] ?? '';
        $avatarEmoji = $data['avatar_emoji'] ?? '🤖';
        $aiProvider = $data['ai_provider'] ?? 'openai';

        if (empty($userId) || empty($name) || empty($title)) {
            http_response_code(400);
            echo json_encode(['error' => '缺少必填欄位：name, title']);
            exit;
        }

        $stmt = $db->prepare('
            INSERT INTO ai_agents (user_id, name, title, role, c_level_type, personality, responsibilities, avatar_emoji, ai_provider)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([$userId, $name, $title, $role, $cLevelType,
            is_string($personality) ? $personality : json_encode($personality),
            $responsibilities, $avatarEmoji, $aiProvider]);

        $agentId = $db->lastInsertId();

        // 自動分配技能
        if (!empty($data['skill_ids']) && is_array($data['skill_ids'])) {
            $stmtSkill = $db->prepare('INSERT INTO ai_agent_skills (agent_id, skill_id, proficiency) VALUES (?, ?, 50)');
            foreach ($data['skill_ids'] as $skillId) {
                $stmtSkill->execute([$agentId, $skillId]);
            }
        }

        // 新增初始記憶
        $stmt = $db->prepare('INSERT INTO ai_memory (agent_id, memory_type, content, importance) VALUES (?, "learning", ?, 80)');
        $stmt->execute([$agentId, "{$name} 已加入團隊，擔任 {$title}。"]);

        echo json_encode(['success' => true, 'agent_id' => $agentId]);
    }

    // PUT - 更新員工
    elseif ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        $agentId = $data['agent_id'] ?? '';

        if (empty($agentId)) {
            http_response_code(400);
            echo json_encode(['error' => '缺少 agent_id']);
            exit;
        }

        $fields = [];
        $values = [];
        foreach (['name','title','role','c_level_type','personality','responsibilities','avatar_emoji','ai_provider','status'] as $f) {
            if (isset($data[$f])) {
                $fields[] = "$f = ?";
                $val = $data[$f];
                if ($f === 'personality' && !is_string($val)) $val = json_encode($val);
                $values[] = $val;
            }
        }

        if (!empty($fields)) {
            $values[] = $agentId;
            $sql = 'UPDATE ai_agents SET ' . implode(', ', $fields) . ' WHERE id = ?';
            $stmt = $db->prepare($sql);
            $stmt->execute($values);
        }

        // 更新技能
        if (isset($data['skill_ids']) && is_array($data['skill_ids'])) {
            $db->prepare('DELETE FROM ai_agent_skills WHERE agent_id = ?')->execute([$agentId]);
            $stmtSkill = $db->prepare('INSERT INTO ai_agent_skills (agent_id, skill_id, proficiency) VALUES (?, ?, 50)');
            foreach ($data['skill_ids'] as $skillId) {
                $stmtSkill->execute([$agentId, $skillId]);
            }
        }

        echo json_encode(['success' => true]);
    }

    // DELETE - 刪除員工
    elseif ($method === 'DELETE') {
        $agentId = $_GET['agent_id'] ?? '';
        if (empty($agentId)) {
            http_response_code(400);
            echo json_encode(['error' => '缺少 agent_id']);
            exit;
        }

        $stmt = $db->prepare('DELETE FROM ai_agents WHERE id = ?');
        $stmt->execute([$agentId]);

        echo json_encode(['success' => true]);
    }

} catch (Exception $e) {
    error_log('ai-company/agents error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
