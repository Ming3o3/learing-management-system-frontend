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
