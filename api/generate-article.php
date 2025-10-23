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

$data = json_decode(file_get_contents('php://input'), true);

$provider = $data['provider'] ?? '';
$topic = $data['topic'] ?? '';
$keywords = $data['keywords'] ?? '';
$outline = $data['outline'] ?? '';
$language = $data['language'] ?? 'zh-TW';
$style = $data['style'] ?? 'professional';
$wordCount = $data['wordCount'] ?? 1000;

if (empty($topic)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required field: topic']);
    exit;
}

if (empty($provider)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required field: provider']);
    exit;
}

// 清理 Markdown 特殊符號的函數
function cleanMarkdown($text) {
    // 移除 Markdown 標題符號 (##, ###)
    $text = preg_replace('/^#{1,6}\s+/m', '', $text);
    
    // 移除粗體和斜體符號 (**, *, __, _)
    $text = preg_replace('/(\*\*|__)(.*?)\1/', '$2', $text);
    $text = preg_replace('/(\*|_)(.*?)\1/', '$2', $text);
    
    // 移除列表符號 (-, *, +)
    $text = preg_replace('/^[\*\-\+]\s+/m', '', $text);
    
    // 移除連結語法 [text](url)
    $text = preg_replace('/\[([^\]]+)\]\([^\)]+\)/', '$1', $text);
    
    // 移除圖片語法 ![alt](url)
    $text = preg_replace('/!\[([^\]]*)\]\([^\)]+\)/', '', $text);
    
    // 移除程式碼區塊符號 (```, `)
    $text = preg_replace('/```[a-z]*\n/', '', $text);
    $text = str_replace('```', '', $text);
    $text = preg_replace('/`([^`]+)`/', '$1', $text);
    
    // 移除引用符號 (>)
    $text = preg_replace('/^>\s+/m', '', $text);
    
    // 移除水平線 (---, ***)
    $text = preg_replace('/^(\-{3,}|\*{3,}|_{3,})$/m', '', $text);
    
    return trim($text);
}

// 建構 prompt - 根據不同提供商調整
function buildPrompt($provider, $language, $topic, $style, $keywords, $outline, $wordCount) {
    $basePrompt = "【重要：字數要求】請以{$language}撰寫一篇完整的 SEO 文章，主題為：「{$topic}」。\n\n";
    
    // 針對不同AI調整字數要求說明
    if ($provider === 'google') {
        $basePrompt .= "【嚴格字數限制】文章總字數必須精確控制在 {$wordCount} 字左右，誤差範圍在±10%以內。絕對不可超過 " . (int)($wordCount * 1.15) . " 字！\n";
        $basePrompt .= "請特別注意：寫作時必須嚴格控制篇幅，達到目標字數後立即結束，不要過度延伸內容。\n\n";
    } else {
        $basePrompt .= "【關鍵要求】文章總字數必須達到 {$wordCount} 字，這是最低要求，不可少於此字數！\n";
        $basePrompt .= "請注意：{$wordCount} 字是必須達到的最低字數，請確保文章內容充實到足以達到此字數要求。\n\n";
    }
    
    $basePrompt .= "【風格要求】文章風格為「{$style}」。\n\n";
    
    if (!empty($keywords)) {
        $basePrompt .= "【關鍵字】請自然融入以下關鍵字（勿堆疊）：{$keywords}\n\n";
    }
    
    if (!empty($outline)) {
        $basePrompt .= "【大綱參考】可依照此大綱調整結構：\n{$outline}\n\n";
    }
    
    $basePrompt .= "【內容要求】\n";
    $basePrompt .= "1. 文章結構：開頭引言、多個主體段落（每段200-400字）、結尾總結\n";
    $basePrompt .= "2. 內容深度：每個要點都要充分展開說明，提供具體事例、數據、案例和詳細解釋\n";
    $basePrompt .= "3. 段落安排：根據字數要求調整段落數量，確保每段都有實質內容\n";
    $basePrompt .= "   - 1000字以下：至少5段\n";
    $basePrompt .= "   - 2000-4000字：至少8-10段\n";
    $basePrompt .= "   - 5000字以上：至少12-15段\n";
    $basePrompt .= "4. 開頭段落：清楚說明文章主題和重點（200-300字）\n";
    $basePrompt .= "5. 結尾段落：提供完整總結與明確的行動呼籲（200-300字）\n";
    $basePrompt .= "6. 語氣風格：自然流暢、易於閱讀、避免重複贅詞\n";
    $basePrompt .= "7. 格式要求：使用純文字格式，不要使用 Markdown 符號如 #、*、-、[]、** 等\n";
    $basePrompt .= "8. 內容充實：避免空泛陳述，每個觀點都要有充分的說明、例證和詳細闡述\n";
    $basePrompt .= "9. 字數檢查：寫作時請持續確認字數，確保最終達到目標字數\n\n";
    
    // 針對不同AI的最後強調
    if ($provider === 'google') {
        $basePrompt .= "【最後強調】文章必須控制在 {$wordCount} 字左右（±10%），不要過度擴充內容！";
    } else {
        $basePrompt .= "【最後強調】文章必須完整達到 {$wordCount} 字，這是強制要求。請寫得詳細充實，不要過於簡短或概括。";
    }
    
    return $basePrompt;
}

$prompt = buildPrompt($provider, $language, $topic, $style, $keywords, $outline, $wordCount);

$generatedText = '';

