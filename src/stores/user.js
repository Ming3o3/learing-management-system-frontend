/**
 * 用户状态管理
 */
import { defineStore } from 'pinia'
import { login as loginApi, getCurrentUser } from '@/api/user'
import { local } from '@/utils/storage'
import router from '@/router'

const TOKEN_KEY = 'token'
const USER_INFO_KEY = 'userInfo'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: local.get(TOKEN_KEY) || '',
    userInfo: local.get(USER_INFO_KEY) || null,
    roles: []
  }),

  getters: {
    /**
     * 是否已登录
     */
    isLoggedIn: (state) => !!state.token,

    /**
     * 用户ID
     */
    userId: (state) => state.userInfo?.id || null,

    /**
     * 用户名
     */
    username: (state) => state.userInfo?.username || '',

    /**
     * 真实姓名
     */
    realName: (state) => state.userInfo?.realName || '',

    /**
     * 头像
     */
    avatar: (state) => state.userInfo?.avatar || '',

    /**
     * 是否是管理员
     */
    isAdmin: (state) => state.roles.includes('ADMIN'),

    /**
     * 是否是教师
     */
    isTeacher: (state) => state.roles.includes('TEACHER'),

    /**
     * 是否是学生
     */
    isStudent: (state) => state.roles.includes('STUDENT')
  },

  actions: {
    /**
     * 用户登录
     */
    async login(loginForm) {
      try {
        const res = await loginApi(loginForm)
        const { token, userInfo } = res.data

        this.token = token
        this.userInfo = userInfo

        // 持久化存储
        local.set(TOKEN_KEY, token)
        local.set(USER_INFO_KEY, userInfo)

        // 获取用户完整信息（包括角色）
        await this.getUserInfo()

        return res
      } catch (error) {
        return Promise.reject(error)
      }
    },

    /**
     * 获取用户信息
     */
    async getUserInfo() {
      try {
        const res = await getCurrentUser()
        this.userInfo = res.data
        local.set(USER_INFO_KEY, res.data)

        // 从userInfo中提取roles
        this.roles = res.data.roles || []
        console.log('用户角色:', this.roles)

        return res
      } catch (error) {
        return Promise.reject(error)
      }
    },

    /**
     * 登出
     */
    logout() {
      this.token = ''
      this.userInfo = null
      this.roles = []

      local.remove(TOKEN_KEY)
      local.remove(USER_INFO_KEY)

      router.push('/login')
    },

    /**
     * 更新用户信息
     */
    updateUserInfo(userInfo) {
      this.userInfo = { ...this.userInfo, ...userInfo }
      local.set(USER_INFO_KEY, this.userInfo)
    }
  }
})
