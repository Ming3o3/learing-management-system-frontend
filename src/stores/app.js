/**
 * 应用全局状态管理
 */
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    // 侧边栏是否折叠
    sidebarCollapsed: false,
    // 设备类型
    device: 'desktop',
    // 主题
    theme: 'light',
    // 页面加载状态
    loading: false
  }),

  getters: {
    /**
     * 是否移动端
     */
    isMobile: (state) => state.device === 'mobile',

    /**
     * 侧边栏宽度
     */
    sidebarWidth: (state) => (state.sidebarCollapsed ? 64 : 200)
  },

  actions: {
    /**
     * 切换侧边栏
     */
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },

    /**
     * 设置设备类型
     */
    setDevice(device) {
      this.device = device
    },

    /**
     * 切换主题
     */
    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light'
    },

    /**
     * 设置加载状态
     */
    setLoading(loading) {
      this.loading = loading
    }
  }
})
