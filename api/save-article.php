<?php
require_once __DIR__ . '/db-config.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $userId = $data['userId'] ?? '';
    $title = $data['title'] ?? '';
    $content = $data['content'] ?? '';
    $topic = $data['topic'] ?? '';
    $keywords = $data['keywords'] ?? '';
    $outline = $data['outline'] ?? '';
    $language = $data['language'] ?? 'zh-TW';
    $style = $data['style'] ?? 'professional';
    $wordCount = $data['wordCount'] ?? 1000;
    $aiProvider = $data['aiProvider'] ?? '';
    $status = $data['status'] ?? 'draft';
    
    if (empty($title) || empty($content)) {
        http_response_code(400);
        echo json_encode(['error' => 'Title and content are required']);
        exit;
    }
    
    if (empty($userId)) {
        http_response_code(400);
        echo json_encode(['error' => 'User ID is required']);
        exit;
    }
    
    $db = getDBConnection();
    
    $sql = "INSERT INTO articles (user_id, title, content, topic, keywords, outline, language, style, word_count, ai_provider, status) 
            VALUES (:user_id, :title, :content, :topic, :keywords, :outline, :language, :style, :word_count, :ai_provider, :status)";
    
    $stmt = $db->prepare($sql);
    $stmt->execute([
        ':user_id' => $userId,
        ':title' => $title,
        ':content' => $content,
        ':topic' => $topic,
        ':keywords' => $keywords,
        ':outline' => $outline,
        ':language' => $language,
        ':style' => $style,
        ':word_count' => $wordCount,
        ':ai_provider' => $aiProvider,
        ':status' => $status
    ]);
    
    $articleId = $db->lastInsertId();
    
    echo json_encode([
        'success' => true,
        'id' => $articleId,
        'message' => 'Article saved successfully'
    ]);
    
} catch (Exception $e) {
    error_log("Save article error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save article: ' . $e->getMessage()]);
}
?>