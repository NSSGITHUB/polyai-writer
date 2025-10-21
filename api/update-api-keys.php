<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['keys'])) {
        throw new Exception('缺少 keys 參數');
    }
    
    $keys = $input['keys'];
    $configFile = __DIR__ . '/db-config.php';
    
    // 確保有寫入權限
    if (!file_exists($configFile)) {
        throw new Exception('設定檔不存在: ' . $configFile);
    }
    
    if (!is_writable($configFile)) {
        throw new Exception('設定檔無寫入權限，請檢查檔案權限');
    }
    
    $content = file_get_contents($configFile);
    
    // 更新每個 API 金鑰
    $keysToUpdate = [
        'OPENAI_API_KEY' => $keys['OPENAI_API_KEY'] ?? '',
        'GOOGLE_API_KEY' => $keys['GOOGLE_API_KEY'] ?? '',
        'ANTHROPIC_API_KEY' => $keys['ANTHROPIC_API_KEY'] ?? '',
        'XAI_API_KEY' => $keys['XAI_API_KEY'] ?? ''
    ];
    
    foreach ($keysToUpdate as $keyName => $keyValue) {
        // 轉義單引號
        $escapedValue = str_replace("'", "\\'", $keyValue);
        
        // 使用正則表達式替換對應的 define 行
        $pattern = "/define\('" . $keyName . "',\s*'[^']*'\);/";
        $replacement = "define('" . $keyName . "', '" . $escapedValue . "');";
        
        if (preg_match($pattern, $content)) {
            $content = preg_replace($pattern, $replacement, $content);
        } else {
            // 如果找不到對應的 define，在 AI API Keys 註解後添加
            $insertPattern = "/(\/\/ AI API Keys 設定\n)/";
            $insertReplacement = "$1" . $replacement . "\n";
            $content = preg_replace($insertPattern, $insertReplacement, $content);
        }
    }
    
    // 寫入檔案
    if (file_put_contents($configFile, $content) === false) {
        throw new Exception('無法寫入設定檔');
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'API 金鑰已更新'
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
