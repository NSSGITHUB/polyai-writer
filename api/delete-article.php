<?php
require_once 'db-config.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
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
    
    $sql = "DELETE FROM articles WHERE id = :id";
    $stmt = $db->prepare($sql);
    $stmt->execute([':id' => $id]);
    
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Article not found']);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Article deleted successfully'
    ]);
    
} catch (Exception $e) {
    error_log("Delete article error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to delete article: ' . $e->getMessage()]);
}
?>