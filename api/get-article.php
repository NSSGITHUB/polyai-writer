<?php
require_once 'db-config.php';

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
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid article ID']);
        exit;
    }
    
    $db = getDBConnection();
    
    $sql = "SELECT * FROM articles WHERE id = :id";
    $stmt = $db->prepare($sql);
    $stmt->execute([':id' => $id]);
    
    $article = $stmt->fetch();
    
    if (!$article) {
        http_response_code(404);
        echo json_encode(['error' => 'Article not found']);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'data' => $article
    ]);
    
} catch (Exception $e) {
    error_log("Get article error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch article: ' . $e->getMessage()]);
}
?>