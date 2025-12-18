/**
 * 学习记录相关 API
 */
import request from '@/utils/request'

/**
 * 记录学习进度
 * @param {Object} data 学习信息
 * @returns {Promise}
 */
export function recordLearning(data) {
  return request({
    url: '/learning/record',
    method: 'post',
    data
  })
}

/**
 * 查询学习记录
 * @param {Number} courseId 课程ID
 * @returns {Promise}
 */
export function getLearningRecords(courseId) {
  return request({
    url: '/learning/records',
    method: 'get',
    params: { courseId }
  })
}

/**
 * 查询课程学习进度
 * @param {Number} courseId 课程ID
 * @returns {Promise}
 */
export function getCourseProgress(courseId) {
  return request({
    url: `/learning/course/${courseId}/progress`,
    method: 'get'
  })
}

/**
 * 查询学习统计数据
 * @returns {Promise}
 */
export function getLearningStats() {
  return request({
    url: '/learning/stats',
    method: 'get'
  })
}
