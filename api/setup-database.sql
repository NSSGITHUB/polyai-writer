-- MySQL 資料庫初始化腳本

-- 創建用戶資料表
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) PRIMARY KEY,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `name` VARCHAR(100),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 創建文章資料表（如果還沒有）
CREATE TABLE IF NOT EXISTS `articles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `title` TEXT NOT NULL,
  `content` LONGTEXT,
  `slug` VARCHAR(255),
  `status` ENUM('draft', 'published') DEFAULT 'draft',
  `has_image` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 創建文章統計視圖
CREATE OR REPLACE VIEW `article_stats` AS
SELECT 
  user_id,
  COUNT(*) as total_articles,
  SUM(CASE WHEN MONTH(created_at) = MONTH(CURRENT_DATE) 
           AND YEAR(created_at) = YEAR(CURRENT_DATE) THEN 1 ELSE 0 END) as monthly_articles,
  SUM(has_image) as articles_with_images,
  SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published_articles
FROM articles
GROUP BY user_id;
