<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

require_once 'db-config.php';

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $userId = $input['user_id'] ?? null;
    $articleId = $input['article_id'] ?? null;
    $prompt = $input['prompt'] ?? null;
    $imageUrl = $input['image_url'] ?? null;
    $imageData = $input['image_data'] ?? null;
    $width = $input['width'] ?? 1024;
    $height = $input['height'] ?? 1024;
    
    if (!$userId || !$prompt || !$imageUrl) {
        http_response_code(400);
        echo json_encode(['error' => '缺少必要參數']);
        exit();
    }

    $pdo = getDBConnection();
    
    $stmt = $pdo->prepare("
        INSERT INTO article_images 
        (article_id, prompt, image_url, image_data, width, height, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, NOW())
    ");
    
    $stmt->execute([
        $articleId,
        $prompt,
        $imageUrl,
        $imageData,
        $width,
        $height
    ]);
    
    $imageId = $pdo->lastInsertId();

    echo json_encode([
        'success' => true,
        'image_id' => $imageId,
        'message' => '圖片保存成功'
    ]);

} catch (Exception $e) {
    error_log("Save image error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => '保存圖片失敗']);
}
?>
