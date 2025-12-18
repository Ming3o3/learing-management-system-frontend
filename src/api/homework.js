/**
 * 作业相关 API
 */
import request from '@/utils/request'

/**
 * 查询作业列表
 * @param {Object} params 查询条件
 * @returns {Promise}
 */
export function getHomeworkList(params) {
  return request({
    url: '/homework/list',
    method: 'get',
    params
  })
}

/**
 * 根据ID查询作业
 * @param {Number} id 作业ID
 * @returns {Promise}
 */
export function getHomeworkById(id) {
  return request({
    url: `/homework/${id}`,
    method: 'get'
  })
}

/**
 * 新增作业
 * @param {Object} data 作业信息
 * @returns {Promise}
 */
export function createHomework(data) {
  return request({
    url: '/homework',
    method: 'post',
    data
  })
}

/**
 * 更新作业
 * @param {Object} data 作业信息
 * @returns {Promise}
 */
export function updateHomework(data) {
  return request({
    url: '/homework',
    method: 'put',
    data
  })
}

/**
 * 删除作业
 * @param {Number} id 作业ID
 * @returns {Promise}
 */
export function deleteHomework(id) {
  return request({
    url: `/homework/${id}`,
    method: 'delete'
  })
}

/**
 * 发布作业
 * @param {Number} id 作业ID
 * @returns {Promise}
 */
export function publishHomework(id) {
  return request({
    url: `/homework/publish/${id}`,
    method: 'put'
  })
}

/**
 * 提交作业
 * @param {Object} data 提交信息
 * @returns {Promise}
 */
export function submitHomework(data) {
  return request({
    url: '/homework/submit',
    method: 'post',
    data
  })
}

/**
 * 查询作业提交列表
 * @param {Number} homeworkId 作业ID
 * @returns {Promise}
 */
export function getSubmitList(homeworkId) {
  return request({
    url: `/homework/${homeworkId}/submits`,
    method: 'get'
  })
}

/**
 * 查询学生作业提交详情
 * @param {Number} homeworkId 作业ID
 * @returns {Promise}
 */
export function getMySubmit(homeworkId) {
  return request({
    url: `/homework/${homeworkId}/my-submit`,
    method: 'get'
  })
}

/**
 * 批改作业
 * @param {Object} data 批改信息
 * @returns {Promise}
 */
export function gradeHomework(data) {
  return request({
    url: '/homework/grade',
    method: 'put',
    data
  })
}
