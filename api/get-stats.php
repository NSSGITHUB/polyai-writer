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
    // 從 Authorization header 或 query parameter 獲取用戶ID
    $userId = $_GET['user_id'] ?? null;
    
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['error' => '需要提供用戶ID']);
        exit();
    }

    $pdo = getDBConnection();
    
    // 獲取統計數據
    $stmt = $pdo->prepare("
        SELECT 
            COALESCE(total_articles, 0) as total,
            COALESCE(monthly_articles, 0) as monthly,
            COALESCE(articles_with_images, 0) as with_images,
            COALESCE(published_articles, 0) as published
        FROM article_stats
        WHERE user_id = ?
    ");
    $stmt->execute([$userId]);
    $stats = $stmt->fetch();

    if (!$stats) {
        // 如果沒有統計數據，返回零值
        $stats = [
            'total' => 0,
            'monthly' => 0,
            'with_images' => 0,
            'published' => 0
        ];
    }

    // 獲取圖片生成統計
    try {
        $imageStmt = $pdo->prepare("
            SELECT COUNT(*) as total_images
            FROM article_images ai
            LEFT JOIN articles a ON ai.article_id = a.id
            WHERE ai.article_id IS NULL OR a.user_id = ?
        ");
        $imageStmt->execute([$userId]);
        $imageStats = $imageStmt->fetch();
        $stats['total_images'] = (int)($imageStats['total_images'] ?? 0);
    } catch (Exception $imgError) {
        error_log("Image stats error: " . $imgError->getMessage());
        $stats['total_images'] = 0;
    }

    echo json_encode([
        'success' => true,
        'stats' => $stats
    ]);

} catch (Exception $e) {
    error_log("Stats error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => '獲取統計數據失敗']);
}
?>
