/**
 * 考试相关 API
 */
import request from '@/utils/request'

/**
 * 查询试卷列表
 * @param {Object} params 查询条件
 * @returns {Promise}
 */
export function getPaperList(params) {
  return request({
    url: '/exam/paper/list',
    method: 'get',
    params
  })
}

/**
 * 根据ID查询试卷
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
    method: 'put'
  })
}

/**
 * 查询试题列表
 * @param {Object} params 查询条件
 * @returns {Promise}
 */
export function getQuestionList(params) {
  return request({
    url: '/exam/question/list',
    method: 'get',
    params
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
 * 查询试卷试题
 * @param {Number} paperId 试卷ID
 * @returns {Promise}
 */
export function getPaperQuestions(paperId) {
  return request({
    url: `/exam/paper/${paperId}/questions`,
    method: 'get'
  })
}

/**
 * 添加试题到试卷
 * @param {Object} data 关联信息
 * @returns {Promise}
 */
export function addQuestionToPaper(data) {
  return request({
    url: '/exam/paper/add-question',
    method: 'post',
    data
  })
}

/**
 * 开始考试
 * @param {Number} paperId 试卷ID
 * @returns {Promise}
 */
export function startExam(paperId) {
  return request({
    url: '/exam/start',
    method: 'post',
    data: { paperId }
  })
}

/**
 * 提交考试
 * @param {Object} data 答题信息
 * @returns {Promise}
 */
export function submitExam(data) {
  return request({
    url: '/exam/submit',
    method: 'post',
    data
  })
}

/**
 * 查询考试记录
 * @param {Object} params 查询条件
 * @returns {Promise}
 */
export function getExamRecords(params) {
  return request({
    url: '/exam/records',
    method: 'get',
    params
  })
}

/**
 * 查询考试详情
 * @param {Number} recordId 考试记录ID
 * @returns {Promise}
 */
export function getExamDetail(recordId) {
  return request({
    url: `/exam/record/${recordId}`,
    method: 'get'
  })
}

/**
 * 批改考试
 * @param {Object} data 批改信息
 * @returns {Promise}
 */
export function gradeExam(data) {
  return request({
    url: '/exam/grade',
    method: 'put',
    data
  })
}
