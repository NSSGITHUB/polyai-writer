<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../db-config.php';

$data = json_decode(file_get_contents('php://input'), true);
$meetingId = $data['meeting_id'] ?? '';
$userId = $data['user_id'] ?? '';

if (empty($meetingId) || empty($userId)) {
    http_response_code(400);
    echo json_encode(['error' => '缺少 meeting_id 或 user_id']);
    exit;
}

try {
    $db = getDBConnection();

    // 取得會議資料
    $stmt = $db->prepare('SELECT * FROM ai_meetings WHERE id = ? AND user_id = ?');
    $stmt->execute([$meetingId, $userId]);
    $meeting = $stmt->fetch();

    if (!$meeting) {
        http_response_code(404);
        echo json_encode(['error' => '找不到此會議']);
        exit;
    }

    if ($meeting['status'] === 'completed') {
        echo json_encode(['success' => true, 'meeting' => $meeting, 'message' => '此會議已完成']);
        exit;
    }

    // 更新狀態為進行中
    $db->prepare('UPDATE ai_meetings SET status = "in_progress" WHERE id = ?')->execute([$meetingId]);

    // 取得參與者（含個性設定和記憶）
    $stmt = $db->prepare('
        SELECT a.* FROM ai_meeting_participants mp
        JOIN ai_agents a ON a.id = mp.agent_id
        WHERE mp.meeting_id = ?
    ');
    $stmt->execute([$meetingId]);
    $participants = $stmt->fetchAll();

    if (count($participants) < 2) {
        http_response_code(400);
        echo json_encode(['error' => '會議至少需要 2 位參與者']);
        exit;
    }

    // 為每位參與者取得記憶
    foreach ($participants as &$p) {
        $stmt = $db->prepare('SELECT content FROM ai_memory WHERE agent_id = ? ORDER BY importance DESC, created_at DESC LIMIT 5');
        $stmt->execute([$p['id']]);
        $p['memories'] = array_column($stmt->fetchAll(), 'content');
    }
    unset($p);

    // 建構會議討論 prompt
    $agenda = $meeting['agenda'];
    $meetingType = $meeting['meeting_type'];

    // 第一輪：每位參與者發表看法
    $discussion = [];
    $allStatements = [];

    foreach ($participants as $p) {
        $personality = json_decode($p['personality'], true) ?: [];
        $traits = $personality['traits'] ?? '專業、理性';
        $commStyle = $personality['communication_style'] ?? '直接';
        $decisionStyle = $personality['decision_style'] ?? '數據驅動';
        $memoriesText = !empty($p['memories']) ? "\n過往經驗：" . implode('；', $p['memories']) : '';

        $prompt = "你是一間公司的 {$p['title']}，名字叫 {$p['name']}。
你的性格特質：{$traits}
溝通風格：{$commStyle}
決策風格：{$decisionStyle}
職責範圍：{$p['responsibilities']}
{$memoriesText}

現在正在參加一場「{$meetingType}」類型的會議。
會議議題：{$agenda}

請以你的角色和專業觀點，針對議題發表你的看法和建議。
回覆要求：
1. 用繁體中文回答
2. 保持角色個性，有時可以直接反對或挑戰他人觀點
3. 300-500字以內
4. 提出具體的觀點和理由";

        $statement = callAI($p['ai_provider'], $prompt);
        $discussion[] = [
            'agent_id' => $p['id'],
            'agent_name' => $p['name'],
            'agent_title' => $p['title'],
            'agent_emoji' => $p['avatar_emoji'],
            'round' => 1,
            'content' => $statement,
            'type' => 'statement'
        ];
        $allStatements[] = "{$p['name']}（{$p['title']}）：{$statement}";
    }

    // 第二輪：回應和辯論
    $contextSoFar = implode("\n\n", $allStatements);

    foreach ($participants as $p) {
        $personality = json_decode($p['personality'], true) ?: [];
        $traits = $personality['traits'] ?? '專業、理性';

        $prompt = "你是 {$p['name']}（{$p['title']}），性格：{$traits}。

會議議題：{$agenda}

以下是大家的第一輪發言：
{$contextSoFar}

現在進入第二輪討論。請針對其他人的觀點提出你的看法：
- 你同意或不同意誰的觀點？為什麼？
- 有沒有大家忽略的重要面向？
- 你願意在哪些方面妥協，哪些方面堅持？

用繁體中文回答，300字以內。保持你的角色個性，可以激烈辯論。";

        $rebuttal = callAI($p['ai_provider'], $prompt);
        $discussion[] = [
            'agent_id' => $p['id'],
            'agent_name' => $p['name'],
            'agent_title' => $p['title'],
            'agent_emoji' => $p['avatar_emoji'],
            'round' => 2,
            'content' => $rebuttal,
            'type' => 'debate'
        ];
        $allStatements[] = "[第二輪] {$p['name']}：{$rebuttal}";
    }

    // 第三輪：總結與決策建議（由一位 AI 彙整）
    $fullDiscussion = implode("\n\n", $allStatements);
    $summaryPrompt = "你是一位專業的會議記錄人員。以下是一場公司高層會議的完整討論內容：

會議議題：{$agenda}
會議類型：{$meetingType}

討論內容：
{$fullDiscussion}

請用繁體中文完成以下工作：

1.【會議摘要】用 3-5 句話總結會議主要討論方向

2.【決策建議】整理出 1-3 個具體的決策建議，每個建議包含：
   - 建議標題
   - 具體內容
   - 優點（2-3個）
   - 缺點或風險（1-2個）
   - 優先級（critical/high/medium/low）

3.【爭議焦點】列出團隊意見分歧最大的 1-2 個點

4.【下一步行動】建議接下來應該做什麼

請用清楚的結構回覆。";

    $summary = callAI('openai', $summaryPrompt);

    $discussion[] = [
        'agent_id' => null,
        'agent_name' => '會議記錄',
        'agent_title' => '幕僚長',
        'agent_emoji' => '📋',
        'round' => 3,
        'content' => $summary,
        'type' => 'summary'
    ];

    // 儲存結果
    $db->prepare('
        UPDATE ai_meetings
        SET status = "completed", discussion = ?, summary = ?, completed_at = NOW()
        WHERE id = ?
    ')->execute([json_encode($discussion, JSON_UNESCAPED_UNICODE), $summary, $meetingId]);

    // 解析決策建議並儲存
    $decisions = extractDecisions($summary, $meetingId, $userId);
    foreach ($decisions as $dec) {
        $db->prepare('
            INSERT INTO ai_decisions (meeting_id, user_id, title, recommendation, pros, cons, priority)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ')->execute([
            $meetingId, $userId,
            $dec['title'], $dec['recommendation'],
            json_encode($dec['pros'] ?? [], JSON_UNESCAPED_UNICODE),
            json_encode($dec['cons'] ?? [], JSON_UNESCAPED_UNICODE),
            $dec['priority'] ?? 'medium'
        ]);
    }

    // 為每位參與者新增記憶
    foreach ($participants as $p) {
        $db->prepare('
            INSERT INTO ai_memory (agent_id, memory_type, content, context, importance)
            VALUES (?, "interaction", ?, ?, 70)
        ')->execute([
            $p['id'],
            "參加了關於「{$agenda}」的會議，討論了相關策略與方案。",
            "meeting_id:{$meetingId}"
        ]);
    }

    // 為每位參與者新增工作日誌
    foreach ($participants as $p) {
        $db->prepare('
            INSERT INTO ai_work_logs (agent_id, log_type, content)
            VALUES (?, "report", ?)
        ')->execute([
            $p['id'],
            "參與會議：{$meeting['title']}。議題：{$agenda}。"
        ]);
    }

    // 回傳結果
    $stmt = $db->prepare('SELECT * FROM ai_meetings WHERE id = ?');
    $stmt->execute([$meetingId]);
    $updatedMeeting = $stmt->fetch();

    echo json_encode([
        'success' => true,
        'meeting' => $updatedMeeting,
        'discussion' => $discussion
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    error_log('run-meeting error: ' . $e->getMessage());
    // 恢復會議狀態
    if (isset($db) && isset($meetingId)) {
        $db->prepare('UPDATE ai_meetings SET status = "pending" WHERE id = ?')->execute([$meetingId]);
    }
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

// === Helper Functions ===

function callAI($provider, $prompt) {
    $provider = strtolower($provider);

    if ($provider === 'anthropic') {
        return callAnthropic($prompt);
    } elseif ($provider === 'google') {
        return callGoogle($prompt);
    } elseif ($provider === 'xai') {
        return callXai($prompt);
    } else {
        return callOpenAI($prompt);
    }
}

function callOpenAI($prompt) {
    $apiKey = OPENAI_API_KEY;
    if (empty($apiKey)) throw new Exception('OPENAI_API_KEY not configured');

    $ch = curl_init('https://api.openai.com/v1/chat/completions');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_TIMEOUT => 120,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Authorization: Bearer ' . $apiKey],
        CURLOPT_POSTFIELDS => json_encode([
            'model' => 'gpt-4o-mini',
            'messages' => [
                ['role' => 'system', 'content' => '你是一位專業的企業高管。用繁體中文回覆。'],
                ['role' => 'user', 'content' => $prompt]
            ],
            'max_completion_tokens' => 2000
        ])
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        throw new Exception("OpenAI API error ({$httpCode}): {$response}");
    }

    $data = json_decode($response, true);
    return $data['choices'][0]['message']['content'] ?? '';
}

function callAnthropic($prompt) {
    $apiKey = ANTHROPIC_API_KEY;
    if (empty($apiKey)) return callOpenAI($prompt); // fallback

    $ch = curl_init('https://api.anthropic.com/v1/messages');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_TIMEOUT => 120,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'x-api-key: ' . $apiKey,
            'anthropic-version: 2023-06-01'
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'model' => 'claude-3-5-sonnet-20241022',
            'max_tokens' => 2000,
            'messages' => [['role' => 'user', 'content' => $prompt]]
        ])
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        return callOpenAI($prompt); // fallback to OpenAI
    }

    $data = json_decode($response, true);
    return $data['content'][0]['text'] ?? '';
}

