import request from '@/utils/request'
import { local } from '@/utils/storage'

const API_BASE = import.meta.env.VITE_APP_BASE_API || '/api'

export function runCode(data) {
  return request({
    url: '/coding/run',
    method: 'post',
    data,
    timeout: 60000,
  })
}

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
      if (s) onMessage && onMessage(s)
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
          onComplete && onComplete()
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
        if (err.name !== 'AbortError') onError && onError(err)
      })
  }
  read()
}

/**
 * 代码多维度评分 - 非流式（返回结构化 JSON）
 * @param {Object} data { language, code }
 * @returns {Promise} { code, data: { dimensions: [{name,score,comment}], overallSuggestion } }
 */
export function codeScore(data) {
  return request({
    url: '/coding/score',
    method: 'post',
    data,
    timeout: 120000,
  })
}

/**
 * 代码多维度评分 - 流式（保留备用）
 */
export function codeScoreStream(data, onMessage, onError, onComplete) {
  const token = local.get('token')
  const controller = new AbortController()
  fetch(`${API_BASE}/coding/score/stream`, {
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
      if (err.name !== 'AbortError') onError && onError(err)
    })
  return () => controller.abort()
}

/**
 * 代码优化建议 - 非流式（返回结构化 JSON）
 * @param {Object} data { language, code, direction }
 * @returns {Promise} { code, data: { summary, highlights, suggestions, optimizedCode } }
 */
export function codeOptimize(data) {
  return request({
    url: '/coding/optimize',
    method: 'post',
    data,
    timeout: 120000,
  })
}

/**
 * 代码优化建议 - 流式（保留备用）
 */
export function codeOptimizeStream(data, onMessage, onError, onComplete) {
  const token = local.get('token')
  const controller = new AbortController()
  fetch(`${API_BASE}/coding/optimize/stream`, {
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
      if (err.name !== 'AbortError') onError && onError(err)
    })
  return () => controller.abort()
}
