-- ============================================
-- 考试监考系统 - 数据库设计
-- ============================================
-- 版本: v1.0.0
-- 创建日期: 2026-01-30
-- 说明: 用于存储监考会话、违规记录等数据
-- ============================================

-- ----------------------------
-- 1. 监考会话表
-- ----------------------------
DROP TABLE IF EXISTS `proctor_session`;
CREATE TABLE `proctor_session` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '会话ID',
  `exam_id` BIGINT(20) NOT NULL COMMENT '考试ID',
  `student_id` BIGINT(20) NOT NULL COMMENT '学生ID',
  `session_token` VARCHAR(255) DEFAULT NULL COMMENT '会话令牌',
  
  -- 时间信息
  `start_time` DATETIME NOT NULL COMMENT '开始时间',
  `end_time` DATETIME DEFAULT NULL COMMENT '结束时间',
  `duration` INT(11) DEFAULT 0 COMMENT '持续时长(秒)',
  
  -- 监控数据
  `frames_sent` INT(11) DEFAULT 0 COMMENT '发送帧数',
  `violation_count` INT(11) DEFAULT 0 COMMENT '违规次数',
  `warning_count` INT(11) DEFAULT 0 COMMENT '警告次数',
  
  -- 状态
  `status` VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT '会话状态: active, ended, abnormal',
  `end_reason` VARCHAR(100) DEFAULT NULL COMMENT '结束原因: normal, timeout, violation_limit, error',
  
  -- 设备信息
  `user_agent` VARCHAR(500) DEFAULT NULL COMMENT '浏览器UA',
  `ip_address` VARCHAR(50) DEFAULT NULL COMMENT 'IP地址',
  `device_info` TEXT COMMENT '设备信息(JSON)',
  
  -- 元数据
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`id`),
  KEY `idx_exam_student` (`exam_id`, `student_id`),
  KEY `idx_student` (`student_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='监考会话表';

-- ----------------------------
-- 2. 违规记录表
-- ----------------------------
DROP TABLE IF EXISTS `proctor_violation`;
CREATE TABLE `proctor_violation` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '违规记录ID',
  `session_id` BIGINT(20) NOT NULL COMMENT '会话ID',
  `exam_id` BIGINT(20) NOT NULL COMMENT '考试ID',
  `student_id` BIGINT(20) NOT NULL COMMENT '学生ID',
  
  -- 违规信息
  `violation_type` VARCHAR(50) NOT NULL COMMENT '违规类型: multiple_people, phone_detected, book_detected, cheat_sheet_detected, headphone_detected, gaze_deviation, student_absent',
  `violation_description` TEXT NOT NULL COMMENT '违规描述',
  
  -- 严重程度
  `severity` VARCHAR(20) NOT NULL DEFAULT 'medium' COMMENT '严重程度: critical, high, medium, low',
  `confidence` DECIMAL(4,3) DEFAULT NULL COMMENT 'AI置信度(0-1)',
  
  -- 时间
  `violation_time` DATETIME NOT NULL COMMENT '违规发生时间',
  `detected_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '检测时间',
  
  -- 证据
  `screenshot_url` VARCHAR(500) DEFAULT NULL COMMENT '截图URL',
  `video_segment_url` VARCHAR(500) DEFAULT NULL COMMENT '视频片段URL',
  `evidence_data` TEXT COMMENT '证据数据(JSON)',
  
  -- 处理状态
  `is_handled` TINYINT(1) DEFAULT 0 COMMENT '是否已处理: 0-未处理, 1-已处理',
  `handler_id` BIGINT(20) DEFAULT NULL COMMENT '处理人ID',
  `handle_result` VARCHAR(100) DEFAULT NULL COMMENT '处理结果: ignored, warned, penalized, disqualified',
  `handle_remark` TEXT COMMENT '处理备注',
  `handled_at` DATETIME DEFAULT NULL COMMENT '处理时间',
  
  -- 元数据
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`id`),
  KEY `idx_session` (`session_id`),
  KEY `idx_exam_student` (`exam_id`, `student_id`),
  KEY `idx_violation_type` (`violation_type`),
  KEY `idx_severity` (`severity`),
  KEY `idx_is_handled` (`is_handled`),
  KEY `idx_violation_time` (`violation_time`),
  CONSTRAINT `fk_violation_session` FOREIGN KEY (`session_id`) REFERENCES `proctor_session` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='违规记录表';