function callGoogle($prompt) {
    $apiKey = GOOGLE_API_KEY;
    if (empty($apiKey)) return callOpenAI($prompt);

    $ch = curl_init("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key={$apiKey}");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_TIMEOUT => 120,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode([
            'contents' => [['parts' => [['text' => $prompt]]]],
            'generationConfig' => ['temperature' => 0.8, 'maxOutputTokens' => 2000]
        ])
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) return callOpenAI($prompt);

    $data = json_decode($response, true);
    return $data['candidates'][0]['content']['parts'][0]['text'] ?? '';
}

function callXai($prompt) {
    $apiKey = XAI_API_KEY;
    if (empty($apiKey)) return callOpenAI($prompt);

    $ch = curl_init('https://api.x.ai/v1/chat/completions');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_TIMEOUT => 120,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Authorization: Bearer ' . $apiKey],
        CURLOPT_POSTFIELDS => json_encode([
            'model' => 'grok-beta',
            'messages' => [
                ['role' => 'system', 'content' => '你是一位專業的企業高管。用繁體中文回覆。'],
                ['role' => 'user', 'content' => $prompt]
            ],
            'max_tokens' => 2000,
            'temperature' => 0.8
        ])
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) return callOpenAI($prompt);

    $data = json_decode($response, true);
    return $data['choices'][0]['message']['content'] ?? '';
}

