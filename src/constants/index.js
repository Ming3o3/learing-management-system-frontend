/**
 * 系统常量定义
 */

/**
 * 用户状态
 */
export const USER_STATUS = {
  DISABLED: 0,
  ENABLED: 1
}

export const USER_STATUS_MAP = {
  [USER_STATUS.DISABLED]: '禁用',
  [USER_STATUS.ENABLED]: '启用'
}

/**
 * 性别
 */
export const GENDER = {
  FEMALE: 0,
  MALE: 1
}

export const GENDER_MAP = {
  [GENDER.FEMALE]: '女',
  [GENDER.MALE]: '男'
}

/**
 * 课程状态
 */
export const COURSE_STATUS = {
  UNPUBLISHED: 0,
  PUBLISHED: 1,
  FINISHED: 2
}

export const COURSE_STATUS_MAP = {
  [COURSE_STATUS.UNPUBLISHED]: '未发布',
  [COURSE_STATUS.PUBLISHED]: '已发布',
  [COURSE_STATUS.FINISHED]: '已结束'
}

/**
 * 内容类型
 */
export const CONTENT_TYPE = {
  VIDEO: 1,
  DOCUMENT: 2,
  PPT: 3,
  OTHER: 4
}

export const CONTENT_TYPE_MAP = {
  [CONTENT_TYPE.VIDEO]: '视频',
  [CONTENT_TYPE.DOCUMENT]: '文档',
  [CONTENT_TYPE.PPT]: 'PPT',
  [CONTENT_TYPE.OTHER]: '其他'
}

/**
 * 选课状态
 */
export const ENROLLMENT_STATUS = {
  DROPPED: 0,
  LEARNING: 1,
  COMPLETED: 2
}

export const ENROLLMENT_STATUS_MAP = {
  [ENROLLMENT_STATUS.DROPPED]: '已退课',
  [ENROLLMENT_STATUS.LEARNING]: '学习中',
  [ENROLLMENT_STATUS.COMPLETED]: '已完成'
}

/**
 * 作业状态
 */
export const HOMEWORK_STATUS = {
  DRAFT: 0,
  PUBLISHED: 1,
  EXPIRED: 2
}

export const HOMEWORK_STATUS_MAP = {
  [HOMEWORK_STATUS.DRAFT]: '草稿',
  [HOMEWORK_STATUS.PUBLISHED]: '已发布',
  [HOMEWORK_STATUS.EXPIRED]: '已截止'
}

/**
 * 作业提交状态
 */
export const SUBMIT_STATUS = {
  NOT_SUBMITTED: 0,
  SUBMITTED: 1,
  GRADED: 2
}

export const SUBMIT_STATUS_MAP = {
  [SUBMIT_STATUS.NOT_SUBMITTED]: '未提交',
  [SUBMIT_STATUS.SUBMITTED]: '已提交',
  [SUBMIT_STATUS.GRADED]: '已批改'
}

/**
 * 试卷状态
 */
export const PAPER_STATUS = {
  UNPUBLISHED: 0,
  PUBLISHED: 1,
  FINISHED: 2
}

export const PAPER_STATUS_MAP = {
  [PAPER_STATUS.UNPUBLISHED]: '未发布',
  [PAPER_STATUS.PUBLISHED]: '已发布',
  [PAPER_STATUS.FINISHED]: '已结束'
}

/**
 * 题型
 */
export const QUESTION_TYPE = {
  SINGLE_CHOICE: 1,
  MULTIPLE_CHOICE: 2,
  JUDGE: 3,
  FILL_BLANK: 4,
  SHORT_ANSWER: 5
}

export const QUESTION_TYPE_MAP = {
  [QUESTION_TYPE.SINGLE_CHOICE]: '单选题',
  [QUESTION_TYPE.MULTIPLE_CHOICE]: '多选题',
  [QUESTION_TYPE.JUDGE]: '判断题',
  [QUESTION_TYPE.FILL_BLANK]: '填空题',
  [QUESTION_TYPE.SHORT_ANSWER]: '简答题'
}

/**
 * 题目难度
 */
export const DIFFICULTY = {
  EASY: 1,
  MEDIUM: 2,
  HARD: 3
}

export const DIFFICULTY_MAP = {
  [DIFFICULTY.EASY]: '简单',
  [DIFFICULTY.MEDIUM]: '中等',
  [DIFFICULTY.HARD]: '困难'
}

/**
 * 考试记录状态
 */
export const EXAM_RECORD_STATUS = {
  NOT_STARTED: 0,
  IN_PROGRESS: 1,
  SUBMITTED: 2,
  GRADED: 3
}

export const EXAM_RECORD_STATUS_MAP = {
  [EXAM_RECORD_STATUS.NOT_STARTED]: '未开始',
  [EXAM_RECORD_STATUS.IN_PROGRESS]: '进行中',
  [EXAM_RECORD_STATUS.SUBMITTED]: '已提交',
  [EXAM_RECORD_STATUS.GRADED]: '已批改'
}

/**
 * 成绩类型
 */
export const SCORE_TYPE = {
  HOMEWORK: 1,
  EXAM: 2,
  COMPREHENSIVE: 3
}

export const SCORE_TYPE_MAP = {
  [SCORE_TYPE.HOMEWORK]: '作业成绩',
  [SCORE_TYPE.EXAM]: '考试成绩',
  [SCORE_TYPE.COMPREHENSIVE]: '综合成绩'
}

/**
 * 角色编码
 */
export const ROLE_CODE = {
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT'
}

export const ROLE_NAME_MAP = {
  [ROLE_CODE.ADMIN]: '管理员',
  [ROLE_CODE.TEACHER]: '教师',
  [ROLE_CODE.STUDENT]: '学生'
}

/**
 * 分页默认配置
 */
export const PAGE_CONFIG = {
  PAGE_NUM: 1,
  PAGE_SIZE: 10,
  PAGE_SIZES: [10, 20, 50, 100]
}
