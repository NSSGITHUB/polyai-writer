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

// 建構 prompt
$prompt = "請以{$language}撰寫一篇約 {$wordCount} 字、風格為「{$style}」的 SEO 文章，主題為：「{$topic}」。\n\n";
if (!empty($keywords)) {
    $prompt .= "請自然融入以下關鍵字（勿堆疊）：{$keywords}\n";
}
if (!empty($outline)) {
    $prompt .= "可依照此大綱調整結構：\n{$outline}\n\n";
}
$prompt .= "要求：\n- 以清楚的小標題與段落結構呈現（使用 H2/H3 的層次感）。\n- 提供具體事例或資料點，避免空泛。\n- 開頭 1 段說明重點，結尾提供總結與行動呼籲。\n- 語氣自然、易讀、避免重複贅詞。";

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
            'max_tokens' => (int)($wordCount * 1.5),
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
                'maxOutputTokens' => (int)($wordCount * 1.5)
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
            'max_tokens' => (int)($wordCount * 1.5),
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
            'max_tokens' => (int)($wordCount * 1.5),
            'temperature' => 0.7
        ]));

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if ($response === false) {
            $err = curl_error($ch);
            curl_close($ch);
            throw new Exception('xAI cURL error: ' . $err);
        }
        
        if ($httpCode !== 200) {
            $body = $response;
            curl_close($ch);
            throw new Exception('xAI API error (' . $httpCode . '): ' . $body);
        }

        $responseData = json_decode($response, true);
        $generatedText = $responseData['choices'][0]['message']['content'] ?? '';
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