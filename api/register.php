<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

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
    $data = json_decode(file_get_contents('php://input'), true);
    $email = filter_var($data['email'] ?? '', FILTER_VALIDATE_EMAIL);
    $password = $data['password'] ?? '';
    $name = $data['name'] ?? '';

    if (!$email || strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(['error' => '電子郵件無效或密碼過短（至少6個字元）']);
        exit();
    }

    $pdo = getDBConnection();
    
    // 檢查郵箱是否已存在
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['error' => '此電子郵件已被註冊']);
        exit();
    }

    // 創建新用戶
    $userId = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
    
    $passwordHash = password_hash($password, PASSWORD_BCRYPT);
    
    $stmt = $pdo->prepare("INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)");
    $stmt->execute([$userId, $email, $passwordHash, $name]);

    echo json_encode([
        'success' => true,
        'user' => [
            'id' => $userId,
            'email' => $email,
            'name' => $name
        ]
    ]);

} catch (Exception $e) {
    error_log("Registration error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => '註冊失敗，請稍後再試']);
}
?>
