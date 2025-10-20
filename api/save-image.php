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
    
    if (!$userId || !$prompt) {
        http_response_code(400);
        echo json_encode(['error' => '缺少必要參數']);
        exit();
    }

    // 建立上傳目錄
    $uploadDir = __DIR__ . '/../uploads/images/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $savedImageUrl = null;
    
    // 如果有 base64 圖片資料，儲存為實體檔案
    if ($imageData && strpos($imageData, 'data:image') === 0) {
        // 解析 base64
        preg_match('/^data:image\/(\w+);base64,/', $imageData, $matches);
        $imageType = $matches[1] ?? 'png';
        $base64Data = preg_replace('/^data:image\/\w+;base64,/', '', $imageData);
        $decodedData = base64_decode($base64Data);
        
        // 生成唯一檔名
        $filename = uniqid('img_') . '_' . time() . '.' . $imageType;
        $filepath = $uploadDir . $filename;
        
        // 寫入檔案
        if (file_put_contents($filepath, $decodedData)) {
            $savedImageUrl = '/uploads/images/' . $filename;
        }
    } else if ($imageUrl) {
        // 如果只有 URL，直接使用
        $savedImageUrl = $imageUrl;
    }

    if (!$savedImageUrl) {
        http_response_code(400);
        echo json_encode(['error' => '無法儲存圖片']);
        exit();
    }

    $pdo = getDBConnection();
    
    $stmt = $pdo->prepare("
        INSERT INTO article_images 
        (article_id, prompt, image_url, width, height, created_at) 
        VALUES (?, ?, ?, ?, ?, NOW())
    ");
    
    $stmt->execute([
        $articleId,
        $prompt,
        $savedImageUrl,
        $width,
        $height
    ]);
    
    $imageId = $pdo->lastInsertId();

    echo json_encode([
        'success' => true,
        'image_id' => $imageId,
        'image_url' => $savedImageUrl,
        'message' => '圖片保存成功'
    ]);

} catch (Exception $e) {
    error_log("Save image error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => '保存圖片失敗: ' . $e->getMessage()]);
}
?>
