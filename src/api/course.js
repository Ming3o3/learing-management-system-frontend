/**
 * 课程相关 API
 */
import request from '@/utils/request'

/**
 * 根据ID查询课程
 * @param {Number} id 课程ID
 * @returns {Promise}
 */
export function getCourseById(id) {
  return request({
    url: `/course/${id}`,
    method: 'get'
  })
}

/**
 * 查询课程列表
 * @param {Object} params 查询条件
 * @returns {Promise}
 */
export function getCourseList(params) {
  return request({
    url: '/course/list',
    method: 'get',
    params
  })
}

/**
 * 分页查询课程
 * @param {Object} params 查询条件，包含 pageNum/pageSize
 * @returns {Promise}
 */
export function getCoursePage(params) {
  return request({
    url: '/course/page',
    method: 'get',
    params
  })
}

/**
 * 根据教师ID查询课程
 * @param {Number} teacherId 教师ID
 * @returns {Promise}
 */
export function getCoursesByTeacher(teacherId) {
  return request({
    url: `/course/teacher/${teacherId}`,
    method: 'get'
  })
}

/**
 * 新增课程
 * @param {Object} data 课程信息
 * @returns {Promise}
 */
export function createCourse(data) {
  return request({
    url: '/course',
    method: 'post',
    data
  })
}

/**
 * 更新课程
 * @param {Number} id 课程ID
 * @param {Object} data 课程信息
 * @returns {Promise}
 */
export function updateCourse(id, data) {
  return request({
    url: '/course',
    method: 'put',
    data: { ...data, id }
  })
}

/**
 * 删除课程
 * @param {Number} id 课程ID
 * @returns {Promise}
 */
export function deleteCourse(id) {
  return request({
    url: `/course/${id}`,
    method: 'delete'
  })
}

/**
 * 发布课程
 * @param {Number} id 课程ID
 * @returns {Promise}
 */
export function publishCourse(id) {
  return request({
    url: `/course/publish/${id}`,
    method: 'put'
  })
}

/**
 * 查询课程内容列表
 * @param {Number} courseId 课程ID
 * @returns {Promise}
 */
export function getCourseContent(courseId) {
  return request({
    url: `/course/${courseId}/content`,
    method: 'get'
  })
}

/**
 * 新增课程内容
 * @param {Object} data 内容信息
 * @returns {Promise}
 */
export function createCourseContent(data) {
  return request({
    url: '/course/content',
    method: 'post',
    data
  })
}

/**
 * 更新课程内容
 * @param {Object} data 内容信息
 * @returns {Promise}
 */
export function updateCourseContent(data) {
  return request({
    url: '/course/content',
    method: 'put',
    data
  })
}

/**
 * 删除课程内容
 * @param {Number} id 内容ID
 * @returns {Promise}
 */
export function deleteCourseContent(id) {
  return request({
    url: `/course/content/${id}`,
    method: 'delete'
  })
}

/**
 * 学生选课
 * @param {Number} courseId 课程ID
 * @returns {Promise}
 */
export function enrollCourse(courseId) {
  return request({
    url: '/course/enroll',
    method: 'post',
    data: { courseId }
  })
}

/**
 * 学生退课
 * @param {Number} courseId 课程ID
 * @returns {Promise}
 */
export function dropCourse(courseId) {
  return request({
    url: `/course/drop/${courseId}`,
    method: 'delete'
  })
}

/**
 * 查询学生已选课程
 * @returns {Promise}
 */
export function getMyEnrollments() {
  return request({
    url: '/course/my-courses',
    method: 'get'
  })
}

/**
 * 查询课程的学生列表
 * @param {Number} courseId 课程ID
 * @returns {Promise}
 */
export function getCourseStudents(courseId) {
  return request({
    url: `/course/${courseId}/students`,
    method: 'get'
  })
}

/**
 * 移除学生选课
 * @param {Number} courseId 课程ID
 * @param {Number} studentId 学生ID
 * @returns {Promise}
 */
export function removeStudentFromCourse(courseId, studentId) {
  return request({
    url: `/course/${courseId}/students/${studentId}`,
    method: 'delete'
  })
}
