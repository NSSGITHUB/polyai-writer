-- AI Company System Database Schema
-- AI 公司系統資料庫架構

-- AI 技能表 (Skills)
CREATE TABLE IF NOT EXISTS ai_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- AI 員工表 (Agents)
CREATE TABLE IF NOT EXISTS ai_agents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    title VARCHAR(100) NOT NULL,
    role ENUM('c-level','manager','employee') DEFAULT 'employee',
    c_level_type VARCHAR(10) DEFAULT NULL COMMENT 'CEO,CTO,CMO,CFO,COO,CPO,CHRO',
    personality TEXT NOT NULL COMMENT 'JSON: traits, communication style, decision style',
    responsibilities TEXT COMMENT 'What this agent is responsible for',
    avatar_emoji VARCHAR(10) DEFAULT '🤖',
    ai_provider VARCHAR(20) DEFAULT 'openai',
    status ENUM('active','inactive','on_leave') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- AI 員工技能對照表
CREATE TABLE IF NOT EXISTS ai_agent_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agent_id INT NOT NULL,
    skill_id INT NOT NULL,
    proficiency TINYINT DEFAULT 50 COMMENT '0-100 proficiency level',
    FOREIGN KEY (agent_id) REFERENCES ai_agents(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES ai_skills(id) ON DELETE CASCADE,
    UNIQUE KEY uk_agent_skill (agent_id, skill_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- AI 員工記憶表
CREATE TABLE IF NOT EXISTS ai_memory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agent_id INT NOT NULL,
    memory_type ENUM('learning','decision','interaction','observation') DEFAULT 'learning',
    content TEXT NOT NULL,
    context VARCHAR(255) DEFAULT NULL,
    importance TINYINT DEFAULT 50 COMMENT '0-100',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES ai_agents(id) ON DELETE CASCADE,
    INDEX idx_agent (agent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 會議表
CREATE TABLE IF NOT EXISTS ai_meetings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    agenda TEXT NOT NULL,
    meeting_type ENUM('strategy','brainstorm','review','crisis','regular') DEFAULT 'regular',
    status ENUM('pending','in_progress','completed','cancelled') DEFAULT 'pending',
    discussion TEXT COMMENT 'Full meeting discussion log (JSON array)',
    summary TEXT COMMENT 'AI-generated meeting summary',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    INDEX idx_user (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 會議參與者
CREATE TABLE IF NOT EXISTS ai_meeting_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    meeting_id INT NOT NULL,
    agent_id INT NOT NULL,
    FOREIGN KEY (meeting_id) REFERENCES ai_meetings(id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES ai_agents(id) ON DELETE CASCADE,
    UNIQUE KEY uk_meeting_agent (meeting_id, agent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 決策建議表
CREATE TABLE IF NOT EXISTS ai_decisions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    meeting_id INT DEFAULT NULL,
    user_id VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    recommendation TEXT NOT NULL,
    pros TEXT COMMENT 'JSON array of advantages',
    cons TEXT COMMENT 'JSON array of disadvantages',
    priority ENUM('low','medium','high','critical') DEFAULT 'medium',
    status ENUM('pending','approved','rejected','deferred') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meeting_id) REFERENCES ai_meetings(id) ON DELETE SET NULL,
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 工作日誌表
CREATE TABLE IF NOT EXISTS ai_work_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agent_id INT NOT NULL,
    log_type ENUM('task','report','insight','alert') DEFAULT 'task',
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES ai_agents(id) ON DELETE CASCADE,
    INDEX idx_agent (agent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 預設技能
INSERT INTO ai_skills (name, description, category) VALUES
('策略規劃', '制定長期戰略方向與執行計劃', 'strategy'),
('市場分析', '分析市場趨勢、競爭對手與機會', 'marketing'),
('財務分析', '財務報表分析、預算規劃與成本控制', 'finance'),
('技術架構', '系統架構設計與技術選型', 'technology'),
('產品設計', '產品需求分析與功能規劃', 'product'),
('人才管理', '團隊建設、人才招募與績效管理', 'hr'),
('營運管理', '日常營運流程優化與品質管控', 'operations'),
('品牌行銷', '品牌定位、推廣策略與內容行銷', 'marketing'),
('風險管理', '識別潛在風險並制定應對措施', 'strategy'),
('數據分析', '數據驅動決策與 KPI 追蹤', 'analytics'),
('客戶關係', '客戶體驗優化與關係維護', 'operations'),
('創新研發', '新技術研究與創新方案開發', 'technology')
ON DUPLICATE KEY UPDATE name=name;
