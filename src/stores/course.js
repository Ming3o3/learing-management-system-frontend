/**
 * 课程状态管理
 */
import { defineStore } from 'pinia'
import { getCourseList, getMyEnrollments } from '@/api/course'

export const useCourseStore = defineStore('course', {
  state: () => ({
    // 当前选中的课程
    currentCourse: null,
    // 我的课程列表（已选课程）
    myCourses: [],
    // 课程列表缓存
    courseCache: new Map()
  }),

  getters: {
    /**
     * 当前课程ID
     */
    currentCourseId: (state) => state.currentCourse?.id || null,

    /**
     * 当前课程名称
     */
    currentCourseName: (state) => state.currentCourse?.courseName || ''
  },

  actions: {
    /**
     * 设置当前课程
     */
    setCurrentCourse(course) {
      this.currentCourse = course
      if (course) {
        this.courseCache.set(course.id, course)
      }
    },

    /**
     * 获取课程列表
     */
    async fetchCourseList(params) {
      try {
        const res = await getCourseList(params)
        return res
      } catch (error) {
        return Promise.reject(error)
      }
    },

    /**
     * 获取我的课程
     */
    async fetchMyCourses() {
      try {
        const res = await getMyEnrollments()
        this.myCourses = res.data || []
        return res
      } catch (error) {
        return Promise.reject(error)
      }
    },

    /**
     * 从缓存获取课程
     */
    getCourseFromCache(courseId) {
      return this.courseCache.get(courseId)
    },

    /**
     * 清空当前课程
     */
    clearCurrentCourse() {
      this.currentCourse = null
    }
  }
})