-- ----------------------------
-- 3. 监考配置表
-- ----------------------------
DROP TABLE IF EXISTS `proctor_config`;
CREATE TABLE `proctor_config` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  `exam_id` BIGINT(20) DEFAULT NULL COMMENT '考试ID(NULL表示全局配置)',
  `course_id` BIGINT(20) DEFAULT NULL COMMENT '课程ID',
  
  -- 基础配置
  `enabled` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用监考',
  `frame_interval` INT(11) DEFAULT 1000 COMMENT '帧发送间隔(毫秒)',
  `max_violations` INT(11) DEFAULT 10 COMMENT '最大违规次数',
  `auto_submit_on_max_violations` TINYINT(1) DEFAULT 1 COMMENT '超限自动提交',
  
  -- 摄像头配置
  `camera_required` TINYINT(1) DEFAULT 1 COMMENT '是否必须开启摄像头',
  `camera_width` INT(11) DEFAULT 1280 COMMENT '摄像头宽度',
  `camera_height` INT(11) DEFAULT 720 COMMENT '摄像头高度',
  `show_preview` TINYINT(1) DEFAULT 1 COMMENT '显示预览',
  
  -- 违规类型开关
  `detect_multiple_people` TINYINT(1) DEFAULT 1 COMMENT '检测多人',
  `detect_phone` TINYINT(1) DEFAULT 1 COMMENT '检测手机',
  `detect_book` TINYINT(1) DEFAULT 1 COMMENT '检测书籍',
  `detect_cheat_sheet` TINYINT(1) DEFAULT 1 COMMENT '检测小抄',
  `detect_headphone` TINYINT(1) DEFAULT 1 COMMENT '检测耳机',
  `detect_gaze_deviation` TINYINT(1) DEFAULT 1 COMMENT '检测视线偏离',
  `detect_student_absent` TINYINT(1) DEFAULT 1 COMMENT '检测考生离开',
  
  -- 其他配置
  `screenshot_on_violation` TINYINT(1) DEFAULT 1 COMMENT '违规时自动截图',
  `screenshot_quality` DECIMAL(3,2) DEFAULT 0.80 COMMENT '截图质量(0-1)',
  `heartbeat_interval` INT(11) DEFAULT 30000 COMMENT '心跳间隔(毫秒)',
  
  -- 元数据
  `created_by` BIGINT(20) DEFAULT NULL COMMENT '创建人ID',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_exam` (`exam_id`),
  KEY `idx_course` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='监考配置表';

-- ----------------------------
-- 4. 监考快照表(可选)
-- ----------------------------
DROP TABLE IF EXISTS `proctor_snapshot`;
CREATE TABLE `proctor_snapshot` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '快照ID',
  `session_id` BIGINT(20) NOT NULL COMMENT '会话ID',
  `exam_id` BIGINT(20) NOT NULL COMMENT '考试ID',
  `student_id` BIGINT(20) NOT NULL COMMENT '学生ID',
  
  -- 快照信息
  `snapshot_url` VARCHAR(500) NOT NULL COMMENT '快照URL',
  `snapshot_type` VARCHAR(20) DEFAULT 'normal' COMMENT '快照类型: normal, violation, random',
  `file_size` BIGINT(20) DEFAULT NULL COMMENT '文件大小(字节)',
  `width` INT(11) DEFAULT NULL COMMENT '图片宽度',
  `height` INT(11) DEFAULT NULL COMMENT '图片高度',
  
  -- 时间
  `captured_at` DATETIME NOT NULL COMMENT '捕获时间',
  `uploaded_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
  
  -- 元数据
  `metadata` TEXT COMMENT '元数据(JSON)',
  
  PRIMARY KEY (`id`),
  KEY `idx_session` (`session_id`),
  KEY `idx_exam_student` (`exam_id`, `student_id`),
  KEY `idx_snapshot_type` (`snapshot_type`),
  KEY `idx_captured_at` (`captured_at`),
  CONSTRAINT `fk_snapshot_session` FOREIGN KEY (`session_id`) REFERENCES `proctor_session` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='监考快照表';

