/**
 * 表单验证规则
 */

/**
 * 验证手机号
 */
export function validatePhone(rule, value, callback) {
  if (!value) {
    return callback()
  }
  const reg = /^1[3-9]\d{9}$/
  if (!reg.test(value)) {
    callback(new Error('请输入正确的手机号'))
  } else {
    callback()
  }
}

/**
 * 验证邮箱
 */
export function validateEmail(rule, value, callback) {
  if (!value) {
    return callback()
  }
  const reg = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/
  if (!reg.test(value)) {
    callback(new Error('请输入正确的邮箱地址'))
  } else {
    callback()
  }
}

/**
 * 验证密码强度（至少6位）
 */
export function validatePassword(rule, value, callback) {
  if (!value) {
    callback(new Error('请输入密码'))
  } else if (value.length < 6) {
    callback(new Error('密码长度不能少于6位'))
  } else {
    callback()
  }
}

/**
 * 验证用户名（字母开头，允许字母数字下划线）
 */
export function validateUsername(rule, value, callback) {
  if (!value) {
    callback(new Error('请输入用户名'))
  } else {
    const reg = /^[a-zA-Z][a-zA-Z0-9_]{2,15}$/
    if (!reg.test(value)) {
      callback(new Error('用户名必须以字母开头，3-16位字母、数字或下划线'))
    } else {
      callback()
    }
  }
}

/**
 * 通用必填验证
 */
export const required = { required: true, message: '此项为必填项', trigger: 'blur' }

/**
 * 手机号验证规则
 */
export const phoneRule = { validator: validatePhone, trigger: 'blur' }

/**
 * 邮箱验证规则
 */
export const emailRule = { validator: validateEmail, trigger: 'blur' }

/**
 * 密码验证规则
 */
export const passwordRule = { validator: validatePassword, trigger: 'blur' }

/**
 * 用户名验证规则
 */
export const usernameRule = { validator: validateUsername, trigger: 'blur' }
