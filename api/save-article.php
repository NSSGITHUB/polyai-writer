<?php
require_once __DIR__ . '/db-config.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, X-Debug');
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
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true, 512, JSON_INVALID_UTF8_SUBSTITUTE);
    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode([
            'error' => 'Invalid JSON payload',
            'details' => [
                'json_error' => json_last_error_msg(),
                'raw_length' => strlen($raw),
                'content_type' => $_SERVER['CONTENT_TYPE'] ?? '',
            ],
        ]);
        exit;
    }

    // Normalize/trim inputs and support alternate keys
    $userId = $data['userId'] ?? ($data['user_id'] ?? '');
    $title = isset($data['title']) ? trim((string)$data['title']) : '';
    $content = isset($data['content']) ? (string)$data['content'] : '';
    $topic = isset($data['topic']) ? (string)$data['topic'] : '';
    $keywords = isset($data['keywords']) ? (string)$data['keywords'] : '';
    $outline = isset($data['outline']) ? (string)$data['outline'] : '';
    $language = isset($data['language']) ? (string)$data['language'] : 'zh-TW';
    $style = isset($data['style']) ? (string)$data['style'] : 'professional';
    $wordCount = isset($data['wordCount']) ? (int)$data['wordCount'] : 1000;
    $aiProvider = isset($data['aiProvider']) ? (string)$data['aiProvider'] : '';
    $status = isset($data['status']) ? (string)$data['status'] : 'draft';

    if ($title === '' || $content === '') {
        http_response_code(400);
        echo json_encode([
            'error' => 'Title and content are required',
            'details' => [
                'has_title' => $title !== '',
                'has_content' => $content !== '',
                'title_length' => strlen($title),
                'content_length' => strlen($content),
                'received_keys' => array_keys($data),
            ],
        ]);
        exit;
    }

    if (empty($userId)) {
        http_response_code(400);
        echo json_encode([
            'error' => 'User ID is required',
            'details' => [
                'received_keys' => array_keys($data),
            ],
        ]);
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