<template>
  <div class="programming-practice neon-module">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <span class="title">编程练习</span>
          <div class="toolbar">
            <el-select v-model="language" size="default" class="lang-select" @change="onLanguageChange">
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
          <el-button type="primary" size="small" :loading="scoreLoading" @click="handleScore">多维度评分</el-button>
        </div>
      </template>
      <div class="ai-content">
        <div v-if="scoreContent" class="markdown-body" v-html="scoreRendered"></div>
        <span v-else-if="scoreLoading" class="placeholder">正在接收 AI 评分...</span>
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
          <el-button type="primary" size="small" :loading="optimizeLoading" @click="handleOptimize">生成建议</el-button>
        </div>
      </template>
      <div class="ai-content">
        <div v-if="optimizeContent" class="markdown-body" v-html="optimizeRendered"></div>
        <span v-else-if="optimizeLoading" class="placeholder">正在接收优化建议...</span>
        <span v-else class="placeholder">输入优化方向后点击「生成建议」</span>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { VideoPlay } from '@element-plus/icons-vue'
import { marked } from 'marked'
import { runCode, codeScoreStream, codeOptimizeStream } from '@/api/programming'

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

const scoreRendered = computed(() => (scoreContent.value ? marked(scoreContent.value, { breaks: true }) : ''))
const optimizeRendered = computed(() => (optimizeContent.value ? marked(optimizeContent.value, { breaks: true }) : ''))

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
  const full = runResult.value.stdout + (runResult.value.stderr ? '\n' + runResult.value.stderr : '')
  return stripRunResultLines(full)
})

function onLanguageChange() {
  if (!editor || !monacoInstance) return
  const model = editor.getModel()
  if (model) monacoInstance.editor.setModelLanguage(model, LANGUAGE_OPTIONS[language.value] || language.value)
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
      runResult.value = { success: false, stdout: '', stderr: res.message || '运行失败', exitCode: -1 }
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
    () => { scoreLoading.value = false },
    () => { scoreLoading.value = false; scoreCancel = null }
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
    () => { optimizeLoading.value = false },
    () => { optimizeLoading.value = false; optimizeCancel = null }
  )
}

onMounted(async () => {
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
  } catch (e) {
    console.error('Monaco load error:', e)
    ElMessage.error('编辑器加载失败')
  }
})

onBeforeUnmount(() => {
  if (scoreCancel) scoreCancel()
  if (optimizeCancel) optimizeCancel()
  if (editor) editor.dispose()
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
  height: 360px;
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

.ai-content {
  min-height: 80px;
  max-height: 240px;
  overflow: auto;
  padding: 12px;
  background: rgba(8, 20, 40, 0.9);
  border: 1px solid rgba(0, 229, 255, 0.15);
  border-radius: 6px;
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

.markdown-body {
  color: #e0f0ff;
  font-size: 14px;
  line-height: 1.7;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3) {
  color: #00e5ff;
  margin: 12px 0 8px;
}

.markdown-body :deep(pre),
.markdown-body :deep(code) {
  background: rgba(0, 229, 255, 0.1);
  color: #7dffcf;
  border-radius: 4px;
}

.markdown-body :deep(pre) {
  padding: 10px;
  overflow-x: auto;
}

.markdown-body :deep(ul) {
  padding-left: 20px;
}
</style>
