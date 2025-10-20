<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

require_once 'db-config.php';

try {
    $userId = $_GET['user_id'] ?? null;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['error' => '需要提供用戶ID']);
        exit();
    }

    $pdo = getDBConnection();
    
    // 獲取圖片列表（關聯文章來驗證用戶權限）
    $stmt = $pdo->prepare("
        SELECT 
            ai.id,
            ai.article_id,
            ai.prompt,
            COALESCE(ai.image_data, ai.image_url) as image_url,
            ai.width,
            ai.height,
            ai.is_selected,
            ai.created_at,
            a.title as article_title
        FROM article_images ai
        LEFT JOIN articles a ON ai.article_id = a.id
        WHERE ai.article_id IS NULL OR a.user_id = ?
        ORDER BY ai.created_at DESC
        LIMIT ? OFFSET ?
    ");
    $stmt->execute([$userId, $limit, $offset]);
    $images = $stmt->fetchAll();

    // 獲取總數
    $countStmt = $pdo->prepare("
        SELECT COUNT(*) as total
        FROM article_images ai
        LEFT JOIN articles a ON ai.article_id = a.id
        WHERE ai.article_id IS NULL OR a.user_id = ?
    ");
    $countStmt->execute([$userId]);
    $total = $countStmt->fetch()['total'];

    echo json_encode([
        'success' => true,
        'images' => $images,
        'total' => (int)$total,
        'limit' => $limit,
        'offset' => $offset
    ]);

} catch (Exception $e) {
    error_log("Get images error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => '獲取圖片列表失敗']);
}
?>
