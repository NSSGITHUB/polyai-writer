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

// 建構 prompt
$prompt = "【重要】請以{$language}撰寫一篇完整的 SEO 文章，主題為：「{$topic}」。\n\n";
$prompt .= "【字數要求】文章總字數必須達到 {$wordCount} 字以上，請確實達到此字數要求。\n\n";
$prompt .= "【風格要求】文章風格為「{$style}」。\n\n";
if (!empty($keywords)) {
    $prompt .= "【關鍵字】請自然融入以下關鍵字（勿堆疊）：{$keywords}\n\n";
}
if (!empty($outline)) {
    $prompt .= "【大綱參考】可依照此大綱調整結構：\n{$outline}\n\n";
}
$prompt .= "【內容要求】\n";
$prompt .= "1. 文章結構：開頭引言、多個主體段落（每段150-300字）、結尾總結\n";
$prompt .= "2. 內容深度：每個要點都要充分展開說明，提供具體事例、數據或案例\n";
$prompt .= "3. 段落安排：至少包含5-8個主要段落，每段都要有實質內容\n";
$prompt .= "4. 開頭段落：清楚說明文章主題和重點（150字以上）\n";
$prompt .= "5. 結尾段落：提供完整總結與明確的行動呼籲（150字以上）\n";
$prompt .= "6. 語氣風格：自然流暢、易於閱讀、避免重複贅詞\n";
$prompt .= "7. 格式要求：使用純文字格式，不要使用 Markdown 符號如 #、*、-、[]、** 等\n";
$prompt .= "8. 內容充實：避免空泛陳述，每個觀點都要有充分的說明和例證\n\n";
$prompt .= "【再次提醒】請務必確保文章達到 {$wordCount} 字以上，內容要充實完整，不要過於簡短。";

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
        curl_setopt($ch, CURLOPT_TIMEOUT, 60);
        curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey
        ]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'model' => 'gpt-4o-mini',
            'messages' => [
                ['role' => 'system', 'content' => 'You are a helpful SEO content writer.'],
                ['role' => 'user', 'content' => $prompt]
            ],
            'max_tokens' => (int)($wordCount * 2.5),
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
            throw new Exception('OpenAI API error (' . $httpCode . '): ' . $body);
        }

        $responseData = json_decode($response, true);
        $generatedText = $responseData['choices'][0]['message']['content'] ?? '';
        $generatedText = cleanMarkdown($generatedText);
        curl_close($ch);
    }

    // Google Gemini
    elseif ($provider === 'google') {
        $apiKey = GOOGLE_API_KEY;
        if (empty($apiKey)) {
            throw new Exception('GOOGLE_API_KEY not configured');
        }

        $ch = curl_init("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={$apiKey}");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 60);
        curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'contents' => [['parts' => [['text' => $prompt]]]],
            'generationConfig' => [
                'temperature' => 0.7,
                'maxOutputTokens' => (int)($wordCount * 2.5)
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
        curl_setopt($ch, CURLOPT_TIMEOUT, 60);
        curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'x-api-key: ' . $apiKey,
            'anthropic-version: 2023-06-01'
        ]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'model' => 'claude-3-5-sonnet-20241022',
            'max_tokens' => (int)($wordCount * 2.5),
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
        curl_setopt($ch, CURLOPT_TIMEOUT, 60);
        curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey
        ]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'model' => 'grok-beta',
            'messages' => [
                ['role' => 'system', 'content' => 'You are a helpful SEO content writer.'],
                ['role' => 'user', 'content' => $prompt]
            ],
            'max_tokens' => (int)($wordCount * 2.5),
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