-- ================================================
-- LMS 学习管理系统数据库初始化脚本
-- ================================================

-- 设置字符集
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ================================================
-- 1. 用户表
-- ================================================
CREATE TABLE IF NOT EXISTS `user` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `password` VARCHAR(100) NOT NULL COMMENT '密码',
  `real_name` VARCHAR(50) DEFAULT NULL COMMENT '真实姓名',
  `email` VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
  `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像',
  `gender` TINYINT DEFAULT 1 COMMENT '性别:0-女,1-男',
  `status` TINYINT DEFAULT 1 COMMENT '状态:0-禁用,1-启用',
  `roles` VARCHAR(100) DEFAULT 'STUDENT' COMMENT '角色:ADMIN,TEACHER,STUDENT',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  KEY `idx_email` (`email`),
  KEY `idx_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ================================================
-- 2. 课程表
-- ================================================
CREATE TABLE IF NOT EXISTS `course` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '课程ID',
  `course_name` VARCHAR(100) NOT NULL COMMENT '课程名称',
  `description` TEXT COMMENT '课程简介',
  `teacher_id` BIGINT NOT NULL COMMENT '授课教师ID',
  `teacher_name` VARCHAR(50) DEFAULT NULL COMMENT '教师姓名',
  `credit` DECIMAL(3,1) DEFAULT 2.0 COMMENT '学分',
  `start_time` DATE DEFAULT NULL COMMENT '开课时间',
  `end_time` DATE DEFAULT NULL COMMENT '结课时间',
  `content` TEXT COMMENT '课程内容',
  `status` TINYINT DEFAULT 0 COMMENT '状态:0-草稿,1-已发布,2-已归档',
  `enrolled_count` INT DEFAULT 0 COMMENT '已报名人数',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_teacher_id` (`teacher_id`),
  KEY `idx_status` (`status`),
  KEY `idx_start_time` (`start_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课程表';

-- ================================================
-- 3. 选课表
-- ================================================
CREATE TABLE IF NOT EXISTS `enrollment` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '选课ID',
  `course_id` BIGINT NOT NULL COMMENT '课程ID',
  `student_id` BIGINT NOT NULL COMMENT '学生ID',
  `student_name` VARCHAR(50) DEFAULT NULL COMMENT '学生姓名',
  `enroll_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '报名时间',
  `progress` INT DEFAULT 0 COMMENT '学习进度(%)',
  `status` TINYINT DEFAULT 1 COMMENT '状态:0-已退课,1-学习中,2-已完成',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_course_student` (`course_id`, `student_id`),
  KEY `idx_student_id` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='选课表';

-- ================================================
-- 4. 作业表
-- ================================================
CREATE TABLE IF NOT EXISTS `homework` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '作业ID',
  `course_id` BIGINT NOT NULL COMMENT '课程ID',
  `title` VARCHAR(100) NOT NULL COMMENT '作业标题',
  `content` TEXT COMMENT '作业内容',
  `deadline` DATETIME DEFAULT NULL COMMENT '截止时间',
  `status` TINYINT DEFAULT 0 COMMENT '状态:0-草稿,1-已发布',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_course_id` (`course_id`),
  KEY `idx_deadline` (`deadline`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='作业表';

-- ================================================
-- 5. 作业提交表
-- ================================================
CREATE TABLE IF NOT EXISTS `homework_submit` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '提交ID',
  `homework_id` BIGINT NOT NULL COMMENT '作业ID',
  `student_id` BIGINT NOT NULL COMMENT '学生ID',
  `content` TEXT COMMENT '提交内容',
  `attachment` VARCHAR(255) DEFAULT NULL COMMENT '附件地址',
  `score` DECIMAL(5,2) DEFAULT NULL COMMENT '成绩',
  `comment` TEXT COMMENT '批改评语',
  `submit_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '提交时间',
  `grade_time` DATETIME DEFAULT NULL COMMENT '批改时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_homework_student` (`homework_id`, `student_id`),
  KEY `idx_student_id` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='作业提交表';

