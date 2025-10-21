<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db-config.php';

try {
    $pdo = getDBConnection();
    
    // 獲取所有 AI 提供者（隱藏完整 API 金鑰）
    $stmt = $pdo->prepare("
        SELECT 
            id,
            provider_name,
            provider_label,
            CASE 
                WHEN api_key IS NOT NULL AND api_key != '' 
                THEN CONCAT(LEFT(api_key, 8), '...', RIGHT(api_key, 4))
                ELSE NULL
            END as masked_api_key,
            CASE 
                WHEN api_key IS NOT NULL AND api_key != '' 
                THEN 1
                ELSE 0
            END as has_api_key,
            is_enabled,
            api_endpoint,
            model_name,
            description,
            updated_at
        FROM ai_providers
        ORDER BY 
            CASE provider_name
                WHEN 'openai' THEN 1
                WHEN 'google' THEN 2
                WHEN 'anthropic' THEN 3
                ELSE 4
            END
    ");
    
    $stmt->execute();
    $providers = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'providers' => $providers
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
