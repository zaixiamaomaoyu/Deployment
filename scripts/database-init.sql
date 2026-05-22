-- =====================================================
-- 数据库初始化脚本 - Deployment 学习平台
-- 创建时间: 2026-04-16
-- =====================================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS deployment_learning
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE deployment_learning;

-- =====================================================
-- 用户认证相关表
-- =====================================================

-- users 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openid VARCHAR(255) UNIQUE NOT NULL COMMENT '微信 OpenID',
  role ENUM('user', 'admin') DEFAULT 'user' COMMENT '用户角色',
  nickname VARCHAR(100) COMMENT '用户昵称',
  avatar_url VARCHAR(500) COMMENT '头像URL',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_openid (openid),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- =====================================================
-- 知识内容相关表
-- =====================================================

-- contents 知识内容表
CREATE TABLE IF NOT EXISTS contents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  domain ENUM('build', 'platform', 'server', 'automation', 'domain', 'container') NOT NULL COMMENT '领域',
  level TINYINT NOT NULL COMMENT '难度等级 1-5',
  title VARCHAR(200) NOT NULL COMMENT '标题',
  description TEXT COMMENT '描述',
  content LONGTEXT COMMENT '详细内容',
  examples JSON COMMENT '代码示例',
  tags JSON COMMENT '标签',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_domain (domain),
  INDEX idx_level (level),
  INDEX idx_domain_level (domain, level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='知识内容表';

-- =====================================================
-- 用户学习相关表
-- =====================================================

-- user_progress 用户学习进度表
CREATE TABLE IF NOT EXISTS user_progress (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  content_id INT NOT NULL,
  status ENUM('viewed', 'learning', 'completed') DEFAULT 'viewed' COMMENT '学习状态',
  progress_percent TINYINT DEFAULT 0 COMMENT '进度百分比',
  last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_content (user_id, content_id),
  INDEX idx_user_id (user_id),
  INDEX idx_content_id (content_id),
  INDEX idx_status (status),
  CONSTRAINT fk_user_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_progress_content FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户学习进度表';

-- favorites 收藏表
CREATE TABLE IF NOT EXISTS favorites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  content_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_content (user_id, content_id),
  INDEX idx_user_id (user_id),
  INDEX idx_content_id (content_id),
  CONSTRAINT fk_favorite_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_favorite_content FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户收藏表';

-- =====================================================
-- 反馈系统相关表
-- =====================================================

-- feedbacks 用户反馈表
CREATE TABLE IF NOT EXISTS feedbacks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  content_id INT NULL COMMENT '关联的内容ID，可为空',
  type ENUM('error', 'suggestion', 'question', 'other') NOT NULL COMMENT '反馈类型',
  message TEXT NOT NULL COMMENT '反馈内容',
  status ENUM('pending', 'processing', 'resolved', 'rejected') DEFAULT 'pending' COMMENT '处理状态',
  admin_reply TEXT COMMENT '管理员回复',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  CONSTRAINT fk_feedback_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_feedback_content FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户反馈表';

-- =====================================================
-- 决策树相关表
-- =====================================================

-- decision_trees 决策树表
CREATE TABLE IF NOT EXISTS decision_trees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '决策树名称',
  description TEXT COMMENT '描述',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='决策树表';

-- tree_nodes 决策树节点表
CREATE TABLE IF NOT EXISTS tree_nodes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tree_id INT NOT NULL,
  parent_id INT NULL COMMENT '父节点ID，null表示根节点',
  question TEXT NOT NULL COMMENT '问题内容',
  options JSON COMMENT '选项配置',
  result TEXT COMMENT '结果说明',
  result_type ENUM('continue', 'recommendation', 'guide') DEFAULT 'continue' COMMENT '结果类型',
  guide_content LONGTEXT COMMENT '步骤指南内容',
  sort_order INT DEFAULT 0 COMMENT '排序',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tree_id (tree_id),
  INDEX idx_parent_id (parent_id),
  INDEX idx_sort_order (sort_order),
  CONSTRAINT fk_tree_node_tree FOREIGN KEY (tree_id) REFERENCES decision_trees(id) ON DELETE CASCADE,
  CONSTRAINT fk_tree_node_parent FOREIGN KEY (parent_id) REFERENCES tree_nodes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='决策树节点表';

-- =====================================================
-- 管理员相关表
-- =====================================================

-- admin_audit_logs 管理员审计日志表
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  admin_id INT NOT NULL,
  action VARCHAR(100) NOT NULL COMMENT '操作类型',
  target_type VARCHAR(50) NOT NULL COMMENT '目标类型',
  target_id INT COMMENT '目标ID',
  details JSON COMMENT '操作详情',
  ip_address VARCHAR(45) COMMENT '操作IP',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_id (admin_id),
  INDEX idx_action (action),
  INDEX idx_target_type (target_type),
  INDEX idx_created_at (created_at),
  CONSTRAINT fk_audit_admin FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员审计日志表';

-- =====================================================
-- 数据完整性验证
-- =====================================================

-- 验证所有表已创建
SELECT
  TABLE_NAME,
  TABLE_COMMENT
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'deployment_learning'
ORDER BY TABLE_NAME;

-- 验证外键约束
SELECT
  CONSTRAINT_NAME,
  TABLE_NAME,
  COLUMN_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'deployment_learning'
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, COLUMN_NAME;

-- 验证索引
SELECT
  TABLE_NAME,
  INDEX_NAME,
  COLUMN_NAME,
  NON_UNIQUE
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'deployment_learning'
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- =====================================================
-- 初始化数据
-- =====================================================

-- 插入默认决策树
INSERT INTO decision_trees (name, description, is_active) VALUES
('部署方案选择器', '帮助用户选择合适的部署方案', TRUE);

-- 插入示例知识内容（6大领域，每个领域2个示例）
INSERT INTO contents (domain, level, title, description, content, examples, tags) VALUES
-- 构建领域
('build', 1, 'Vue 项目构建基础', '学习如何构建 Vue 3 项目', '构建是将源代码转换为可部署文件的过程...',
 '{"build_command": "npm run build", "output_dir": "dist"}', '["vue", "构建", "基础"]'),
('build', 2, '构建优化技巧', '学习如何优化构建输出', '通过配置可以显著减少构建文件大小...',
 '{"optimization": "配置 optimization.splitChunks"}', '["优化", "性能", "进阶"]'),

-- 平台领域
('platform', 1, 'Vercel 部署入门', '免费平台 Vercel 的使用指南', 'Vercel 是前端开发者的首选部署平台...',
 '{"deploy_command": "vercel --prod"}', '["vercel", "免费", "静态部署"]'),
('platform', 2, 'Netlify 配置详解', 'Netlify 的高级配置选项', 'Netlify 提供了丰富的配置选项...',
 '{"netlify_toml": "[build]\n  publish = \"dist\""}', '["netlify", "配置", "进阶"]'),

-- 服务器领域
('server', 1, '服务器购买指南', '如何选择合适的服务器', '选择服务器需要考虑配置、价格、地域...',
 '{"instance_type": "t3.micro (AWS)"}', '["服务器", "AWS", "选择"]'),
('server', 2, 'SSH 连接服务器', '使用 SSH 安全连接服务器', 'SSH 是连接 Linux 服务器的标准方式...',
 '{"ssh_command": "ssh -i key.pem user@host"}', '["SSH", "连接", "安全"]'),

-- 自动化领域
('automation', 1, 'GitHub Actions 基础', '自动化部署的入门指南', 'GitHub Actions 可以自动化构建和部署流程...',
 '{"workflow": "name: Deploy\n\"on\": [push]"}', '["GitHub Actions", "CI/CD", "自动化"]'),
('automation', 2, '自动化测试集成', '在部署流程中集成测试', '自动化测试确保代码质量...',
 '{"test_step": "- name: Run tests\n  run: npm test"}', '["测试", "质量", "进阶"]'),

-- 域名领域
('domain', 1, '域名购买与解析', '如何购买和配置域名', '域名是网站的地址，需要正确配置DNS...',
 '{"dns_record": "A记录指向服务器IP"}', '["域名", "DNS", "解析"]'),
('domain', 2, 'HTTPS 证书配置', '为网站启用 HTTPS 加密', 'HTTPS 提供安全的连接...',
 '{"ssl_cert": "使用 Let\'s Encrypt 免费证书"}', '["HTTPS", "SSL", "安全"]'),

-- 容器领域
('container', 1, 'Docker 基础入门', '容器化部署的基础知识', 'Docker 可以将应用打包成容器...',
 '{"dockerfile": "FROM node:16\nCOPY . /app"}', '["Docker", "容器", "基础"]'),
('container', 2, 'Docker Compose 应用', '使用 Compose 管理多个服务', 'Docker Compose 简化多容器应用管理...',
 '{"compose_file": "version: \"3\"\nservices:\n  web:"}', '["Docker Compose", "多容器", "进阶"]');

-- =====================================================
-- 完成信息
-- =====================================================

SELECT '✅ 数据库初始化完成' as message;
SELECT CONCAT('创建了 ', (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'deployment_learning'), ' 个表') as summary;