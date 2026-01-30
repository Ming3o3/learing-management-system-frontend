/**
 * 考试监考相关API接口
 * @description 提供考试监考、违规记录等功能
 */
import request from '@/utils/request'

/**
 * 获取监考配置信息
 * @param {number} examId - 考试ID
 * @returns {Promise} 监考配置数据
 */
export function getProctorConfig(examId) {
  return request({
    url: `/proctor/config/${examId}`,
    method: 'get',
  })
}

/**
 * 提交违规记录
 * @param {Object} data - 违规记录数据
 * @param {number} data.examId - 考试ID
 * @param {number} data.studentId - 学生ID
 * @param {string} data.violationType - 违规类型
 * @param {string} data.description - 违规描述
 * @param {string} data.timestamp - 时间戳
 * @param {string} data.screenshot - 截图Base64（可选）
 * @returns {Promise} 提交结果
 */
export function submitViolation(data) {
  return request({
    url: '/proctor/violation',
    method: 'post',
    data,
  })
}

/**
 * 批量提交违规记录
 * @param {Array} violations - 违规记录数组
 * @returns {Promise} 提交结果
 */
export function submitViolationBatch(violations) {
  return request({
    url: '/proctor/violation/batch',
    method: 'post',
    data: { violations },
  })
}

/**
 * 获取学生违规记录列表
 * @param {Object} params - 查询参数
 * @param {number} params.examId - 考试ID
 * @param {number} params.studentId - 学生ID（可选）
 * @returns {Promise} 违规记录列表
 */
export function getViolationList(params) {
  return request({
    url: '/proctor/violation/list',
    method: 'get',
    params,
  })
}

/**
 * 开始监考会话
 * @param {Object} data - 会话数据
 * @param {number} data.examId - 考试ID
 * @param {number} data.studentId - 学生ID
 * @returns {Promise} 会话信息（包含WebSocket token等）
 */
export function startProctorSession(data) {
  return request({
    url: '/proctor/session/start',
    method: 'post',
    data,
  })
}

/**
 * 结束监考会话
 * @param {Object} data - 会话数据
 * @param {number} data.examId - 考试ID
 * @param {number} data.studentId - 学生ID
 * @param {number} data.duration - 监考时长（秒）
 * @param {number} data.violationCount - 违规次数
 * @returns {Promise} 结束结果
 */
export function endProctorSession(data) {
  return request({
    url: '/proctor/session/end',
    method: 'post',
    data,
  })
}

/**
 * 心跳检测
 * @param {Object} data - 心跳数据
 * @param {number} data.examId - 考试ID
 * @param {number} data.studentId - 学生ID
 * @returns {Promise} 心跳响应
 */
export function heartbeat(data) {
  return request({
    url: '/proctor/heartbeat',
    method: 'post',
    data,
  })
}

/**
 * 上传监考快照
 * @param {FormData} formData - 包含图片文件的表单数据
 * @returns {Promise} 上传结果
 */
export function uploadSnapshot(formData) {
  return request({
    url: '/proctor/snapshot/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

/**
 * 注册考生身份信息（上传身份照片）
 * @param {Object} data - 注册数据
 * @param {number} data.examId - 考试ID
 * @param {number} data.studentId - 学生ID
 * @param {File} data.identityPhoto - 考生身份照片文件
 * @returns {Promise} 注册结果
 * @description 用于人脸识别验证，需在开始考试前上传
 */
export function registerStudentIdentity(data) {
  const formData = new FormData()
  formData.append('exam_id', data.examId)
  formData.append('student_id', data.studentId)
  formData.append('target_image', data.identityPhoto)

  return request({
    url: 'http://localhost:8000/api/exam/register',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    skipCodeCheck: true,
  })
}

/**
 * 获取考生身份信息
 * @param {Object} params - 查询参数
 * @param {number} params.examId - 考试ID
 * @param {number} params.studentId - 学生ID
 * @returns {Promise} 考生身份信息
 */
export function getStudentIdentity(params) {
  return request({
    url: '/proctor/identity/info',
    method: 'get',
    params,
  })
}

/**
 * 删除考生身份照片
 * @param {Object} data - 删除参数
 * @param {number} data.examId - 考试ID
 * @param {number} data.studentId - 学生ID
 * @returns {Promise} 删除结果
 */
export function deleteStudentIdentity(data) {
  return request({
    url: '/proctor/identity/delete',
    method: 'delete',
    data,
  })
}