-- ----------------------------
-- 5. 监考统计表(可选)
-- ----------------------------
DROP TABLE IF EXISTS `proctor_statistics`;
CREATE TABLE `proctor_statistics` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '统计ID',
  `exam_id` BIGINT(20) NOT NULL COMMENT '考试ID',
  `student_id` BIGINT(20) DEFAULT NULL COMMENT '学生ID(NULL表示考试整体统计)',
  `stat_date` DATE NOT NULL COMMENT '统计日期',
  
  -- 会话统计
  `session_count` INT(11) DEFAULT 0 COMMENT '会话数',
  `total_duration` INT(11) DEFAULT 0 COMMENT '总时长(秒)',
  `avg_duration` DECIMAL(10,2) DEFAULT 0.00 COMMENT '平均时长(秒)',
  
  -- 违规统计
  `total_violations` INT(11) DEFAULT 0 COMMENT '总违规次数',
  `critical_violations` INT(11) DEFAULT 0 COMMENT '严重违规次数',
  `high_violations` INT(11) DEFAULT 0 COMMENT '高级违规次数',
  `medium_violations` INT(11) DEFAULT 0 COMMENT '中级违规次数',
  `low_violations` INT(11) DEFAULT 0 COMMENT '低级违规次数',
  
  -- 违规类型统计
  `multiple_people_count` INT(11) DEFAULT 0 COMMENT '多人次数',
  `phone_count` INT(11) DEFAULT 0 COMMENT '手机次数',
  `book_count` INT(11) DEFAULT 0 COMMENT '书籍次数',
  `cheat_sheet_count` INT(11) DEFAULT 0 COMMENT '小抄次数',
  `headphone_count` INT(11) DEFAULT 0 COMMENT '耳机次数',
  `gaze_deviation_count` INT(11) DEFAULT 0 COMMENT '视线偏离次数',
  `student_absent_count` INT(11) DEFAULT 0 COMMENT '离开次数',
  
  -- 异常统计
  `abnormal_session_count` INT(11) DEFAULT 0 COMMENT '异常会话数',
  `force_submit_count` INT(11) DEFAULT 0 COMMENT '强制交卷次数',
  
  -- 元数据
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_exam_student_date` (`exam_id`, `student_id`, `stat_date`),
  KEY `idx_exam` (`exam_id`),
  KEY `idx_student` (`student_id`),
  KEY `idx_stat_date` (`stat_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='监考统计表';

-- ----------------------------
-- 初始化全局默认配置
-- ----------------------------
INSERT INTO `proctor_config` (
  `exam_id`, 
  `enabled`, 
  `frame_interval`, 
  `max_violations`,
  `auto_submit_on_max_violations`,
  `camera_width`,
  `camera_height`,
  `screenshot_quality`
) VALUES (
  NULL,  -- 全局配置
  1,     -- 启用
  1000,  -- 1秒发送一帧
  10,    -- 最大10次违规
  1,     -- 超限自动提交
  1280,  -- 宽度
  720,   -- 高度
  0.80   -- 截图质量
);

-- ----------------------------
-- 索引优化建议
-- ----------------------------
-- 如果查询性能不佳，可以添加以下复合索引:
-- ALTER TABLE proctor_session ADD INDEX idx_exam_status_created (exam_id, status, created_at);
-- ALTER TABLE proctor_violation ADD INDEX idx_exam_severity_time (exam_id, severity, violation_time);

-- ----------------------------
-- 视图: 考试违规汇总
-- ----------------------------
CREATE OR REPLACE VIEW `v_exam_violation_summary` AS
SELECT 
  e.id AS exam_id,
  e.title AS exam_title,
  COUNT(DISTINCT pv.student_id) AS violation_student_count,
  COUNT(pv.id) AS total_violations,
  SUM(CASE WHEN pv.severity = 'critical' THEN 1 ELSE 0 END) AS critical_count,
  SUM(CASE WHEN pv.severity = 'high' THEN 1 ELSE 0 END) AS high_count,
  SUM(CASE WHEN pv.severity = 'medium' THEN 1 ELSE 0 END) AS medium_count,
  SUM(CASE WHEN pv.severity = 'low' THEN 1 ELSE 0 END) AS low_count
FROM exam e
LEFT JOIN proctor_violation pv ON e.id = pv.exam_id
GROUP BY e.id, e.title;

-- ----------------------------
-- 视图: 学生违规明细
-- ----------------------------
CREATE OR REPLACE VIEW `v_student_violation_detail` AS
SELECT 
  pv.id,
  pv.exam_id,
  e.title AS exam_title,
  pv.student_id,
  u.username AS student_name,
  pv.violation_type,
  pv.violation_description,
  pv.severity,
  pv.confidence,
  pv.violation_time,
  pv.is_handled,
  pv.handle_result
FROM proctor_violation pv
LEFT JOIN exam e ON pv.exam_id = e.id
LEFT JOIN user u ON pv.student_id = u.id
ORDER BY pv.violation_time DESC;

-- ============================================
-- 使用说明
-- ============================================
-- 1. 执行本脚本创建所有表和视图
-- 2. 根据实际需求调整字段长度和索引
-- 3. 生产环境建议启用分区(按月分区violation表)
-- 4. 定期归档历史数据,保持表性能
-- ============================================
