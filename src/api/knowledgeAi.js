/**
 * 学习助手 AI 接口
 * 提供知识点学习、AI出题、学习路径推荐
 */
import request from '@/utils/request'
import { local } from '@/utils/storage'

const API_BASE = import.meta.env.VITE_APP_BASE_API || '/api'

/**
 * 通用 SSE 流式 POST 请求
 */
function stripDataPrefix(s) {
  let t = (s && s.trim()) || ''
  while (t.startsWith('data: ')) t = t.substring(6).trim()
  return t
}

function readSSEStream(reader, decoder, onMessage, onError, onComplete) {
  let buffer = ''
  let pending = ''
  function flushPending() {
    const out = stripDataPrefix(pending)
    pending = ''
    if (!out || out === '[DONE]') return
    out.split(/\s*data:\s*/).forEach((seg) => {
      const s = seg.trim()
      if (s && onMessage) onMessage(s)
    })
  }
  function read() {
    reader
      .read()
      .then(({ done, value }) => {
        if (done) {
          if (buffer.trim()) {
            const line = buffer.trim()
            if (line.startsWith('data: ')) {
              flushPending()
              pending = stripDataPrefix(line.substring(6))
            } else pending += line
          }
          flushPending()
          if (onComplete) onComplete()
          return
        }
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          const t = line.trim()
          if (t.startsWith('data: ')) {
            flushPending()
            pending = stripDataPrefix(t.substring(6))
          } else if (t === '') {
            flushPending()
          } else {
            pending = pending ? pending + '\n' + line : line
          }
        }
        read()
      })
      .catch((err) => {
        if (err.name !== 'AbortError' && onError) onError(err)
      })
  }
  read()
}

function ssePost(url, data, onMessage, onError, onComplete) {
  const token = local.get('token')
  const controller = new AbortController()
  fetch(`${API_BASE}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
    signal: controller.signal,
  })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      readSSEStream(reader, decoder, onMessage, onError, onComplete)
    })
    .catch((err) => {
      if (err.name !== 'AbortError' && onError) onError(err)
    })
  return () => controller.abort()
}

/**
 * 知识点学习 - 非流式（返回结构化 JSON）
 * @param {Object} data { courseId, courseName, topic, detail }
 * @returns {Promise} { code, data: { topic, definition, principle, examples, misconceptions, practices } }
 */
export function explainKnowledge(data) {
  return request({
    url: '/ai/knowledge',
    method: 'post',
    data,
    timeout: 120000,
  })
}

/**
 * 知识点学习 - 流式（保留备用）
 * @param {Object} data { courseId, courseName, topic, detail }
 */
export function knowledgeStream(data, onMessage, onError, onComplete) {
  return ssePost('/ai/knowledge/stream', data, onMessage, onError, onComplete)
}

/**
 * AI 智能出题 - 非流式（返回结构化 JSON）
 * @param {Object} data { courseId, courseName, topic, questionType, count, difficulty }
 * @returns {Promise} { code, data: [ { questionNo, questionContent, options, answer, explanation } ] }
 */
export function generateQuestion(data) {
  return request({
    url: '/ai/generate-question',
    method: 'post',
    data,
    timeout: 120000, // AI 生成完整 JSON 需要较长时间，单独设置 120 秒超时
  })
}

/**
 * AI 智能出题 - 流式（保留备用）
 * @param {Object} data { courseId, courseName, topic, questionType, count, difficulty }
 */
export function generateQuestionStream(data, onMessage, onError, onComplete) {
  return ssePost('/ai/generate-question/stream', data, onMessage, onError, onComplete)
}

/**
 * 学习路径推荐 - 非流式（返回结构化 JSON）
 * @param {Object} data { courseId, courseName, topic }
 * @returns {Promise} { code, data: { topic, steps: [{stepNo,name,reason,keyPoints,estimatedHours}], tips } }
 */
export function recommendLearningPath(data) {
  return request({
    url: '/ai/learning-path',
    method: 'post',
    data,
    timeout: 120000,
  })
}

/**
 * 学习路径推荐 - 流式（保留备用）
 * @param {Object} data { courseId, courseName, topic }
 */
export function learningPathStream(data, onMessage, onError, onComplete) {
  return ssePost('/ai/learning-path/stream', data, onMessage, onError, onComplete)
}
