-- MySQL 文章圖片表

-- 創建文章圖片表
CREATE TABLE IF NOT EXISTS `article_images` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `article_id` INT,
  `prompt` TEXT NOT NULL,
  `image_url` TEXT NOT NULL,
  `image_data` LONGTEXT,
  `width` INT DEFAULT 1024,
  `height` INT DEFAULT 1024,
  `is_selected` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON DELETE CASCADE,
  INDEX `idx_article_id` (`article_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