-- ================================================
-- 6. 试卷表
-- ================================================
CREATE TABLE IF NOT EXISTS `exam_paper` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '试卷ID',
  `course_id` BIGINT NOT NULL COMMENT '课程ID',
  `title` VARCHAR(100) NOT NULL COMMENT '试卷标题',
  `description` TEXT COMMENT '试卷说明',
  `total_score` DECIMAL(5,2) DEFAULT 100.00 COMMENT '总分',
  `duration` INT DEFAULT 60 COMMENT '考试时长(分钟)',
  `status` TINYINT DEFAULT 0 COMMENT '状态:0-草稿,1-已发布',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_course_id` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='试卷表';

-- ================================================
-- 7. 试题表
-- ================================================
CREATE TABLE IF NOT EXISTS `question` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '试题ID',
  `type` TINYINT NOT NULL COMMENT '题目类型:1-单选,2-多选,3-判断,4-填空,5-简答',
  `content` TEXT NOT NULL COMMENT '题目内容',
  `options` TEXT COMMENT '选项(JSON)',
  `answer` TEXT COMMENT '正确答案',
  `score` DECIMAL(5,2) DEFAULT 0.00 COMMENT '分值',
  `analysis` TEXT COMMENT '答案解析',
  `difficulty` TINYINT DEFAULT 1 COMMENT '难度:1-简单,2-中等,3-困难',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_difficulty` (`difficulty`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='试题表';

-- ================================================
-- 8. 考试记录表
-- ================================================
CREATE TABLE IF NOT EXISTS `exam_record` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '考试记录ID',
  `paper_id` BIGINT NOT NULL COMMENT '试卷ID',
  `student_id` BIGINT NOT NULL COMMENT '学生ID',
  `answers` TEXT COMMENT '答题记录(JSON)',
  `score` DECIMAL(5,2) DEFAULT NULL COMMENT '得分',
  `start_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '开始时间',
  `submit_time` DATETIME DEFAULT NULL COMMENT '提交时间',
  `status` TINYINT DEFAULT 0 COMMENT '状态:0-进行中,1-已提交,2-已批改',
  PRIMARY KEY (`id`),
  KEY `idx_paper_id` (`paper_id`),
  KEY `idx_student_id` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='考试记录表';

-- ================================================
-- 9. 学习记录表
-- ================================================
CREATE TABLE IF NOT EXISTS `learning_record` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '学习记录ID',
  `course_id` BIGINT NOT NULL COMMENT '课程ID',
  `student_id` BIGINT NOT NULL COMMENT '学生ID',
  `content_id` BIGINT DEFAULT NULL COMMENT '内容ID',
  `duration` INT DEFAULT 0 COMMENT '学习时长(秒)',
  `learn_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '学习时间',
  PRIMARY KEY (`id`),
  KEY `idx_course_student` (`course_id`, `student_id`),
  KEY `idx_learn_time` (`learn_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学习记录表';

-- ================================================
-- 插入初始数据
-- ================================================

-- 插入管理员账号 (密码: admin123)
INSERT INTO `user` (`username`, `password`, `real_name`, `roles`, `status`) 
VALUES ('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '系统管理员', 'ADMIN', 1)
ON DUPLICATE KEY UPDATE `username` = `username`;

-- 插入示例教师 (密码: teacher123)
INSERT INTO `user` (`username`, `password`, `real_name`, `roles`, `status`) 
VALUES ('teacher1', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '张老师', 'TEACHER', 1)
ON DUPLICATE KEY UPDATE `username` = `username`;

-- 插入示例学生 (密码: student123)
INSERT INTO `user` (`username`, `password`, `real_name`, `roles`, `status`) 
VALUES ('student1', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '李同学', 'STUDENT', 1)
ON DUPLICATE KEY UPDATE `username` = `username`;

SET FOREIGN_KEY_CHECKS = 1;

-- 完成
SELECT 'Database initialization completed successfully!' AS message;
