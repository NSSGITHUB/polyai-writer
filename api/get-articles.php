<?php
require_once __DIR__ . '/db-config.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    $db = getDBConnection();
    
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = isset($_GET['limit']) ? max(1, min(100, intval($_GET['limit']))) : 20;
    $offset = ($page - 1) * $limit;
    
    $status = isset($_GET['status']) ? $_GET['status'] : '';
    
    // 計算總數
    $countSql = "SELECT COUNT(*) as total FROM articles";
    $countParams = [];
    
    if (!empty($status)) {
        $countSql .= " WHERE status = :status";
        $countParams[':status'] = $status;
    }
    
    $countStmt = $db->prepare($countSql);
    $countStmt->execute($countParams);
    $total = $countStmt->fetch()['total'];
    
    // 取得文章列表
    $sql = "SELECT id, title, LEFT(content, 200) as excerpt, topic, keywords, language, style, 
                   word_count, ai_provider, status, created_at, updated_at 
            FROM articles";
    
    $params = [];
    
    if (!empty($status)) {
        $sql .= " WHERE status = :status";
        $params[':status'] = $status;
    }
    
    $sql .= " ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
    
    $stmt = $db->prepare($sql);
    
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    
    $stmt->execute();
    $articles = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'data' => $articles,
        'pagination' => [
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'pages' => ceil($total / $limit)
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Get articles error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch articles: ' . $e->getMessage()]);
}
?>