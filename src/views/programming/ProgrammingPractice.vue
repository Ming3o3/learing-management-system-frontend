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
            <el-button @click="handleExport">
              <el-icon><Download /></el-icon>
              导出
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
        <v-md-preview v-if="scoreContent" :text="scoreText" class="ai-md-wrap" />
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
        <v-md-preview v-if="optimizeContent" :text="optimizeText" class="ai-md-wrap" />
        <span v-else-if="optimizeLoading" class="placeholder">正在接收优化建议...</span>
        <span v-else class="placeholder">输入优化方向后点击「生成建议」</span>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { VideoPlay, Download } from '@element-plus/icons-vue'
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
    const re = new RegExp(
      ind.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[^0-9]*?(\\d+)\\s*/\\s*10',
      'i',
    )
    const m = text.match(re)
    values.push(m ? Math.min(10, Math.max(0, parseInt(m[1], 10))) : 0)
  }
  if (values.every((v) => v === 0)) return null
  return values
}

/* ---------- 轻量代码块格式化 ---------- */

// 修复 Java 关键字粘连（SSE 流有时会把空格吃掉）
function fixKeywordSpaces(code) {
  return code
    .replace(/\bpublic\b(?=class\b)/g, 'public ')
    .replace(/\bpublic\b(?=static\b)/g, 'public ')
    .replace(/\bstatic\b(?=void\b)/g, 'static ')
    .replace(/\bvoid\b(?=main\b)/g, 'void ')
    .replace(/\bprivate\b(?=static\b)/g, 'private ')
    .replace(/\bprivate\b(?=void\b)/g, 'private ')
    .replace(/\breturn\b(?=[a-zA-Z])/g, 'return ')
    .replace(/\bString\[\](?=args)/g, 'String[] ')
    .replace(/\bnew\b(?=[A-Z])/g, 'new ')
    .replace(/\bclass\b(?=[A-Z])/g, 'class ')
    .replace(/\bimport\b(?=[a-z])/g, 'import ')
    .replace(/\bpackage\b(?=[a-z])/g, 'package ')
    .replace(/\bfinal\b(?=[a-zA-Z])/g, 'final ')
    .replace(/\bint\b(?=[a-zA-Z])/g, 'int ')
}

// 如果代码缺少换行（全部挤在一行），在 { } ; 后补换行
function addMissingNewlines(code) {
  // 如果代码已经有多行且平均行长 < 120，说明格式正常，不处理
  const lines = code.split('\n').filter((l) => l.trim())
  if (lines.length > 3) return code
  // 只处理明显挤在一起的情况
  return code
    .replace(/\{(?!\s*\n)/g, '{\n')
    .replace(/\}(?!\s*[\n\}])/g, '}\n')
    .replace(/;(?!\s*[\n\}])/g, ';\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// 基础缩进（按 { } 层级）
function autoIndent(code) {
  const lines = code.split('\n')
  let level = 0
  const out = []
  for (const raw of lines) {
    const trimmed = raw.trim()
    if (!trimmed) {
      out.push('')
      continue
    }
    const closes = (trimmed.match(/\}/g) || []).length
    const opens = (trimmed.match(/\{/g) || []).length
    if (closes > 0) level = Math.max(0, level - closes)
    out.push('    '.repeat(level) + trimmed)
    level += opens
  }
  return out.join('\n')
}

// 处理单个代码块
function formatCodeBlock(code, lang) {
  let c = code
  if (lang === 'java' || lang === '' || !lang) {
    c = fixKeywordSpaces(c)
  }
  c = addMissingNewlines(c)
  c = autoIndent(c)
  return c
}

/* ---------- Markdown 规范化 ---------- */

