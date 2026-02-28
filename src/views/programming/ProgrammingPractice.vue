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
        <!-- 加载中 -->
        <div v-if="scoreLoading" class="score-loading-wrap">
          <el-icon class="is-loading" :size="24" color="#00e5ff"><VideoPlay /></el-icon>
          <span class="score-loading-text">AI 正在评分，请稍候…</span>
        </div>
        <!-- 结构化评分卡片 -->
        <div v-else-if="scoreData" class="score-result">
          <div class="score-dimensions">
            <div
              v-for="(dim, idx) in scoreData.dimensions"
              :key="idx"
              class="score-dim-card"
            >
              <div class="dim-header">
                <span class="dim-name">{{ dim.name }}</span>
                <span class="dim-score" :class="dimScoreClass(dim.score)">{{ dim.score }}<small>/10</small></span>
              </div>
              <div class="dim-comment">{{ dim.comment }}</div>
            </div>
          </div>
          <div v-if="scoreData.overallSuggestion" class="score-suggestion">
            <div class="suggestion-header">综合建议</div>
            <div class="suggestion-body">{{ scoreData.overallSuggestion }}</div>
          </div>
        </div>
        <!-- 空态 -->
        <span v-else class="placeholder">点击「多维度评分」获取功能、健壮性、工程能力等维度点评</span>
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
        <!-- 结构化 JSON 卡片 -->
        <template v-if="optimizeData">
          <!-- 总览 -->
          <div v-if="optimizeData.summary" class="optimize-summary">
            <el-icon style="color: #409eff; margin-right: 6px"><InfoFilled /></el-icon>
            {{ optimizeData.summary }}
          </div>

          <!-- 代码亮点 -->
          <div v-if="optimizeData.highlights && optimizeData.highlights.length" class="optimize-section">
            <div class="optimize-section-title">✅ 代码亮点</div>
            <div class="optimize-highlights">
              <el-tag v-for="(h, i) in optimizeData.highlights" :key="i" type="success" effect="dark" class="highlight-tag">{{ h }}</el-tag>
            </div>
          </div>

          <!-- 优化建议列表 -->
          <div v-if="optimizeData.suggestions && optimizeData.suggestions.length" class="optimize-section">
            <div class="optimize-section-title">💡 优化建议</div>
            <el-card v-for="(s, i) in optimizeData.suggestions" :key="i" shadow="hover" class="suggestion-card">
              <div class="suggestion-title">
                <el-tag size="small" type="warning" effect="dark" round>{{ i + 1 }}</el-tag>
                <span class="suggestion-title-text">{{ s.title }}</span>
              </div>
              <div v-if="s.problem" class="suggestion-row">
                <span class="suggestion-label">问题：</span>
                <span class="suggestion-text">{{ s.problem }}</span>
              </div>
              <div v-if="s.solution" class="suggestion-row">
                <span class="suggestion-label">方案：</span>
                <span class="suggestion-text">{{ s.solution }}</span>
              </div>
              <div v-if="s.codeSnippet" class="suggestion-code">
                <div class="code-label">关键代码</div>
                <pre class="code-block"><code>{{ s.codeSnippet }}</code></pre>
              </div>
            </el-card>
          </div>

          <!-- 优化后完整代码 -->
          <div v-if="optimizeData.optimizedCode" class="optimize-section">
            <div class="optimize-section-title">📝 优化后代码</div>
            <pre class="code-block optimized-code"><code>{{ optimizeData.optimizedCode }}</code></pre>
          </div>
        </template>
        <span v-else-if="optimizeLoading" class="placeholder">正在生成优化建议...</span>
        <span v-else class="placeholder">输入优化方向后点击「生成建议」</span>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { VideoPlay, Download, InfoFilled } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { runCode, codeScore, codeOptimize } from '@/api/programming'

const RADAR_INDICATORS = [
  { name: '功能正确性', max: 10 },
  { name: '健壮性', max: 10 },
  { name: '工程能力', max: 10 },
  { name: '性能与资源', max: 10 },
  { name: '规范与风格', max: 10 },
]

