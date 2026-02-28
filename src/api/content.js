/**
 * 课程内容相关 API
 */
import request from '@/utils/request'

/**
 * 查询课程的所有内容
 * @param {Number} courseId 课程ID
 * @returns {Promise}
 */
export function getContentList(courseId) {
  return request({
    url: `/course/content/list/${courseId}`,
    method: 'get',
  })
}

/**
 * 根据ID查询内容详情
 * @param {Number} id 内容ID
 * @returns {Promise}
 */
export function getContentById(id) {
  return request({
    url: `/course/content/${id}`,
    method: 'get',
  })
}

/**
 * 创建课程内容（非视频）
 * @param {Object} data 内容信息
 * @returns {Promise}
 */
export function createContent(data) {
  return request({
    url: '/course/content',
    method: 'post',
    data,
  })
}

/**
 * 更新课程内容
 * @param {Object} data 内容信息
 * @returns {Promise}
 */
export function updateContent(data) {
  return request({
    url: '/course/content',
    method: 'put',
    data,
  })
}

/**
 * 删除课程内容
 * @param {Number} id 内容ID
 * @returns {Promise}
 */
export function deleteContent(id) {
  return request({
    url: `/course/content/${id}`,
    method: 'delete',
  })
}

/**
 * 获取视频预签名上传URL
 * @param {Object} data 视频上传信息
 * @returns {Promise}
 */
export function getVideoUploadUrl(data) {
  return request({
    url: '/course/content/video/upload-url',
    method: 'post',
    data,
  })
}

/**
 * 确认视频上传完成（触发HLS转换）
 * @param {Number} contentId 内容ID
 * @returns {Promise}
 */
export function confirmVideoUpload(contentId) {
  return request({
    url: `/course/content/video/confirm/${contentId}`,
    method: 'post',
    timeout: 120000,
  })
}

/**
 * 直接上传视频文件
 * @param {FormData} formData 表单数据
 * @param {Function} onUploadProgress 上传进度回调
 * @returns {Promise}
 */
export function uploadVideo(formData, onUploadProgress) {
  return request({
    url: '/course/content/video/upload',
    method: 'post',
    data: formData,
    timeout: 300000,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  })
}

/**
 * 获取HLS播放URL
 * @param {Number} contentId 内容ID
 * @returns {Promise}
 */
export function getHlsPlayUrl(contentId) {
  return request({
    url: `/course/content/video/play/${contentId}`,
    method: 'get',
  })
}
