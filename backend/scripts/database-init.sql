-- ============================================================
-- Deployment Learning Platform - Database Initialization Script
-- Database: deployment_learning
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. users 用户表
-- ============================================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `password_hash` VARCHAR(255) NOT NULL COMMENT '密码哈希',
  `openid` VARCHAR(255) DEFAULT NULL COMMENT '微信 OpenID',
  `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user' COMMENT '用户角色',
  `nickname` VARCHAR(100) DEFAULT NULL COMMENT '用户昵称',
  `avatar_url` VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_openid` (`openid`),
  KEY `idx_role` (`role`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================================
-- 2. contents 知识内容表
-- ============================================================
DROP TABLE IF EXISTS `contents`;
CREATE TABLE `contents` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `domain` ENUM('build', 'platform', 'server', 'automation', 'domain', 'container') NOT NULL COMMENT '知识领域',
  `level` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '难度等级 1-5',
  `title` VARCHAR(200) NOT NULL COMMENT '标题',
  `description` TEXT COMMENT '简介描述',
  `content` LONGTEXT COMMENT '详细内容（Markdown）',
  `examples` JSON COMMENT '代码示例数组',
  `tags` JSON COMMENT '标签数组',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_domain` (`domain`),
  KEY `idx_level` (`level`),
  KEY `idx_domain_level` (`domain`, `level`),
  FULLTEXT KEY `ft_title_desc` (`title`, `description`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='知识内容表';

-- ============================================================
-- 3. decision_trees 决策树表
-- ============================================================
DROP TABLE IF EXISTS `decision_trees`;
CREATE TABLE `decision_trees` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL COMMENT '决策树名称',
  `description` TEXT COMMENT '描述',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='决策树表';

-- ============================================================
-- 4. tree_nodes 决策树节点表
-- ============================================================
DROP TABLE IF EXISTS `tree_nodes`;
CREATE TABLE `tree_nodes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tree_id` INT UNSIGNED NOT NULL COMMENT '所属决策树ID',
  `parent_id` INT UNSIGNED DEFAULT NULL COMMENT '父节点ID，NULL表示根节点',
  `question` TEXT NOT NULL COMMENT '问题内容',
  `options` JSON COMMENT '选项配置 [{label, next_node_id, value}]',
  `result` TEXT COMMENT '结果说明',
  `result_type` ENUM('continue', 'recommendation', 'guide') NOT NULL DEFAULT 'continue' COMMENT '结果类型',
  `guide_content` LONGTEXT COMMENT '步骤指南内容（Markdown）',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '同级排序',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tree_id` (`tree_id`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_sort_order` (`sort_order`),
  CONSTRAINT `fk_tree_node_tree` FOREIGN KEY (`tree_id`) REFERENCES `decision_trees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tree_node_parent` FOREIGN KEY (`parent_id`) REFERENCES `tree_nodes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='决策树节点表';

-- ============================================================
-- 5. user_progress 用户学习进度表
-- ============================================================
DROP TABLE IF EXISTS `user_progress`;
CREATE TABLE `user_progress` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
  `content_id` INT UNSIGNED NOT NULL COMMENT '内容ID',
  `status` ENUM('viewed', 'learning', 'completed') NOT NULL DEFAULT 'viewed' COMMENT '学习状态',
  `progress_percent` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '进度百分比 0-100',
  `last_accessed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `completed_at` TIMESTAMP NULL DEFAULT NULL COMMENT '完成时间',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_content` (`user_id`, `content_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_content_id` (`content_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_user_progress_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_progress_content` FOREIGN KEY (`content_id`) REFERENCES `contents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户学习进度表';

-- ============================================================
-- 6. feedbacks 用户反馈表
-- ============================================================
DROP TABLE IF EXISTS `feedbacks`;
CREATE TABLE `feedbacks` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
  `content_id` INT UNSIGNED DEFAULT NULL COMMENT '关联的内容ID，可为空',
  `type` ENUM('error', 'suggestion', 'question', 'other') NOT NULL COMMENT '反馈类型',
  `message` TEXT NOT NULL COMMENT '反馈内容',
  `status` ENUM('pending', 'processing', 'resolved', 'rejected') NOT NULL DEFAULT 'pending' COMMENT '处理状态',
  `admin_reply` TEXT COMMENT '管理员回复',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_content_id` (`content_id`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_feedback_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_feedback_content` FOREIGN KEY (`content_id`) REFERENCES `contents` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户反馈表';

-- ============================================================
-- 7. favorites 收藏表
-- ============================================================
DROP TABLE IF EXISTS `favorites`;
CREATE TABLE `favorites` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
  `content_id` INT UNSIGNED NOT NULL COMMENT '内容ID',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_content` (`user_id`, `content_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_content_id` (`content_id`),
  CONSTRAINT `fk_favorite_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_favorite_content` FOREIGN KEY (`content_id`) REFERENCES `contents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收藏表';

-- ============================================================
-- 8. admin_audit_logs 管理员审计日志表
-- ============================================================
DROP TABLE IF EXISTS `admin_audit_logs`;
CREATE TABLE `admin_audit_logs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_id` INT UNSIGNED NOT NULL COMMENT '管理员用户ID',
  `action` VARCHAR(100) NOT NULL COMMENT '操作类型',
  `target_type` VARCHAR(50) NOT NULL COMMENT '目标类型',
  `target_id` INT UNSIGNED DEFAULT NULL COMMENT '目标ID',
  `details` JSON COMMENT '操作详情',
  `ip_address` VARCHAR(45) DEFAULT NULL COMMENT '操作IP',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_admin_id` (`admin_id`),
  KEY `idx_action` (`action`),
  KEY `idx_target_type` (`target_type`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_audit_admin` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员审计日志表';

SET FOREIGN_KEY_CHECKS = 1;