function extractDecisions($summary, $meetingId, $userId) {
    // 簡單解析決策建議
    $decisions = [];
    $lines = explode("\n", $summary);
    $currentDecision = null;

    foreach ($lines as $line) {
        $line = trim($line);
        if (preg_match('/建議[一二三四五\d]|決策建議\s*\d/u', $line) || preg_match('/^[\d]+[\.\、]/u', $line)) {
            if ($currentDecision && !empty($currentDecision['title'])) {
                $decisions[] = $currentDecision;
            }
            $title = preg_replace('/^[\d]+[\.\、]\s*/', '', $line);
            $title = preg_replace('/^建議[一二三四五\d][\.\、：:\s]*/u', '', $title);
            $currentDecision = [
                'title' => mb_substr($title, 0, 100),
                'recommendation' => '',
                'pros' => [],
                'cons' => [],
                'priority' => 'medium'
            ];
        } elseif ($currentDecision) {
            if (mb_strpos($line, '優點') !== false || mb_strpos($line, '好處') !== false) {
                // skip header
            } elseif (mb_strpos($line, '缺點') !== false || mb_strpos($line, '風險') !== false) {
                // skip header
            } elseif (mb_strpos($line, 'critical') !== false) {
                $currentDecision['priority'] = 'critical';
            } elseif (mb_strpos($line, 'high') !== false || mb_strpos($line, '高') !== false) {
                $currentDecision['priority'] = 'high';
            } else {
                $currentDecision['recommendation'] .= $line . "\n";
            }
        }
    }

    if ($currentDecision && !empty($currentDecision['title'])) {
        $decisions[] = $currentDecision;
    }

    // 如果解析失敗，至少產生一個總結性決策
    if (empty($decisions)) {
        $decisions[] = [
            'title' => '會議綜合決策建議',
            'recommendation' => $summary,
            'pros' => [],
            'cons' => [],
            'priority' => 'medium'
        ];
    }

    return $decisions;
}
?>
