<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db-config.php';

try {
    // 讀取請求內容
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['provider_name'])) {
        throw new Exception('缺少 provider_name 參數');
    }
    
    $pdo = getDBConnection();
    
    // 檢查用戶是否為管理員（簡化版本，實際應該驗證 JWT token）
    // TODO: 加入完整的用戶驗證機制
    
    $provider_name = $input['provider_name'];
    $updates = [];
    $params = ['provider_name' => $provider_name];
    
    // 動態構建更新語句
    if (isset($input['api_key']) && $input['api_key'] !== '') {
        $updates[] = "api_key = :api_key";
        $params['api_key'] = $input['api_key'];
    }
    
    if (isset($input['is_enabled'])) {
        $updates[] = "is_enabled = :is_enabled";
        $params['is_enabled'] = $input['is_enabled'] ? 1 : 0;
    }
    
    if (isset($input['api_endpoint'])) {
        $updates[] = "api_endpoint = :api_endpoint";
        $params['api_endpoint'] = $input['api_endpoint'];
    }
    
    if (isset($input['model_name'])) {
        $updates[] = "model_name = :model_name";
        $params['model_name'] = $input['model_name'];
    }
    
    if (empty($updates)) {
        throw new Exception('沒有要更新的欄位');
    }
    
    $sql = "UPDATE ai_providers SET " . implode(', ', $updates) . " WHERE provider_name = :provider_name";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    if ($stmt->rowCount() === 0) {
        throw new Exception('提供者不存在或沒有變更');
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'AI 提供者設定已更新'
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
