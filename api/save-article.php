<?php
require_once 'db-config.php';

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
    
    $db = getDBConnection();
    
    $sql = "INSERT INTO articles (title, content, topic, keywords, outline, language, style, word_count, ai_provider, status) 
            VALUES (:title, :content, :topic, :keywords, :outline, :language, :style, :word_count, :ai_provider, :status)";
    
    $stmt = $db->prepare($sql);
    $stmt->execute([
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