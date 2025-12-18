/**
 * 用户相关 API
 */
import request from '@/utils/request'

/**
 * 用户登录
 * @param {Object} data 登录信息
 * @returns {Promise}
 */
export function login(data) {
  return request({
    url: '/user/login',
    method: 'post',
    data
  })
}

/**
 * 用户注册
 * @param {Object} data 注册信息
 * @returns {Promise}
 */
export function register(data) {
  return request({
    url: '/user/register',
    method: 'post',
    data
  })
}

/**
 * 获取当前登录用户信息
 * @returns {Promise}
 */
export function getCurrentUser() {
  return request({
    url: '/user/current',
    method: 'get'
  })
}

/**
 * 根据ID查询用户
 * @param {Number} id 用户ID
 * @returns {Promise}
 */
export function getUserById(id) {
  return request({
    url: `/user/${id}`,
    method: 'get'
  })
}

/**
 * 查询用户列表
 * @param {Object} params 查询条件
 * @returns {Promise}
 */
export function getUserList(params) {
  return request({
    url: '/user/list',
    method: 'get',
    params
  })
}

/**
 * 分页查询用户
 * @param {Object} params 查询条件
 * @returns {Promise}
 */
export function getUserPage(params) {
  return request({
    url: '/user/page',
    method: 'get',
    params
  })
}

/**
 * 新增用户
 * @param {Object} data 用户信息
 * @returns {Promise}
 */
export function createUser(data) {
  return request({
    url: '/user',
    method: 'post',
    data
  })
}

/**
 * 更新用户
 * @param {Object} data 用户信息
 * @returns {Promise}
 */
export function updateUser(data) {
  return request({
    url: '/user',
    method: 'put',
    data
  })
}

/**
 * 删除用户
 * @param {Number} id 用户ID
 * @returns {Promise}
 */
export function deleteUser(id) {
  return request({
    url: `/user/${id}`,
    method: 'delete'
  })
}

/**
 * 批量删除用户
 * @param {Array} ids 用户ID数组
 * @returns {Promise}
 */
export function batchDeleteUsers(ids) {
  return request({
    url: '/user/batch',
    method: 'delete',
    data: ids
  })
}

/**
 * 修改密码
 * @param {Object} data 密码信息
 * @returns {Promise}
 */
export function changePassword(data) {
  return request({
    url: '/user/change-password',
    method: 'put',
    data
  })
}

/**
 * 重置密码
 * @param {Number} userId 用户ID
 * @param {String} newPassword 新密码
 * @returns {Promise}
 */
export function resetPassword(userId, newPassword) {
  return request({
    url: `/user/reset-password/${userId}`,
    method: 'put',
    params: { newPassword }
  })
}

/**
 * 更新用户状态
 * @param {Number} userId 用户ID
 * @param {Number} status 状态
 * @returns {Promise}
 */
export function updateUserStatus(userId, status) {
  return request({
    url: '/user/status',
    method: 'put',
    data: { userId, status }
  })
}