function normalizeMarkdown(text) {
  if (!text || typeof text !== 'string') return ''
  let s = text

  // 处理代码块内容
  s = s.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const formatted = formatCodeBlock(code.trim(), lang)
    return '```' + (lang || '') + '\n' + formatted + '\n```'
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
  s = s.replace(/^\s*(-{3,}|_{3,})\s*$/gm, '')
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

// AI评分：直接用 v-md-preview 渲染，debounce 控制更新频率
const scoreText = ref('')
let scoreDebounceTimer = null
function flushScoreText() {
  scoreDebounceTimer && clearTimeout(scoreDebounceTimer)
  scoreText.value = normalizeMarkdown(scoreContent.value)
}
watch(scoreContent, (val) => {
  if (!val) {
    scoreText.value = ''
    return
  }
  scoreDebounceTimer && clearTimeout(scoreDebounceTimer)
  if (!scoreText.value) flushScoreText()
  else scoreDebounceTimer = setTimeout(flushScoreText, 150)
})
watch(scoreLoading, (v) => {
  if (!v) flushScoreText()
})

// AI优化建议：使用 v-md-preview 渲染，与评分一致
const optimizeText = ref('')
let optimizeDebounceTimer = null
function flushOptimizeText() {
  optimizeDebounceTimer && clearTimeout(optimizeDebounceTimer)
  optimizeText.value = normalizeMarkdown(optimizeContent.value)
}
watch(optimizeContent, (val) => {
  if (!val) {
    optimizeText.value = ''
    return
  }
  optimizeDebounceTimer && clearTimeout(optimizeDebounceTimer)
  if (!optimizeText.value) flushOptimizeText()
  else optimizeDebounceTimer = setTimeout(flushOptimizeText, 150)
})
watch(optimizeLoading, (v) => {
  if (!v) flushOptimizeText()
})

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

const EXPORT_FILENAME = { java: 'Main.java', python: 'main.py', c: 'main.c' }

function handleExport() {
  const code = getCode()
  const name = EXPORT_FILENAME[language.value] || 'code.txt'
  const blob = new Blob([code], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
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

/* === v-md-preview 深色主题适配（AI评分区域） === */
.ai-md-wrap {
  isolation: isolate;
  color: #e0f0ff;
  font-size: 12px;
  line-height: 1.6;
}

.ai-md-wrap :deep(.v-md-editor-preview),
.ai-md-wrap :deep(.github-markdown-body) {
  background: transparent !important;
  color: #e0f0ff !important;
  font-size: 12px;
  line-height: 1.6;
  padding: 0 !important;
}

.ai-md-wrap :deep(.github-markdown-body h1),
.ai-md-wrap :deep(.github-markdown-body h2),
.ai-md-wrap :deep(.github-markdown-body h3),
.ai-md-wrap :deep(.github-markdown-body h4) {
  color: #00e5ff;
  margin: 12px 0 8px;
  border: none !important;
  font-size: 13px;
  font-weight: 600;
}

.ai-md-wrap :deep(.github-markdown-body h1) {
  font-size: 14px;
}

.ai-md-wrap :deep(.github-markdown-body p),
.ai-md-wrap :deep(.github-markdown-body li) {
  font-size: 12px;
  margin: 4px 0;
  color: #e0f0ff;
}

.ai-md-wrap :deep(.github-markdown-body strong) {
  color: #e0f0ff;
}

.ai-md-wrap :deep(.github-markdown-body ul) {
  padding-left: 20px;
}

.ai-md-wrap :deep(.github-markdown-body hr) {
  display: none !important;
}

/* 代码块 wrapper（v-md-pre-wrapper）覆盖白色背景 */
.ai-md-wrap :deep(.github-markdown-body div[class*='v-md-pre-wrapper']) {
  background-color: rgba(0, 229, 255, 0.1) !important;
  background: rgba(0, 229, 255, 0.1) !important;
  border-radius: 6px;
}

.ai-md-wrap :deep(.github-markdown-body div[class*='v-md-pre-wrapper']:after) {
  background-color: rgba(0, 229, 255, 0.1) !important;
}

.ai-md-wrap :deep(.github-markdown-body pre),
.ai-md-wrap :deep(.github-markdown-body code),
.ai-md-wrap :deep(.github-markdown-body tt) {
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace !important;
  background: rgba(0, 229, 255, 0.1) !important;
  background-color: rgba(0, 229, 255, 0.1) !important;
  color: #7dffcf !important;
  border-radius: 4px;
}

.ai-md-wrap :deep(.github-markdown-body pre) {
  padding: 10px;
  overflow-x: auto;
  white-space: pre-wrap !important;
  word-break: break-word;
}

.ai-md-wrap :deep(.github-markdown-body pre code),
.ai-md-wrap :deep(.github-markdown-body pre tt),
.ai-md-wrap :deep(.github-markdown-body pre code *) {
  background: transparent !important;
  background-color: transparent !important;
  color: #7dffcf !important;
}

.ai-md-wrap :deep(.github-markdown-body .hljs),
.ai-md-wrap :deep(.github-markdown-body [class*='hljs']),
.ai-md-wrap :deep(.github-markdown-body pre .hljs),
.ai-md-wrap :deep(.github-markdown-body pre [class*='hljs']) {
  background: rgba(0, 229, 255, 0.1) !important;
  background-color: rgba(0, 229, 255, 0.1) !important;
  color: #7dffcf !important;
}

/* hljs 语法高亮各 token 颜色 */
.ai-md-wrap :deep(.hljs-keyword),
.ai-md-wrap :deep(.hljs-type),
.ai-md-wrap :deep(.hljs-built_in) {
  color: #00e5ff !important;
}
.ai-md-wrap :deep(.hljs-string),
.ai-md-wrap :deep(.hljs-number),
.ai-md-wrap :deep(.hljs-literal) {
  color: #ffab40 !important;
}
.ai-md-wrap :deep(.hljs-comment),
.ai-md-wrap :deep(.hljs-meta) {
  color: #78909c !important;
}
.ai-md-wrap :deep(.hljs-title),
.ai-md-wrap :deep(.hljs-function) {
  color: #7dffcf !important;
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