try {
    // Load API keys from config
    require_once __DIR__ . '/db-config.php';
    
    // OpenAI GPT
    if ($provider === 'openai') {
        $apiKey = OPENAI_API_KEY;
        if (empty($apiKey)) {
            throw new Exception('OPENAI_API_KEY not configured');
        }

        $ch = curl_init('https://api.openai.com/v1/chat/completions');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 180);
        curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey
        ]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'model' => 'gpt-4o-mini', // 使用實際存在的模型
            'messages' => [
                ['role' => 'system', 'content' => 'You are a professional SEO content writer. Always write complete articles that meet the exact word count requirements. Make sure to write fully detailed content to reach the target word count.'],
                ['role' => 'user', 'content' => $prompt]
            ],
            'max_tokens' => min((int)($wordCount * 5), 16000), // gpt-4o-mini 使用 max_tokens
            'temperature' => 0.7
        ]));

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if ($response === false) {
            $err = curl_error($ch);
            curl_close($ch);
            throw new Exception('OpenAI cURL error: ' . $err);
        }
        
        if ($httpCode !== 200) {
            $body = $response;
            curl_close($ch);
            $errorDetail = json_decode($body, true);
            $errorMsg = $errorDetail['error']['message'] ?? $body;
            
            // 檢查常見錯誤
            if ($httpCode === 401) {
                throw new Exception('OpenAI API Key 無效或已過期，請檢查金鑰設定');
            } elseif ($httpCode === 429) {
                throw new Exception('OpenAI API 請求過於頻繁或配額已用完，請稍後再試或充值帳戶');
            } elseif ($httpCode === 402) {
                throw new Exception('OpenAI 帳戶餘額不足，請前往 OpenAI 網站充值');
            } else {
                throw new Exception('OpenAI API 錯誤 (' . $httpCode . '): ' . $errorMsg);
            }
        }

        $responseData = json_decode($response, true);
        
        if (!isset($responseData['choices'][0]['message']['content'])) {
            curl_close($ch);
            error_log('OpenAI response structure: ' . json_encode($responseData));
            throw new Exception('OpenAI API 回應格式異常，請查看伺服器日誌');
        }
        
        $generatedText = $responseData['choices'][0]['message']['content'];
        $generatedText = cleanMarkdown($generatedText);
        curl_close($ch);
    }

    // Google Gemini
    elseif ($provider === 'google') {
        $apiKey = GOOGLE_API_KEY;
        if (empty($apiKey)) {
            throw new Exception('GOOGLE_API_KEY not configured');
        }

        $ch = curl_init("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key={$apiKey}");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 180);
        curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'contents' => [['parts' => [['text' => $prompt]]]],
            'generationConfig' => [
                'temperature' => 0.7,
                'maxOutputTokens' => min((int)($wordCount * 2.5), 8000) // 更保守的token限制
            ]
        ]));

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if ($response === false) {
            $err = curl_error($ch);
            curl_close($ch);
            throw new Exception('Google cURL error: ' . $err);
        }
        
        if ($httpCode !== 200) {
            $body = $response;
            curl_close($ch);
            throw new Exception('Google API error (' . $httpCode . '): ' . $body);
        }

        $responseData = json_decode($response, true);
        $generatedText = $responseData['candidates'][0]['content']['parts'][0]['text'] ?? '';
        $generatedText = cleanMarkdown($generatedText);
        curl_close($ch);
    }

    // Anthropic Claude
    elseif ($provider === 'anthropic') {
        $apiKey = ANTHROPIC_API_KEY;
        if (empty($apiKey)) {
            throw new Exception('ANTHROPIC_API_KEY not configured');
        }

        $ch = curl_init('https://api.anthropic.com/v1/messages');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 180);
        curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'x-api-key: ' . $apiKey,
            'anthropic-version: 2023-06-01'
        ]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'model' => 'claude-3-5-sonnet-20241022',
            'max_tokens' => (int)($wordCount * 4),
            'messages' => [
                ['role' => 'user', 'content' => $prompt]
            ]
        ]));

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if ($response === false) {
            $err = curl_error($ch);
            curl_close($ch);
            throw new Exception('Anthropic cURL error: ' . $err);
        }
        
        if ($httpCode !== 200) {
            $body = $response;
            curl_close($ch);
            throw new Exception('Anthropic API error (' . $httpCode . '): ' . $body);
        }

        $responseData = json_decode($response, true);
        $generatedText = $responseData['content'][0]['text'] ?? '';
        $generatedText = cleanMarkdown($generatedText);
        curl_close($ch);
    }

    // xAI Grok
    elseif ($provider === 'xai') {
        $apiKey = XAI_API_KEY;
        if (empty($apiKey)) {
            throw new Exception('XAI_API_KEY not configured');
        }

        $ch = curl_init('https://api.x.ai/v1/chat/completions');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 180);
        curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey
        ]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'model' => 'grok-beta',
            'messages' => [
                ['role' => 'system', 'content' => 'You are a professional SEO content writer. Always write complete articles that meet the exact word count requirements.'],
                ['role' => 'user', 'content' => $prompt]
            ],
            'max_tokens' => (int)($wordCount * 4),
            'temperature' => 0.7
        ]));

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if ($response === false) {
            $err = curl_error($ch);
            curl_close($ch);
            throw new Exception('xAI/Manus cURL error: ' . $err);
        }
        
        if ($httpCode !== 200) {
            $body = $response;
            curl_close($ch);
            throw new Exception('xAI/Manus API error (' . $httpCode . '): ' . $body);
        }

        $responseData = json_decode($response, true);
        $generatedText = $responseData['choices'][0]['message']['content'] ?? '';
        $generatedText = cleanMarkdown($generatedText);
        curl_close($ch);
    }

    else {
        throw new Exception('Unknown provider: ' . $provider);
    }

    echo json_encode([
        'generatedText' => $generatedText,
        'provider' => $provider
    ]);

} catch (Exception $e) {
    error_log('generate-article error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>