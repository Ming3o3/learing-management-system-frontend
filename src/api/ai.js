/**
 * AI智能解析相关接口
 */
import request from '@/utils/request'
import { local } from '@/utils/storage'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

/**
 * 同步解析题目
 * @param {Object} data 解析请求数据
 * @returns {Promise}
 */
export function analyzeQuestion(data) {
  return request({
    url: '/ai/analyze',
    method: 'post',
    data,
  })
}

/**
 * 流式解析题目（SSE）
 * @param {Object} data 解析请求数据
 * @param {Function} onMessage 接收消息的回调函数
 * @param {Function} onError 错误回调函数
 * @param {Function} onComplete 完成回调函数
 * @returns {Function} 取消函数
 */
export function analyzeQuestionStream(data, onMessage, onError, onComplete) {
  const token = local.get('token')

  // 使用fetch API实现SSE POST请求
  const controller = new AbortController()

  fetch(`${BASE_URL}/api/ai/analyze/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
    signal: controller.signal,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      function read() {
        reader
          .read()
          .then(({ done, value }) => {
            if (done) {
              onComplete && onComplete()
              return
            }

            const text = decoder.decode(value, { stream: true })
            // 解析SSE格式数据
            const lines = text.split('\n')
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const content = line.substring(6)
                if (content && content !== '[DONE]') {
                  onMessage && onMessage(content)
                }
              }
            }

            read()
          })
          .catch((error) => {
            if (error.name !== 'AbortError') {
              onError && onError(error)
            }
          })
      }

      read()
    })
    .catch((error) => {
      if (error.name !== 'AbortError') {
        onError && onError(error)
      }
    })

  // 返回取消函数
  return () => {
    controller.abort()
  }
}

/**
 * 检查AI服务状态
 * @returns {Promise}
 */
export function checkAiHealth() {
  return request({
    url: '/ai/health',
    method: 'get',
  })
}
