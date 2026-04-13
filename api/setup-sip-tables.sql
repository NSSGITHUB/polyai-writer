-- SIP 自動撥號系統資料表

-- 中華電信 SIP 設定
CREATE TABLE IF NOT EXISTS `sip_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `sip_server` VARCHAR(255) NOT NULL COMMENT 'SIP 伺服器位址（如 sip.hinet.net）',
  `sip_port` INT DEFAULT 5060 COMMENT 'SIP 埠號',
  `sip_username` VARCHAR(100) NOT NULL COMMENT 'SIP 帳號（中華電信分配）',
  `sip_password` VARCHAR(255) NOT NULL COMMENT 'SIP 密碼',
  `sip_domain` VARCHAR(255) COMMENT 'SIP 域名',
  `display_name` VARCHAR(100) COMMENT '來電顯示名稱',
  `caller_id` VARCHAR(20) COMMENT '來電顯示號碼（中華電信門號）',
  `transport` ENUM('ws', 'wss', 'udp', 'tcp') DEFAULT 'wss' COMMENT '傳輸協議',
  `stun_server` VARCHAR(255) DEFAULT 'stun:stun.l.google.com:19302' COMMENT 'STUN 伺服器',
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_sip_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 撥號聯絡人
CREATE TABLE IF NOT EXISTS `dial_contacts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL COMMENT '聯絡人姓名',
  `phone` VARCHAR(20) NOT NULL COMMENT '電話號碼',
  `company` VARCHAR(200) COMMENT '公司名稱',
  `email` VARCHAR(255) COMMENT 'Email',
  `notes` TEXT COMMENT '備註',
  `tags` VARCHAR(500) COMMENT '標籤（逗號分隔）',
  `status` ENUM('pending', 'called', 'answered', 'no_answer', 'busy', 'failed', 'callback', 'converted') DEFAULT 'pending' COMMENT '撥號狀態',
  `last_called_at` DATETIME COMMENT '最後撥號時間',
  `call_count` INT DEFAULT 0 COMMENT '撥號次數',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_contact_user_id` (`user_id`),
  INDEX `idx_contact_status` (`status`),
  INDEX `idx_contact_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 通話記錄
CREATE TABLE IF NOT EXISTS `call_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `contact_id` INT COMMENT '聯絡人 ID',
  `phone_number` VARCHAR(20) NOT NULL COMMENT '撥號號碼',
  `direction` ENUM('outbound', 'inbound') DEFAULT 'outbound' COMMENT '通話方向',
  `status` ENUM('initiated', 'ringing', 'answered', 'completed', 'failed', 'busy', 'no_answer', 'cancelled') DEFAULT 'initiated' COMMENT '通話狀態',
  `duration` INT DEFAULT 0 COMMENT '通話時長（秒）',
  `ai_script` TEXT COMMENT 'AI 話術腳本',
  `ai_transcript` LONGTEXT COMMENT 'AI 對話記錄',
  `recording_url` VARCHAR(500) COMMENT '錄音檔案 URL',
  `notes` TEXT COMMENT '通話備註',
  `started_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '通話開始時間',
  `ended_at` DATETIME COMMENT '通話結束時間',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`contact_id`) REFERENCES `dial_contacts`(`id`) ON DELETE SET NULL,
  INDEX `idx_call_user_id` (`user_id`),
  INDEX `idx_call_contact_id` (`contact_id`),
  INDEX `idx_call_status` (`status`),
  INDEX `idx_call_started_at` (`started_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI 話術模板
CREATE TABLE IF NOT EXISTS `ai_scripts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(200) NOT NULL COMMENT '模板名稱',
  `greeting` TEXT COMMENT '開場白',
  `pitch` TEXT COMMENT '主要話術',
  `objection_handling` TEXT COMMENT '異議處理',
  `closing` TEXT COMMENT '結束語',
  `ai_provider` VARCHAR(50) DEFAULT 'openai' COMMENT 'AI 語音引擎',
  `voice_id` VARCHAR(100) COMMENT '語音 ID',
  `language` VARCHAR(10) DEFAULT 'zh-TW' COMMENT '語言',
  `is_default` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_script_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 通話統計視圖
CREATE OR REPLACE VIEW `call_stats` AS
SELECT
  user_id,
  COUNT(*) as total_calls,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_calls,
  SUM(CASE WHEN status = 'answered' THEN 1 ELSE 0 END) as answered_calls,
  SUM(CASE WHEN status = 'no_answer' THEN 1 ELSE 0 END) as no_answer_calls,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_calls,
  AVG(CASE WHEN duration > 0 THEN duration ELSE NULL END) as avg_duration,
  SUM(duration) as total_duration,
  SUM(CASE WHEN DATE(started_at) = CURDATE() THEN 1 ELSE 0 END) as today_calls
FROM call_logs
GROUP BY user_id;
