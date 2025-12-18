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
    params
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
    params: { courseId }
  })
}

/**
 * 查询课程成绩统计
 * @param {Number} courseId 课程ID
 * @returns {Promise}
 */
export function getCourseScoreStats(courseId) {
  return request({
    url: `/score/course/${courseId}/stats`,
    method: 'get'
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
    responseType: 'blob'
  })
}
