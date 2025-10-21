<?php
// 資料庫連線設定
define('DB_HOST', 'localhost');
define('DB_NAME', 'seoaicomtw');
define('DB_USER', 'seoaicomtw');
define('DB_PASS', 'D1#w5w_xGAnxfe5x');

// AI API Keys 設定
define('OPENAI_API_KEY', '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');
define('GOOGLE_API_KEY', '');    // 選填
define('ANTHROPIC_API_KEY', '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'); // 選填
define('XAI_API_KEY', '');       // 選填

function getDBConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        return new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (PDOException $e) {
        error_log("Database connection failed: " . $e->getMessage());
        throw new Exception("Database connection failed");
    }
}
?>