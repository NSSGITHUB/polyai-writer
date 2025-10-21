-- MySQL AI 提供者和用戶角色管理系統

-- 創建用戶角色表
CREATE TABLE IF NOT EXISTS `user_roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user_role` (`user_id`, `role`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 創建 AI 提供者配置表
CREATE TABLE IF NOT EXISTS `ai_providers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `provider_name` VARCHAR(50) NOT NULL UNIQUE,
  `provider_label` VARCHAR(100) NOT NULL,
  `api_key` TEXT,
  `is_enabled` TINYINT(1) DEFAULT 1,
  `api_endpoint` VARCHAR(255),
  `model_name` VARCHAR(100),
  `description` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_provider_name` (`provider_name`),
  INDEX `idx_is_enabled` (`is_enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入預設 AI 提供者
INSERT INTO `ai_providers` (`provider_name`, `provider_label`, `api_endpoint`, `model_name`, `description`, `is_enabled`) VALUES
('openai', 'OpenAI GPT-4', 'https://api.openai.com/v1/chat/completions', 'gpt-4-turbo-preview', '最先進的 AI 模型，適合複雜內容生成', 1),
('google', 'Google Gemini', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', 'gemini-pro', 'Google 最新 AI 模型，支援多模態處理', 1),
('anthropic', 'Anthropic Claude', 'https://api.anthropic.com/v1/messages', 'claude-3-5-sonnet-20241022', '專注於安全性和準確性的 AI 模型', 1),
('manus', 'Manus AI', '', '', '客製化 AI 解決方案（需配置）', 0)
ON DUPLICATE KEY UPDATE 
  `provider_label` = VALUES(`provider_label`),
  `api_endpoint` = VALUES(`api_endpoint`),
  `model_name` = VALUES(`model_name`),
  `description` = VALUES(`description`);
