<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    require_once 'db-config.php';
    
    // 返回遮罩後的金鑰（只顯示前8個和後4個字符）
    $keys = [
        'OPENAI_API_KEY' => maskApiKey(OPENAI_API_KEY),
        'GOOGLE_API_KEY' => maskApiKey(GOOGLE_API_KEY),
        'ANTHROPIC_API_KEY' => maskApiKey(ANTHROPIC_API_KEY),
        'XAI_API_KEY' => maskApiKey(XAI_API_KEY)
    ];
    
    echo json_encode([
        'success' => true,
        'keys' => $keys
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

function maskApiKey($key) {
    if (empty($key)) {
        return '';
    }
    $length = strlen($key);
    if ($length <= 12) {
        return str_repeat('*', $length);
    }
    return substr($key, 0, 8) . str_repeat('*', $length - 12) . substr($key, -4);
}
