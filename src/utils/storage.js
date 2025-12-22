/**
 * 本地存储工具
 * 提供统一的 localStorage 和 sessionStorage 操作
 */

const PREFIX = 'LMS_'

/**
 * LocalStorage 操作
 */
export const local = {
  set(key, value) {
    const data = JSON.stringify(value)
    localStorage.setItem(PREFIX + key, data)
  },

  get(key) {
    const data = localStorage.getItem(PREFIX + key)
    if (data) {
      try {
        return JSON.parse(data)
      } catch (e) {
        return data
      }
    }
    return null
  },

  remove(key) {
    localStorage.removeItem(PREFIX + key)
  },

  clear() {
    localStorage.clear()
  },
}

/**
 * SessionStorage 操作
 */
export const session = {
  set(key, value) {
    const data = JSON.stringify(value)
    sessionStorage.setItem(PREFIX + key, data)
  },

  get(key) {
    const data = sessionStorage.getItem(PREFIX + key)
    if (data) {
      try {
        return JSON.parse(data)
      } catch (e) {
        return data
      }
    }
    return null
  },

  remove(key) {
    sessionStorage.removeItem(PREFIX + key)
  },

  clear() {
    sessionStorage.clear()
  },
}

/**
 * 获取 Token
 */
export const getToken = () => {
  return local.get('token')
}

/**
 * 设置 Token
 */
export const setToken = (token) => {
  local.set('token', token)
}

/**
 * 移除 Token
 */
export const removeToken = () => {
  local.remove('token')
}
