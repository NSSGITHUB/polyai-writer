<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

require_once __DIR__ . '/../db-config.php';

$data = json_decode(file_get_contents('php://input'), true);
$userId = $data['user_id'] ?? '';

if (empty($userId)) {
    http_response_code(400);
    echo json_encode(['error' => '缺少 user_id']);
    exit;
}

try {
    $db = getDBConnection();

    // 檢查是否已有團隊
    $stmt = $db->prepare('SELECT COUNT(*) as cnt FROM ai_agents WHERE user_id = ?');
    $stmt->execute([$userId]);
    if ($stmt->fetch()['cnt'] > 0) {
        echo json_encode(['success' => true, 'message' => '團隊已存在', 'already_exists' => true]);
        exit;
    }

    // 建立 7 位 C-Level 主管
    $team = [
        [
            'name' => '陳策略',
            'title' => '執行長 CEO',
            'c_level_type' => 'CEO',
            'avatar_emoji' => '👔',
            'personality' => json_encode([
                'traits' => '果斷、有遠見、善於激勵團隊、偶爾固執',
                'communication_style' => '簡潔有力，喜歡直奔主題',
                'decision_style' => '直覺與數據並重，重視長期戰略'
            ], JSON_UNESCAPED_UNICODE),
            'responsibilities' => '公司整體戰略方向、重大決策、跨部門協調、對外關係',
            'skills' => [1, 9] // 策略規劃, 風險管理
        ],
        [
            'name' => '林技術',
            'title' => '技術長 CTO',
            'c_level_type' => 'CTO',
            'avatar_emoji' => '💻',
            'personality' => json_encode([
                'traits' => '邏輯嚴謹、追求完美、有點技術潔癖、喜歡用數據說話',
                'communication_style' => '技術導向，喜歡深入分析，有時太過細節',
                'decision_style' => '純數據驅動，重視技術可行性和擴展性'
            ], JSON_UNESCAPED_UNICODE),
            'responsibilities' => '技術架構決策、研發方向、技術團隊管理、技術債務管理',
            'skills' => [4, 12] // 技術架構, 創新研發
        ],
        [
            'name' => '王行銷',
            'title' => '行銷長 CMO',
            'c_level_type' => 'CMO',
            'avatar_emoji' => '📣',
            'personality' => json_encode([
                'traits' => '創意豐富、善於溝通、情感敏銳、有時過於樂觀',
                'communication_style' => '熱情洋溢，善用故事和比喻，有感染力',
                'decision_style' => '市場感覺與數據結合，重視品牌價值'
            ], JSON_UNESCAPED_UNICODE),
            'responsibilities' => '品牌策略、市場推廣、客戶獲取、內容行銷、社群經營',
            'skills' => [2, 8] // 市場分析, 品牌行銷
        ],
        [
            'name' => '張財務',
            'title' => '財務長 CFO',
            'c_level_type' => 'CFO',
            'avatar_emoji' => '💰',
            'personality' => json_encode([
                'traits' => '謹慎保守、數字敏感、風險意識強、有時太過節省',
                'communication_style' => '精確、喜歡用數字和報表說話，注重投資報酬率',
                'decision_style' => '完全數據驅動，每個決策都要算ROI'
            ], JSON_UNESCAPED_UNICODE),
            'responsibilities' => '財務規劃、預算管理、投資評估、成本控制、財務報告',
            'skills' => [3, 9] // 財務分析, 風險管理
        ],
        [
            'name' => '李營運',
            'title' => '營運長 COO',
            'c_level_type' => 'COO',
            'avatar_emoji' => '⚙️',
            'personality' => json_encode([
                'traits' => '務實高效、注重執行力、善於流程優化、有點工作狂',
                'communication_style' => '直接了當，專注在可行方案和時程上',
                'decision_style' => '效率優先，重視可執行性和資源配置'
            ], JSON_UNESCAPED_UNICODE),
            'responsibilities' => '日常營運管理、流程優化、品質管控、供應鏈管理',
            'skills' => [7, 11] // 營運管理, 客戶關係
        ],
        [
            'name' => '趙產品',
            'title' => '產品長 CPO',
            'c_level_type' => 'CPO',
            'avatar_emoji' => '🎯',
            'personality' => json_encode([
                'traits' => '用戶導向、創新思維、善於平衡需求、有時理想化',
                'communication_style' => '喜歡從用戶角度出發，善用用戶故事和場景描述',
                'decision_style' => '用戶數據驅動，重視產品市場契合度'
            ], JSON_UNESCAPED_UNICODE),
            'responsibilities' => '產品戰略、需求管理、用戶體驗、產品路線圖',
            'skills' => [5, 10] // 產品設計, 數據分析
        ],
        [
            'name' => '吳人資',
            'title' => '人資長 CHRO',
            'c_level_type' => 'CHRO',
            'avatar_emoji' => '🤝',
            'personality' => json_encode([
                'traits' => '溫和empathetic、重視團隊文化、善於調解、有時太過溫情',
                'communication_style' => '關懷式溝通，重視每個人的想法，善於引導共識',
                'decision_style' => '人本主義，重視團隊士氣和文化價值'
            ], JSON_UNESCAPED_UNICODE),
            'responsibilities' => '人才招募、團隊文化、績效管理、員工發展、組織設計',
            'skills' => [6, 11] // 人才管理, 客戶關係
        ]
    ];

    $stmtAgent = $db->prepare('
        INSERT INTO ai_agents (user_id, name, title, role, c_level_type, personality, responsibilities, avatar_emoji, ai_provider)
        VALUES (?, ?, ?, "c-level", ?, ?, ?, ?, "openai")
    ');
    $stmtSkill = $db->prepare('INSERT IGNORE INTO ai_agent_skills (agent_id, skill_id, proficiency) VALUES (?, ?, ?)');
    $stmtMemory = $db->prepare('INSERT INTO ai_memory (agent_id, memory_type, content, importance) VALUES (?, "learning", ?, 90)');

    $createdAgents = [];

    foreach ($team as $member) {
        $stmtAgent->execute([
            $userId,
            $member['name'],
            $member['title'],
            $member['c_level_type'],
            $member['personality'],
            $member['responsibilities'],
            $member['avatar_emoji']
        ]);
        $agentId = $db->lastInsertId();

        foreach ($member['skills'] as $skillId) {
            $stmtSkill->execute([$agentId, $skillId, 70]);
        }

        $stmtMemory->execute([$agentId, "我是 {$member['name']}，擔任 {$member['title']}，剛加入這個團隊。我的職責是{$member['responsibilities']}。"]);

        $createdAgents[] = [
            'id' => $agentId,
            'name' => $member['name'],
            'title' => $member['title'],
            'c_level_type' => $member['c_level_type'],
            'avatar_emoji' => $member['avatar_emoji']
        ];
    }

    echo json_encode([
        'success' => true,
        'message' => '已成功建立 7 位 C-Level 主管團隊！',
        'agents' => $createdAgents
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    error_log('init-team error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
