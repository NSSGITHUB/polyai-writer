<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

$response = [
  'php_version' => PHP_VERSION,
  'curl_installed' => function_exists('curl_version'),
  'curl_version' => function_exists('curl_version') ? curl_version() : null,
  'dns_api_openai' => gethostbyname('api.openai.com'),
  'time' => date('c'),
];

try {
  require_once __DIR__ . '/db-config.php';
  $key = defined('OPENAI_API_KEY') ? OPENAI_API_KEY : '';

  $ch = curl_init('https://api.openai.com/v1/models');
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_TIMEOUT, 20);
  curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $key,
  ]);

  $body = curl_exec($ch);
  $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $err = curl_error($ch);
  curl_close($ch);

  $response['openai_ping'] = [
    'http_code' => $httpCode,
    'curl_error' => $err,
    'body_sample' => $body ? substr($body, 0, 300) : null,
    'has_key' => !empty($key),
  ];
} catch (Throwable $e) {
  $response['diag_error'] = $e->getMessage();
}

echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
