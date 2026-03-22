<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

require_once __DIR__ . '/../db-config.php';

try {
    $db = getDBConnection();
    $stmt = $db->query('SELECT * FROM ai_skills ORDER BY category, name');
    $skills = $stmt->fetchAll();

    echo json_encode(['success' => true, 'skills' => $skills]);
} catch (Exception $e) {
    error_log('ai-company/skills error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