// 评分维度分数样式
function dimScoreClass(score) {
  if (score >= 8) return 'dim-score-high'
  if (score >= 5) return 'dim-score-mid'
  return 'dim-score-low'
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
const scoreData = ref(null)
const optimizeDirection = ref('')
const optimizeLoading = ref(false)
const optimizeData = ref(null)

// 雷达图数据：直接从 JSON 结构化数据提取
const scoreRadarData = computed(() => {
  if (!scoreData.value || !scoreData.value.dimensions) return null
  const values = scoreData.value.dimensions.map((d) => d.score || 0)
  if (values.every((v) => v === 0)) return null
  return values
})

const scoreChartRef = ref(null)
let scoreChartInstance = null

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
  scoreData.value = null
  scoreLoading.value = true

  codeScore({ language: language.value, code })
    .then((res) => {
      if (res.code === 200 && res.data) {
        scoreData.value = res.data
      } else {
        ElMessage.error(res.msg || 'AI 评分失败，请稍后重试')
      }
    })
    .catch((err) => {
      ElMessage.error('代码评分请求失败: ' + (err.message || '网络异常'))
    })
    .finally(() => {
      scoreLoading.value = false
    })
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
  optimizeData.value = null
  optimizeLoading.value = true
  codeOptimize({ language: language.value, code, direction: dir })
    .then((res) => {
      if (res.code === 200 && res.data) {
        optimizeData.value = res.data
      } else {
        ElMessage.error(res.msg || 'AI 优化建议生成失败')
      }
    })
    .catch((err) => {
      console.error('AI 优化建议异常:', err)
      ElMessage.error('AI 优化建议请求失败，请稍后重试')
    })
    .finally(() => {
      optimizeLoading.value = false
    })
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

/* ========== 结构化评分卡片样式 ========== */

.score-loading-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 30px 0;
}

.score-loading-text {
  color: #9fe8ff;
  font-size: 14px;
}

.score-result {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.score-dimensions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.score-dim-card {
  background: rgba(0, 229, 255, 0.04);
  border: 1px solid rgba(0, 229, 255, 0.15);
  border-radius: 8px;
  padding: 12px 16px;
  transition: border-color 0.2s;
}

.score-dim-card:hover {
  border-color: rgba(0, 229, 255, 0.4);
}

.dim-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.dim-name {
  font-size: 14px;
  font-weight: 600;
  color: #00e5ff;
}

.dim-score {
  font-size: 20px;
  font-weight: 700;
}

.dim-score small {
  font-size: 12px;
  font-weight: 400;
  opacity: 0.6;
}

.dim-score-high {
  color: #7dffcf;
}

.dim-score-mid {
  color: #ffab40;
}

.dim-score-low {
  color: #ff6b6b;
}

.dim-comment {
  font-size: 13px;
  line-height: 1.7;
  color: #b8e0ff;
}

.score-suggestion {
  background: rgba(0, 229, 255, 0.04);
  border: 1px solid rgba(0, 229, 255, 0.15);
  border-radius: 8px;
  overflow: hidden;
}

.suggestion-header {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #7dffcf;
  background: rgba(125, 255, 207, 0.06);
  border-bottom: 1px solid rgba(125, 255, 207, 0.1);
}

.suggestion-body {
  padding: 12px 16px;
  font-size: 13px;
  line-height: 1.8;
  color: #e0f0ff;
  white-space: pre-wrap;
}

/* === AI 优化建议卡片样式 === */
.optimize-summary {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  margin-bottom: 14px;
  background: rgba(64, 158, 255, 0.08);
  border-left: 3px solid #409eff;
  border-radius: 4px;
  color: #b8e6ff;
  font-size: 13px;
  line-height: 1.6;
}

.optimize-section {
  margin-bottom: 16px;
}

.optimize-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #00e5ff;
  margin-bottom: 10px;
}

.optimize-highlights {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.highlight-tag {
  font-size: 12px;
}

.suggestion-card {
  margin-bottom: 10px;
  background: rgba(0, 229, 255, 0.04) !important;
  border: 1px solid rgba(0, 229, 255, 0.15) !important;
}

.suggestion-card :deep(.el-card__body) {
  padding: 14px !important;
}

.suggestion-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.suggestion-title-text {
  font-size: 14px;
  font-weight: 600;
  color: #e0f0ff;
}

.suggestion-row {
  margin-bottom: 6px;
  font-size: 13px;
  line-height: 1.6;
  color: #cee8ff;
}

.suggestion-label {
  color: #9fe8ff;
  font-weight: 500;
}

.suggestion-text {
  color: #cee8ff;
}

.suggestion-code {
  margin-top: 8px;
}

.code-label {
  font-size: 12px;
  color: #78909c;
  margin-bottom: 4px;
}

.code-block {
  background: rgba(0, 229, 255, 0.08);
  border-radius: 6px;
  padding: 10px 14px;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
  color: #7dffcf;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-x: auto;
  margin: 0;
}

.optimized-code {
  max-height: 400px;
  overflow-y: auto;
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
