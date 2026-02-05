<template>
  <div class="programming-practice neon-module">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <span class="title">编程练习</span>
          <div class="toolbar">
            <el-select
              v-model="language"
              size="default"
              class="lang-select"
              @change="onLanguageChange"
            >
              <el-option label="Java" value="java" />
              <el-option label="Python" value="python" />
              <el-option label="C" value="c" />
            </el-select>
            <el-button type="primary" :loading="runLoading" @click="handleRun">
              <el-icon><VideoPlay /></el-icon>
              运行
            </el-button>
          </div>
        </div>
      </template>
      <div ref="editorContainer" class="editor-container" />
    </el-card>

    <el-card class="result-card">
      <template #header>
        <span class="result-label">运行结果</span>
      </template>
      <div class="run-result">
        <pre v-if="runResult" :class="{ error: !runResult.success }">{{ runResultDisplay }}</pre>
        <span v-else class="placeholder">运行代码后在此显示编译/执行结果</span>
      </div>
    </el-card>

    <el-card class="ai-card">
      <template #header>
        <div class="ai-header">
          <span class="result-label">AI 评分</span>
          <el-button type="primary" size="small" :loading="scoreLoading" @click="handleScore"
            >多维度评分</el-button
          >
        </div>
      </template>
      <div v-if="scoreRadarData" ref="scoreChartRef" class="score-radar-chart"></div>
      <div class="ai-content">
        <div v-if="scoreContent" :key="'score-'+scoreContent.length" class="ai-md-wrap markdown-body" v-html="scoreRendered"></div>
        <span v-else-if="scoreLoading" class="placeholder">正在接收 AI 评分...</span>
        <span v-else class="placeholder"
          >点击「多维度评分」获取功能、健壮性、工程能力等维度点评</span
        >
      </div>
    </el-card>

    <el-card class="ai-card">
      <template #header>
        <div class="ai-header">
          <span class="result-label">AI 优化建议</span>
          <el-input
            v-model="optimizeDirection"
            placeholder="输入优化方向，如：提高可读性、减少内存占用"
            size="small"
            class="direction-input"
            clearable
          />
          <el-button type="primary" size="small" :loading="optimizeLoading" @click="handleOptimize"
            >生成建议</el-button
          >
        </div>
      </template>
      <div class="ai-content">
        <div v-if="optimizeContent" :key="'opt-'+optimizeContent.length" class="ai-md-wrap markdown-body" v-html="optimizeRendered"></div>
        <span v-else-if="optimizeLoading" class="placeholder">正在接收优化建议...</span>
        <span v-else class="placeholder">输入优化方向后点击「生成建议」</span>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { VideoPlay } from '@element-plus/icons-vue'
import { marked } from 'marked'
import * as echarts from 'echarts'
import { runCode, codeScoreStream, codeOptimizeStream } from '@/api/programming'

const RADAR_INDICATORS = [
  { name: '功能正确性', max: 10 },
  { name: '健壮性', max: 10 },
  { name: '工程能力', max: 10 },
  { name: '性能与资源', max: 10 },
  { name: '规范与风格', max: 10 },
]

