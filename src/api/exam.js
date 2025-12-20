/**
 * 考试管理模块 API
 */
import request from '@/utils/request'

// ========== 试卷管理 ==========

/**
 * 分页查询试卷列表
 * @param {Object} params {paperName, courseId, teacherId, status, pageNum, pageSize}
 * @returns {Promise}
 */
export function getPaperPage(params) {
  return request({
    url: '/exam/paper/page',
    method: 'get',
    params
  })
}

/**
 * 根据ID查询试卷详情
 * @param {Number} id 试卷ID
 * @returns {Promise}
 */
export function getPaperById(id) {
  return request({
    url: `/exam/paper/${id}`,
    method: 'get'
  })
}

/**
 * 根据课程ID查询试卷列表
 * @param {Number} courseId 课程ID
 * @returns {Promise}
 */
export function getPaperByCourse(courseId) {
  return request({
    url: `/exam/paper/course/${courseId}`,
    method: 'get'
  })
}

/**
 * 新增试卷
 * @param {Object} data 试卷信息
 * @returns {Promise}
 */
export function createPaper(data) {
  return request({
    url: '/exam/paper',
    method: 'post',
    data
  })
}

/**
 * 更新试卷
 * @param {Object} data 试卷信息
 * @returns {Promise}
 */
export function updatePaper(data) {
  return request({
    url: '/exam/paper',
    method: 'put',
    data
  })
}

/**
 * 删除试卷
 * @param {Number} id 试卷ID
 * @returns {Promise}
 */
export function deletePaper(id) {
  return request({
    url: `/exam/paper/${id}`,
    method: 'delete'
  })
}

/**
 * 发布试卷
 * @param {Number} id 试卷ID
 * @returns {Promise}
 */
export function publishPaper(id) {
  return request({
    url: `/exam/paper/publish/${id}`,
    method: 'post'
  })
}

/**
 * 为试卷添加试题
 * @param {Object} data {paperId, questionIds}
 * @returns {Promise}
 */
export function addQuestionsToPaper(data) {
  return request({
    url: '/exam/paper/add-questions',
    method: 'post',
    data
  })
}

/**
 * 清空试卷所有试题
 * @param {Number} paperId 试卷ID
 * @returns {Promise}
 */
export function clearPaperQuestions(paperId) {
  return request({
    url: `/exam/paper/${paperId}/questions`,
    method: 'delete'
  })
}

/**
 * 从试卷移除试题
 * @param {Number} paperId 试卷ID
 * @param {Number} questionId 试题ID
 * @returns {Promise}
 */
export function removeQuestionFromPaper(paperId, questionId) {
  return request({
    url: `/exam/paper/${paperId}/question/${questionId}`,
    method: 'delete'
  })
}

// ========== 试题管理 ==========

/**
 * 分页查询试题列表
 * @param {Object} params {courseId, questionType, difficulty, title, pageNum, pageSize}
 * @returns {Promise}
 */
export function getQuestionPage(params) {
  return request({
    url: '/exam/question/page',
    method: 'get',
    params
  })
}

/**
 * 根据ID查询试题
 * @param {Number} id 试题ID
 * @returns {Promise}
 */
export function getQuestionById(id) {
  return request({
    url: `/exam/question/${id}`,
    method: 'get'
  })
}

/**
 * 根据课程ID查询试题列表
 * @param {Number} courseId 课程ID
 * @returns {Promise}
 */
export function getQuestionByCourse(courseId) {
  return request({
    url: `/exam/question/course/${courseId}`,
    method: 'get'
  })
}

/**
 * 根据试卷ID查询试题列表
 * @param {Number} paperId 试卷ID
 * @returns {Promise}
 */
export function getQuestionByPaper(paperId) {
  return request({
    url: `/exam/question/paper/${paperId}`,
    method: 'get'
  })
}

/**
 * 新增试题
 * @param {Object} data 试题信息
 * @returns {Promise}
 */
export function createQuestion(data) {
  return request({
    url: '/exam/question',
    method: 'post',
    data
  })
}

/**
 * 更新试题
 * @param {Object} data 试题信息
 * @returns {Promise}
 */
export function updateQuestion(data) {
  return request({
    url: '/exam/question',
    method: 'put',
    data
  })
}

/**
 * 删除试题
 * @param {Number} id 试题ID
 * @returns {Promise}
 */
export function deleteQuestion(id) {
  return request({
    url: `/exam/question/${id}`,
    method: 'delete'
  })
}

/**
 * 批量删除试题
 * @param {Array} ids 试题ID数组
 * @returns {Promise}
 */
export function deleteQuestionBatch(ids) {
  return request({
    url: '/exam/question/batch',
    method: 'delete',
    data: ids
  })
}

// ========== 考试记录管理 ==========

/**
 * 开始考试
 * @param {Number} paperId 试卷ID
 * @returns {Promise}
 */
export function startExam(paperId) {
  return request({
    url: `/exam/record/start/${paperId}`,
    method: 'post'
  })
}

/**
 * 提交答案
 * @param {Object} data {recordId, answers: [{questionId, studentAnswer}]}
 * @returns {Promise}
 */
export function submitAnswers(data) {
  return request({
    url: '/exam/record/submit',
    method: 'post',
    data
  })
}

/**
 * 批改试卷
 * @param {Number} recordId 考试记录ID
 * @returns {Promise}
 */
export function correctExam(recordId) {
  return request({
    url: `/exam/record/correct/${recordId}`,
    method: 'post'
  })
}

/**
 * 根据ID查询考试记录
 * @param {Number} id 考试记录ID
 * @returns {Promise}
 */
export function getRecordById(id) {
  return request({
    url: `/exam/record/${id}`,
    method: 'get'
  })
}

/**
 * 根据试卷ID分页查询考试记录
 * @param {Number} paperId 试卷ID
 * @param {Object} params {pageNum, pageSize}
 * @returns {Promise}
 */
export function getRecordsByPaper(paperId, params) {
  return request({
    url: `/exam/record/paper/${paperId}`,
    method: 'get',
    params
  })
}

/**
 * 查询我的考试记录
 * @returns {Promise}
 */
export function getMyRecords() {
  return request({
    url: '/exam/record/my',
    method: 'get'
  })
}

/**
 * 查询我的某次考试记录
 * @param {Number} paperId 试卷ID
 * @returns {Promise}
 */
export function getMyRecord(paperId) {
  return request({
    url: `/exam/record/my/${paperId}`,
    method: 'get'
  })
}
