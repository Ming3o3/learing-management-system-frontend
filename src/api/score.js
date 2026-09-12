/**
 * 成绩相关 API
 */
import request from '@/utils/request'

/**
 * 查询成绩列表
 * @param {Object} params 查询条件
 * @returns {Promise}
 */
export function getScoreList(params) {
  return request({
    url: '/score/list',
    method: 'get',
    params,
  })
}

/**
 * 查询学生个人成绩
 * @param {Number} courseId 课程ID（可选）
 * @returns {Promise}
 */
export function getMyScores(courseId) {
  return request({
    url: '/score/my-scores',
    method: 'get',
    params: { courseId },
  })
}

/**
 * 根据ID查询成绩详情
 * @param {Number} id 成绩ID
 * @returns {Promise}
 */
export function getScoreById(id) {
  return request({
    url: `/score/${id}`,
    method: 'get',
  })
}

/**
 * 查询成绩的人工批改记录
 * @param {Number} id 成绩ID
 * @returns {Promise}
 */
export function getScoreHistory(id) {
  return request({
    url: `/score/${id}/history`,
    method: 'get',
  })
}

/**
 * 查询课程成绩统计
 * @param {Number} courseId 课程ID
 * @param {String} scoreType 成绩类型（可选）
 * @returns {Promise}
 */
export function getCourseScoreStats(courseId, scoreType) {
  return request({
    url: `/score/course/${courseId}/stats`,
    method: 'get',
    params: { scoreType },
  })
}

/**
 * 查询课程综合成绩权重
 * @param {Number} courseId 课程ID
 * @returns {Promise}
 */
export function getComprehensiveScoreConfig(courseId) {
  return request({
    url: `/score/course/${courseId}/comprehensive`,
    method: 'get',
  })
}

/**
 * 保存权重并重新计算课程综合成绩
 * @param {Number} courseId 课程ID
 * @param {Object} data 作业与考试权重
 * @returns {Promise}
 */
export function recalculateComprehensiveScores(courseId, data) {
  return request({
    url: `/score/course/${courseId}/comprehensive`,
    method: 'put',
    data,
  })
}

/**
 * 按当前角色查询成绩申诉
 * @param {Object} params 查询条件
 * @returns {Promise}
 */
export function getScoreAppeals(params) {
  return request({
    url: '/score/appeals',
    method: 'get',
    params,
  })
}

/**
 * 学生发起成绩申诉
 * @param {Object} data 成绩ID与申诉理由
 * @returns {Promise}
 */
export function createScoreAppeal(data) {
  return request({
    url: '/score/appeals',
    method: 'post',
    data,
  })
}

/**
 * 学生撤回待处理申诉
 * @param {Number} id 申诉ID
 * @returns {Promise}
 */
export function cancelScoreAppeal(id) {
  return request({
    url: `/score/appeals/${id}/cancel`,
    method: 'put',
  })
}

/**
 * 教师或管理员复核成绩申诉
 * @param {Number} id 申诉ID
 * @param {Object} data 复核结果与说明
 * @returns {Promise}
 */
export function reviewScoreAppeal(id, data) {
  return request({
    url: `/score/appeals/${id}/review`,
    method: 'put',
    data,
  })
}

/**
 * 导出成绩
 * @param {Object} params 查询条件
 * @returns {Promise}
 */
export function exportScores(params) {
  return request({
    url: '/score/export',
    method: 'get',
    params,
    responseType: 'blob',
  })
}

/**
 * 同步考试成绩
 * @param {Number} examRecordId 考试记录ID
 * @returns {Promise}
 */
export function syncExamScore(examRecordId) {
  return request({
    url: `/score/sync/exam/${examRecordId}`,
    method: 'post',
  })
}

/**
 * 批量同步所有考试成绩
 * @returns {Promise}
 */
export function syncAllExamScores() {
  return request({
    url: '/score/sync/exam/batch',
    method: 'post',
  })
}

/**
 * 同步作业成绩
 * @param {Number} homeworkSubmissionId 作业提交ID
 * @returns {Promise}
 */
export function syncHomeworkScore(homeworkSubmissionId) {
  return request({
    url: `/score/sync/homework/${homeworkSubmissionId}`,
    method: 'post',
  })
}

/**
 * 成绩上链
 * @param {Number} id 成绩ID
 * @returns {Promise}
 */
export function publishScoreToChain(id) {
  return request({
    url: `/score/${id}/publish-chain`,
    method: 'post',
  })
}

/**
 * 成绩链上验真（按用户ID + 考试记录ID）
 * @param {String} userId 用户ID
 * @param {String} relatedId 考试记录ID(score.related_id)
 * @returns {Promise}
 */
export function verifyGradeOnChain(userId, relatedId) {
  return request({
    url: '/score/verify',
    method: 'get',
    params: { userId, relatedId },
  })
}
