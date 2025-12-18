/**
 * 通用工具函数
 */

/**
 * 防抖函数
 * @param {Function} fn 要执行的函数
 * @param {Number} delay 延迟时间（毫秒）
 * @returns {Function}
 */
export function debounce(fn, delay = 300) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * 节流函数
 * @param {Function} fn 要执行的函数
 * @param {Number} delay 延迟时间（毫秒）
 * @returns {Function}
 */
export function throttle(fn, delay = 300) {
  let timer = null
  return function (...args) {
    if (timer) return
    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay)
  }
}

/**
 * 深拷贝
 * @param {Any} obj 要拷贝的对象
 * @returns {Any}
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj)
  if (obj instanceof RegExp) return new RegExp(obj)
  if (obj instanceof Array) {
    return obj.map((item) => deepClone(item))
  }
  const cloneObj = {}
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloneObj[key] = deepClone(obj[key])
    }
  }
  return cloneObj
}

/**
 * 下载文件
 * @param {Blob} blob 文件流
 * @param {String} filename 文件名
 */
export function downloadFile(blob, filename) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.URL.revokeObjectURL(url)
}

/**
 * 文件大小格式化
 * @param {Number} size 文件大小（字节）
 * @returns {String}
 */
export function formatFileSize(size) {
  if (!size) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let index = 0
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024
    index++
  }
  return `${size.toFixed(2)} ${units[index]}`
}

/**
 * 获取文件扩展名
 * @param {String} filename 文件名
 * @returns {String}
 */
export function getFileExtension(filename) {
  if (!filename) return ''
  const index = filename.lastIndexOf('.')
  return index > -1 ? filename.substring(index + 1).toLowerCase() : ''
}

/**
 * 生成唯一ID
 * @returns {String}
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

/**
 * 树形数据转换为平铺数据
 * @param {Array} tree 树形数据
 * @param {String} childrenKey 子节点的key
 * @returns {Array}
 */
export function flattenTree(tree, childrenKey = 'children') {
  const result = []
  const flatten = (nodes) => {
    nodes.forEach((node) => {
      result.push(node)
      if (node[childrenKey] && node[childrenKey].length) {
        flatten(node[childrenKey])
      }
    })
  }
  flatten(tree)
  return result
}

/**
 * 平铺数据转换为树形数据
 * @param {Array} list 平铺数据
 * @param {String} idKey id字段名
 * @param {String} parentIdKey 父id字段名
 * @param {String} childrenKey 子节点字段名
 * @returns {Array}
 */
export function listToTree(list, idKey = 'id', parentIdKey = 'parentId', childrenKey = 'children') {
  const map = {}
  const result = []

  list.forEach((item) => {
    map[item[idKey]] = { ...item, [childrenKey]: [] }
  })

  list.forEach((item) => {
    const parent = map[item[parentIdKey]]
    if (parent) {
      parent[childrenKey].push(map[item[idKey]])
    } else {
      result.push(map[item[idKey]])
    }
  })

  return result
}
