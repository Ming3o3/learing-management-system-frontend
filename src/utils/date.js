/**
 * 日期时间工具函数
 */
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import relativeTime from 'dayjs/plugin/relativeTime'
import duration from 'dayjs/plugin/duration'

dayjs.locale('zh-cn')
dayjs.extend(relativeTime)
dayjs.extend(duration)

/**
 * 格式化日期时间
 * @param {Date|String|Number} date 日期
 * @param {String} format 格式
 * @returns {String}
 */
export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return ''
  return dayjs(date).format(format)
}

/**
 * 格式化日期
 * @param {Date|String|Number} date 日期
 * @returns {String}
 */
export function formatDateOnly(date) {
  return formatDate(date, 'YYYY-MM-DD')
}

/**
 * 格式化时间
 * @param {Date|String|Number} date 日期
 * @returns {String}
 */
export function formatTimeOnly(date) {
  return formatDate(date, 'HH:mm:ss')
}

/**
 * 相对时间（多久之前）
 * @param {Date|String|Number} date 日期
 * @returns {String}
 */
export function fromNow(date) {
  if (!date) return ''
  return dayjs(date).fromNow()
}

/**
 * 计算时长（秒转为可读格式）
 * @param {Number} seconds 秒数
 * @returns {String}
 */
export function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '0分钟'

  const dur = dayjs.duration(seconds, 'seconds')
  const hours = Math.floor(dur.asHours())
  const minutes = dur.minutes()
  const secs = dur.seconds()

  const parts = []
  if (hours > 0) parts.push(`${hours}小时`)
  if (minutes > 0) parts.push(`${minutes}分钟`)
  if (secs > 0 && hours === 0) parts.push(`${secs}秒`)

  return parts.join('') || '0分钟'
}

/**
 * 判断日期是否过期
 * @param {Date|String|Number} date 日期
 * @returns {Boolean}
 */
export function isExpired(date) {
  if (!date) return false
  return dayjs(date).isBefore(dayjs())
}

/**
 * 计算两个日期之间的天数
 * @param {Date|String|Number} startDate 开始日期
 * @param {Date|String|Number} endDate 结束日期
 * @returns {Number}
 */
export function daysBetween(startDate, endDate) {
  if (!startDate || !endDate) return 0
  return dayjs(endDate).diff(dayjs(startDate), 'day')
}