function parseScoreFromContent(text) {
  if (!text || typeof text !== 'string') return null
  const values = []
  for (const ind of RADAR_INDICATORS) {
    const re = new RegExp(ind.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[^0-9]*?(\\d+)\\s*/\\s*10', 'i')
    const m = text.match(re)
    values.push(m ? Math.min(10, Math.max(0, parseInt(m[1], 10))) : 0)
  }
  if (values.every((v) => v === 0)) return null
  return values
}

marked.setOptions({ breaks: true, gfm: true })

function markdownToHtml(md) {
  if (!md || typeof md !== 'string') return ''
  let s = md
  const backtickCount = (s.match(/```/g) || []).length
  if (backtickCount % 2 !== 0) {
    const lastOpen = s.lastIndexOf('```')
    const afterOpen = s.slice(lastOpen + 3)
    const sectionMatch = afterOpen.match(/\n\n(#+\s|\d+\.\s|\*\*[^*\s])/)
    if (sectionMatch) {
      const insertAt = lastOpen + 3 + sectionMatch.index
      s = s.slice(0, insertAt) + '\n```' + s.slice(insertAt)
    } else {
      s += '\n```'
    }
  }
  try {
    const html = marked.parse(s)
    return typeof html === 'string' ? html : ''
  } catch {
    return '<pre class="markdown-body">' + escapeHtml(s) + '</pre>'
  }
}

function escapeHtml(str) {
  const div = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
  return str.replace(/[&<>"']/g, (c) => div[c] || c)
}

function fixCodeBlockSpaces(code) {
  return code
    .replace(/publicclass/g, 'public class')
    .replace(/publicstatic/g, 'public static')
    .replace(/staticvoid/g, 'static void')
    .replace(/voidmain/g, 'void main')
    .replace(/class\{/g, 'class {')
    .replace(/main\(/g, 'main (')
    .replace(/String\[\]args/g, 'String[] args')
    .replace(/\)\?/g, ') ?')
    .replace(/\?args/g, '? args')
    .replace(/\}\s*\}/g, '} }')
    .replace(/;\s*\}/g, '; }')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([\)\]\}])([a-zA-Z\(\[\{])/g, '$1 $2')
    .replace(/([a-zA-Z0-9"\)])([\[\(\{\;])/g, '$1 $2')
    .replace(/([^=\s])=([^=\s])/g, '$1 = $2')
    .replace(/([^\s>])>([^\s=])/g, '$1 > $2')
    .replace(/([^\s<])<([^\s=])/g, '$1 < $2')
}

function fixCodeBlockJoinBrokenLines(code) {
  return code.replace(/([a-zA-Z0-9"\)])\n([a-zA-Z0-9");])/g, '$1$2')
}

function fixCodeBlockIndent(code) {
  const lines = code.split('\n').map((l) => l.trimEnd())
  let level = 0
  const out = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    if (!trimmed) { out.push(''); continue }
    const nClose = (trimmed.match(/\}/g) || []).length
    const nOpen = (trimmed.match(/\{/g) || []).length
    if (nClose > 0) level = Math.max(0, level - nClose)
    out.push('    '.repeat(level) + trimmed)
    level += nOpen
  }
  return out.join('\n')
}

function fixCodeBlockNewlines(code) {
  if (/\n.{10,}/.test(code)) return code
  return code
    .replace(/([;}])\s*(\/\*\*)/g, '$1\n\n$2')
    .replace(/(\/\*\*)([^\s*\n])/g, '$1\n* $2')
    .replace(/(\/\/[^\n]*)([a-zA-Z])/g, '$1\n$2')
    .replace(/(\*\/)\s*([a-zA-Z])/g, '$1\n$2')
    .replace(/\*([^*/\n])/g, '\n*$1')
    .replace(/\*\/\s*/g, '*/\n')
    .replace(/\}\s*/g, '}\n')
    .replace(/\{\s*/g, '{\n')
    .replace(/;\s+/g, ';\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function normalizeMarkdown(text) {
  if (!text || typeof text !== 'string') return ''
  let s = text.replace(/(\*\*)?(示例|例如|示例代码)(\*\*)?[：:]\s*\n?\s*(?<!`)(java|python|c)(?!`)\s*(?=[\w#\s])/gi, (_, open, label, close, lang) => {
    const prefix = (open || '') + (label || '') + (close || '') + '：'
    return prefix + '\n\n```' + (lang || 'java') + '\n'
  })
  s = s.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const c = fixCodeBlockSpaces(code)
    const c2 = fixCodeBlockJoinBrokenLines(c)
    const c3 = fixCodeBlockNewlines(c2)
    const c4 = (lang === 'java' || !lang) ? fixCodeBlockIndent(c3) : c3
    return '```' + (lang || '') + '\n' + c4 + '\n```'
  })
  s = s
    .replace(/—/g, '\n\n')
    .replace(/([^\n])(```)/g, '$1\n\n$2')
    .replace(/([^\n])(####)/g, '$1\n\n$2')
    .replace(/([^\n])(###)/g, '$1\n\n$2')
    .replace(/([^\n])(##)/g, '$1\n\n$2')
    .replace(/([^\n])(#)([^\s#\n])/g, '$1\n\n$2 $3')
    .replace(/([^\n])(-\s*\*\*)/g, '$1\n\n$2')
    .replace(/([^\n])(\d+\.\s*\*\*)/g, '$1\n\n$2')
  s = s.replace(/\n---\s*$/gm, '\n').replace(/^\s*---\s*$/gm, '')
  s = s.replace(/\n{3,}/g, '\n\n').trim()
  s = s.replace(/(#{1,4})([^\s#\n])/g, '$1 $2')
  s = s.replace(/(\n)\s*-\s*([^\s\-])/g, '$1- $2')
  s = s.replace(/([^\n#])#+#\s*$/gm, '$1')
  s = s.replace(/^\s*#+#\s*$/gm, '')
  s = s.replace(/^\s*(-{2,}|\*{2,}|_{2,})\s*$/gm, '')
  s = s.replace(/\n{3,}/g, '\n\n').trim()
  return s
}

const LANGUAGE_OPTIONS = {
  java: 'java',
  python: 'python',
  c: 'c',
}
const DEFAULT_CODE = {
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World");\n    }\n}',
  python: 'print("Hello, World")',
  c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World\\n");\n    return 0;\n}',
}

const language = ref('java')
const editorContainer = ref(null)
let editor = null
let monacoInstance = null

const runLoading = ref(false)
const runResult = ref(null)
const scoreLoading = ref(false)
const scoreContent = ref('')
const optimizeDirection = ref('')
const optimizeLoading = ref(false)
const optimizeContent = ref('')
let scoreCancel = null
let optimizeCancel = null

const scoreMarkdown = computed(() => normalizeMarkdown(scoreContent.value))
const optimizeMarkdown = computed(() => normalizeMarkdown(optimizeContent.value))
const displayScoreHtml = ref('')
const displayOptimizeHtml = ref('')
let scoreDebounceTimer = null
let optimizeDebounceTimer = null

function flushScoreDisplay() {
  scoreDebounceTimer && clearTimeout(scoreDebounceTimer)
  displayScoreHtml.value = markdownToHtml(scoreMarkdown.value)
}
function flushOptimizeDisplay() {
  optimizeDebounceTimer && clearTimeout(optimizeDebounceTimer)
  displayOptimizeHtml.value = markdownToHtml(optimizeMarkdown.value)
}

watch(scoreContent, (val) => {
  if (!val) { displayScoreHtml.value = ''; return }
  scoreDebounceTimer && clearTimeout(scoreDebounceTimer)
  if (!displayScoreHtml.value) flushScoreDisplay()
  else scoreDebounceTimer = setTimeout(flushScoreDisplay, 150)
})
watch(scoreLoading, (v) => { if (!v) flushScoreDisplay() })

watch(optimizeContent, (val) => {
  if (!val) { displayOptimizeHtml.value = ''; return }
  optimizeDebounceTimer && clearTimeout(optimizeDebounceTimer)
  if (!displayOptimizeHtml.value) flushOptimizeDisplay()
  else optimizeDebounceTimer = setTimeout(flushOptimizeDisplay, 150)
})
watch(optimizeLoading, (v) => { if (!v) flushOptimizeDisplay() })

const scoreRendered = computed(() => displayScoreHtml.value)
const optimizeRendered = computed(() => displayOptimizeHtml.value)

const scoreChartRef = ref(null)
let scoreChartInstance = null
const scoreRadarData = computed(() => parseScoreFromContent(scoreContent.value))

function initScoreRadarChart() {
  if (!scoreChartRef.value || !scoreRadarData.value) return
  if (scoreChartInstance) scoreChartInstance.dispose()
  scoreChartInstance = echarts.init(scoreChartRef.value, null, { renderer: 'canvas' })
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      show: true,
      backgroundColor: 'rgba(8,20,40,0.95)',
      borderColor: 'rgba(0,229,255,0.4)',
      textStyle: { color: '#fff', fontSize: 12 },
    },
    legend: {
      show: true,
      right: '8%',
      top: 'center',
      textStyle: { color: '#fff', fontSize: 12 },
      itemGap: 8,
    },
    radar: {
      center: ['50%', '50%'],
      radius: '78%',
      startAngle: 90,
      splitNumber: 4,
      shape: 'polygon',
      axisName: {
        color: '#9fe8ff',
        fontSize: 12,
        fontWeight: 500,
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(0,229,255,0.02)', 'rgba(0,229,255,0.05)'],
        },
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(0,229,255,0.35)',
          type: 'dashed',
          width: 1,
        },
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(0,229,255,0.4)',
          type: 'dashed',
          width: 1,
        },
      },
      indicator: RADAR_INDICATORS,
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: scoreRadarData.value,
            name: '得分',
            areaStyle: {
              color: {
                type: 'radial',
                x: 0.5,
                y: 0.5,
                r: 0.8,
                colorStops: [
                  { offset: 0, color: 'rgba(0,229,255,0.45)' },
                  { offset: 0.6, color: 'rgba(0,229,255,0.2)' },
                  { offset: 1, color: 'rgba(0,229,255,0.02)' },
                ],
              },
            },
            lineStyle: {
              color: '#00e5ff',
              width: 2.5,
              shadowBlur: 14,
              shadowColor: 'rgba(0,229,255,0.85)',
              shadowOffsetY: 0,
            },
            itemStyle: {
              color: '#00e5ff',
              borderColor: '#7dffcf',
              borderWidth: 1,
              shadowBlur: 12,
              shadowColor: 'rgba(0,229,255,0.9)',
            },
            label: { show: true, color: '#7dffcf', fontSize: 11 },
          },
        ],
      },
    ],
  }
  scoreChartInstance.setOption(option)
}

watch(
  () => [scoreRadarData.value, scoreChartRef.value],
  () => {
    if (!scoreRadarData.value && scoreChartInstance) {
      scoreChartInstance.dispose()
      scoreChartInstance = null
      return
    }
    nextTick(() => initScoreRadarChart())
  },
  { flush: 'post' },
)

function onScoreChartResize() {
  scoreChartInstance?.resize()
}

function stripRunResultLines(text) {
  if (!text || typeof text !== 'string') return ''
  const lines = text.split('\n')
  let start = 0
  let end = lines.length
  while (start < end && /^\s*-\s*$/.test(lines[start])) start++
  while (end > start && /^\s*-\s*$/.test(lines[end - 1])) end--
  return lines.slice(start, end).join('\n')
}
const runResultDisplay = computed(() => {
  if (!runResult.value) return ''
  const full =
    runResult.value.stdout + (runResult.value.stderr ? '\n' + runResult.value.stderr : '')
  return stripRunResultLines(full)
})

function onLanguageChange() {
  if (!editor || !monacoInstance) return
  const model = editor.getModel()
  if (model)
    monacoInstance.editor.setModelLanguage(
      model,
      LANGUAGE_OPTIONS[language.value] || language.value,
    )
  editor.setValue(DEFAULT_CODE[language.value] || '')
}

function getCode() {
  return editor ? editor.getValue() : ''
}

async function handleRun() {
  const code = getCode()
  if (!code.trim()) {
    ElMessage.warning('请先输入代码')
    return
  }
  runLoading.value = true
  runResult.value = null
  try {
    const res = await runCode({ language: language.value, code })
    if (res.code === 200 && res.data) {
      runResult.value = res.data
    } else {
      runResult.value = {
        success: false,
        stdout: '',
        stderr: res.message || '运行失败',
        exitCode: -1,
      }
    }
  } catch (e) {
    runResult.value = { success: false, stdout: '', stderr: e.message || '请求失败', exitCode: -1 }
  } finally {
    runLoading.value = false
  }
}

function handleScore() {
  const code = getCode()
  if (!code.trim()) {
    ElMessage.warning('请先输入代码')
    return
  }
  if (scoreCancel) scoreCancel()
  scoreContent.value = ''
  scoreLoading.value = true
  scoreCancel = codeScoreStream(
    { language: language.value, code },
    (chunk) => {
      scoreContent.value += chunk
      nextTick(() => {})
    },
    () => {
      scoreLoading.value = false
    },
    () => {
      scoreLoading.value = false
      scoreCancel = null
    },
  )
}

function handleOptimize() {
  const code = getCode()
  const dir = (optimizeDirection.value || '').trim()
  if (!code.trim()) {
    ElMessage.warning('请先输入代码')
    return
  }
  if (!dir) {
    ElMessage.warning('请输入优化方向')
    return
  }
  if (optimizeCancel) optimizeCancel()
  optimizeContent.value = ''
  optimizeLoading.value = true
  optimizeCancel = codeOptimizeStream(
    { language: language.value, code, direction: dir },
    (chunk) => {
      optimizeContent.value += chunk
      nextTick(() => {})
    },
    () => {
      optimizeLoading.value = false
    },
    () => {
      optimizeLoading.value = false
      optimizeCancel = null
    },
  )
}

const EDITOR_MIN_HEIGHT = 120
const EDITOR_MAX_HEIGHT = 560

function updateEditorHeight() {
  if (!editor || !editorContainer.value) return
  requestAnimationFrame(() => {
    const h = editor.getContentHeight()
    const clamped = Math.min(EDITOR_MAX_HEIGHT, Math.max(EDITOR_MIN_HEIGHT, h + 20))
    editorContainer.value.style.height = clamped + 'px'
    editor.layout()
  })
}

onMounted(async () => {
  window.addEventListener('resize', onScoreChartResize)
  try {
    monacoInstance = await import('monaco-editor')
    editor = monacoInstance.editor.create(editorContainer.value, {
      value: DEFAULT_CODE[language.value],
      language: 'java',
      theme: 'vs-dark',
      automaticLayout: true,
      fontSize: 14,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
    })
    editor.getModel()?.onDidChangeContent(() => updateEditorHeight())
    updateEditorHeight()
  } catch (e) {
    console.error('Monaco load error:', e)
    ElMessage.error('编辑器加载失败')
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onScoreChartResize)
  if (scoreCancel) scoreCancel()
  if (optimizeCancel) optimizeCancel()
  if (editor) editor.dispose()
  if (scoreChartInstance) {
    scoreChartInstance.dispose()
    scoreChartInstance = null
  }
})
</script>

<style scoped>
.programming-practice {
  padding: 20px;
  min-height: 100%;
}

.main-card,
.result-card,
.ai-card {
  background: rgba(12, 24, 48, 0.75);
  border: 1px solid rgba(0, 229, 255, 0.2);
  margin-bottom: 20px;
}

.main-card :deep(.el-card__header),
.result-card :deep(.el-card__header),
.ai-card :deep(.el-card__header) {
  background: rgba(18, 36, 72, 0.85);
  border-bottom: 1px solid rgba(0, 229, 255, 0.2);
  color: #9fe8ff;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header .title {
  font-size: 16px;
  font-weight: 600;
  color: #00e5ff;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.lang-select {
  width: 120px;
}

.editor-container {
  min-height: 120px;
  width: 100%;
}

.run-result {
  min-height: 80px;
  max-height: 240px;
  overflow: auto;
  padding: 12px;
  background: rgba(8, 20, 40, 0.9);
  border: 1px solid rgba(0, 229, 255, 0.15);
  border-radius: 6px;
}

.score-radar-chart {
  height: 360px;
  width: 100%;
  margin-bottom: 12px;
}

.ai-content {
  min-height: 80px;
  padding: 12px;
  background: rgba(8, 20, 40, 0.9);
  border: 1px solid rgba(0, 229, 255, 0.15);
  border-radius: 6px;
}

.ai-md-wrap {
  isolation: isolate;
  color: #e0f0ff;
  font-size: 12px;
  line-height: 1.6;
}

.ai-md-wrap :deep(.v-md-preview-wrapper),
.ai-md-wrap :deep(.v-md-preview) {
  background: transparent !important;
}

.ai-md-wrap :deep(.v-md-preview-wrapper),
.ai-md-wrap :deep(.v-md-preview),
.ai-md-wrap :deep(div[class*="v-md"]),
.ai-md-wrap :deep(blockquote),
.ai-md-wrap :deep(p),
.ai-md-wrap :deep(li),
.ai-md-wrap :deep(div) {
  background: transparent !important;
  background-color: transparent !important;
}

.ai-md-wrap :deep(.v-md-preview-wrapper) {
  color: inherit;
  font-size: inherit;
  line-height: inherit;
}

.ai-md-wrap :deep(hr),
.ai-md-wrap :deep(.v-md-preview-wrapper hr) {
  display: none !important;
}

.ai-md-wrap :deep(.v-md-preview-wrapper h1),
.ai-md-wrap :deep(.v-md-preview-wrapper h2),
.ai-md-wrap :deep(.v-md-preview-wrapper h3),
.ai-md-wrap :deep(.v-md-preview-wrapper h4),
.ai-md-wrap :deep(.v-md-preview-wrapper p),
.ai-md-wrap :deep(.v-md-preview h1),
.ai-md-wrap :deep(.v-md-preview h2),
.ai-md-wrap :deep(.v-md-preview h3),
.ai-md-wrap :deep(.v-md-preview h4),
.ai-md-wrap :deep(.v-md-preview p) {
  border: none !important;
  border-bottom: none !important;
}

.ai-md-wrap :deep(.v-md-preview-wrapper h1),
.ai-md-wrap :deep(.v-md-preview-wrapper h2),
.ai-md-wrap :deep(.v-md-preview-wrapper h3) {
  color: #00e5ff;
  margin: 12px 0 8px;
}

.ai-md-wrap.markdown-body,
.ai-md-wrap.markdown-body * {
  color: #e0f0ff;
}

.ai-md-wrap.markdown-body pre,
.ai-md-wrap.markdown-body pre *,
.ai-md-wrap.markdown-body code,
.ai-md-wrap.markdown-body code * {
  color: #7dffcf !important;
}

.ai-md-wrap.markdown-body strong {
  color: #e0f0ff;
}

.ai-md-wrap.markdown-body h1,
.ai-md-wrap.markdown-body h2,
.ai-md-wrap.markdown-body h3,
.ai-md-wrap.markdown-body h4 {
  color: #00e5ff;
  margin: 8px 0 4px;
  border: none;
  font-size: 13px;
  font-weight: 600;
}

.ai-md-wrap.markdown-body h1 { font-size: 14px; }
.ai-md-wrap.markdown-body p,
.ai-md-wrap.markdown-body li {
  font-size: 12px;
  margin: 4px 0;
}

.ai-md-wrap.markdown-body pre,
.ai-md-wrap.markdown-body code {
  background: rgba(0, 229, 255, 0.1);
  color: #7dffcf;
  border-radius: 4px;
}

.ai-md-wrap.markdown-body pre,
.ai-md-wrap.markdown-body code {
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace;
  white-space: pre-wrap;
  word-break: break-word;
}

.ai-md-wrap.markdown-body pre {
  padding: 10px;
  overflow-x: auto;
}

.ai-md-wrap.markdown-body hr {
  display: none;
}

.ai-md-wrap :deep(pre),
.ai-md-wrap :deep(code),
.ai-md-wrap :deep(.hljs),
.ai-md-wrap :deep([class*="hljs"]) {
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace !important;
  white-space: pre-wrap !important;
  word-break: break-word;
  background: rgba(0, 229, 255, 0.1) !important;
  background-color: rgba(0, 229, 255, 0.1) !important;
  color: #7dffcf !important;
  border-radius: 4px;
}

.ai-md-wrap :deep(pre) {
  padding: 10px;
  overflow-x: auto;
}

.ai-md-wrap :deep(.v-md-preview-wrapper ul) {
  padding-left: 20px;
}

.run-result pre {
  margin: 0;
  font-size: 13px;
  color: #e7f6ff;
  white-space: pre-wrap;
  word-break: break-all;
}

.run-result pre.error {
  color: #f56c6c;
}

.placeholder {
  color: rgba(159, 232, 255, 0.5);
  font-size: 13px;
}

.result-label {
  color: #9fe8ff;
  font-weight: 500;
}

.ai-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.direction-input {
  flex: 1;
  max-width: 320px;
}



</style>
