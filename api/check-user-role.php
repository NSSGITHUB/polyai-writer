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
    $user_id = $_GET['user_id'] ?? null;
    
    if (!$user_id) {
        throw new Exception('缺少 user_id 參數');
    }
    
    $pdo = getDBConnection();
    
    // 檢查用戶角色
    $stmt = $pdo->prepare("
        SELECT role 
        FROM user_roles 
        WHERE user_id = :user_id
    ");
    
    $stmt->execute(['user_id' => $user_id]);
    $roles = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $is_admin = in_array('admin', $roles);
    
    echo json_encode([
        'success' => true,
        'is_admin' => $is_admin,
        'roles' => $roles
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
