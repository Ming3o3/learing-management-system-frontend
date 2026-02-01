<template>
  <div class="ai-analyzer-container" :class="{ 'is-expanded': isExpanded }">
    <!-- AI助手按钮 -->
    <div class="ai-trigger" @click="togglePanel" v-if="!isExpanded">
      <div class="ai-icon-wrapper">
        <el-icon class="ai-icon" :class="{ 'is-loading': isAnalyzing }">
          <MagicStick />
        </el-icon>
        <div class="pulse-ring"></div>
      </div>
      <span class="ai-label">AI解析</span>
    </div>

    <!-- AI解析面板 -->
    <transition name="slide-fade">
      <div class="ai-panel" v-if="isExpanded">
        <!-- 面板头部 -->
        <div class="panel-header">
          <div class="header-left">
            <el-icon class="header-icon"><MagicStick /></el-icon>
            <span class="header-title">DeepSeek AI 智能解析</span>
          </div>
          <div class="header-actions">
            <el-button v-if="!isAnalyzing && content" type="text" size="small" @click="copyContent">
              <el-icon><DocumentCopy /></el-icon>
            </el-button>
            <el-button type="text" size="small" @click="togglePanel">
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </div>

        <!-- 面板内容 -->
        <div class="panel-content" ref="contentRef">
          <!-- 加载状态 -->
          <div v-if="isAnalyzing && !content" class="loading-state">
            <div class="loading-animation">
              <div class="dot"></div>
              <div class="dot"></div>
              <div class="dot"></div>
            </div>
            <p class="loading-text">AI正在分析题目...</p>
          </div>

          <!-- 解析内容 -->
          <div v-if="content" class="ai-content">
            <div class="content-wrapper" v-html="renderedContent"></div>
            <div v-if="isAnalyzing" class="typing-cursor"></div>
          </div>

          <!-- 空状态 -->
          <div v-if="!isAnalyzing && !content" class="empty-state">
            <el-icon class="empty-icon"><QuestionFilled /></el-icon>
            <p>点击下方按钮开始AI解析</p>
          </div>
        </div>

        <!-- 面板底部 -->
        <div class="panel-footer">
          <el-button
            type="primary"
            class="analyze-btn"
            :loading="isAnalyzing"
            :disabled="isAnalyzing"
            @click="startAnalysis"
          >
            <el-icon v-if="!isAnalyzing"><MagicStick /></el-icon>
            {{ isAnalyzing ? '解析中...' : content ? '重新解析' : '开始解析' }}
          </el-button>
          <el-button v-if="isAnalyzing" type="danger" plain @click="stopAnalysis">
            <el-icon><VideoPause /></el-icon>
            停止
          </el-button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  MagicStick,
  Close,
  DocumentCopy,
  QuestionFilled,
  VideoPause,
} from '@element-plus/icons-vue'
import { analyzeQuestionStream } from '@/api/ai'
import { marked } from 'marked'

// Props
const props = defineProps({
  question: {
    type: Object,
    required: true,
  },
})

// 状态
const isExpanded = ref(false)
const isAnalyzing = ref(false)
const content = ref('')
const contentRef = ref(null)
let cancelFn = null

// 渲染Markdown内容
const renderedContent = computed(() => {
  if (!content.value) return ''
  return marked(content.value, { breaks: true })
})

// 切换面板
const togglePanel = () => {
  isExpanded.value = !isExpanded.value
}

// 开始解析
const startAnalysis = () => {
  if (isAnalyzing.value) return

  content.value = ''
  isAnalyzing.value = true

  const requestData = {
    questionContent: props.question.questionContent,
    questionType: props.question.questionType,
    studentAnswer: props.question.studentAnswer,
    correctAnswer: props.question.correctAnswer,
    needAnalysis: true,
  }

  // 处理选项
  if (props.question.questionType <= 2 && props.question.options) {
    try {
      requestData.options =
        typeof props.question.options === 'string'
          ? JSON.parse(props.question.options)
          : props.question.options
    } catch (e) {
      console.warn('解析选项失败:', e)
    }
  }

  cancelFn = analyzeQuestionStream(
    requestData,
    // onMessage
    (chunk) => {
      content.value += chunk
      scrollToBottom()
    },
    // onError
    (error) => {
      console.error('AI解析错误:', error)
      ElMessage.error('AI解析失败，请稍后重试')
      isAnalyzing.value = false
    },
    // onComplete
    () => {
      isAnalyzing.value = false
      cancelFn = null
    },
  )
}

// 停止解析
const stopAnalysis = () => {
  if (cancelFn) {
    cancelFn()
    cancelFn = null
  }
  isAnalyzing.value = false
}

// 复制内容
const copyContent = async () => {
  try {
    await navigator.clipboard.writeText(content.value)
    ElMessage.success('已复制到剪贴板')
  } catch (e) {
    ElMessage.error('复制失败')
  }
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (contentRef.value) {
      contentRef.value.scrollTop = contentRef.value.scrollHeight
    }
  })
}

// 组件卸载时取消请求
onUnmounted(() => {
  if (cancelFn) {
    cancelFn()
  }
})
</script>

<style lang="scss" scoped>
.ai-analyzer-container {
  position: relative;

  &.is-expanded {
    width: 100%;
  }
}

// AI触发按钮
.ai-trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(135deg, rgba(0, 229, 255, 0.1), rgba(138, 43, 226, 0.1));
  border: 1px solid rgba(0, 229, 255, 0.4);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(135deg, rgba(0, 229, 255, 0.2), rgba(138, 43, 226, 0.2));
    border-color: #00e5ff;
    box-shadow: 0 0 20px rgba(0, 229, 255, 0.3);
    transform: translateY(-2px);
  }

  .ai-icon-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ai-icon {
    font-size: 18px;
    color: #00e5ff;

    &.is-loading {
      animation: rotate 2s linear infinite;
    }
  }

  .pulse-ring {
    position: absolute;
    width: 30px;
    height: 30px;
    border: 2px solid rgba(0, 229, 255, 0.5);
    border-radius: 50%;
    animation: pulse 2s ease-out infinite;
  }

  .ai-label {
    font-size: 14px;
    font-weight: 500;
    color: #00e5ff;
    text-shadow: 0 0 10px rgba(0, 229, 255, 0.5);
  }
}

// AI面板
.ai-panel {
  background: rgba(10, 20, 40, 0.95);
  border: 1px solid rgba(0, 229, 255, 0.3);
  border-radius: 12px;
  overflow: hidden;
  box-shadow:
    0 0 30px rgba(0, 229, 255, 0.2),
    inset 0 0 60px rgba(0, 229, 255, 0.05);
  backdrop-filter: blur(10px);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(90deg, rgba(0, 229, 255, 0.15), rgba(138, 43, 226, 0.1));
  border-bottom: 1px solid rgba(0, 229, 255, 0.2);

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;

    .header-icon {
      font-size: 20px;
      color: #00e5ff;
      filter: drop-shadow(0 0 8px rgba(0, 229, 255, 0.6));
    }

    .header-title {
      font-size: 15px;
      font-weight: 600;
      background: linear-gradient(90deg, #00e5ff, #8a2be2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-shadow: 0 0 20px rgba(0, 229, 255, 0.3);
    }
  }

  .header-actions {
    display: flex;
    gap: 8px;

    :deep(.el-button) {
      color: #a0cfff;

      &:hover {
        color: #00e5ff;
      }
    }
  }
}

.panel-content {
  padding: 16px;
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 229, 255, 0.3);
    border-radius: 3px;

    &:hover {
      background: rgba(0, 229, 255, 0.5);
    }
  }
}

// 加载状态
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;

  .loading-animation {
    display: flex;
    gap: 8px;

    .dot {
      width: 12px;
      height: 12px;
      background: linear-gradient(135deg, #00e5ff, #8a2be2);
      border-radius: 50%;
      animation: bounce 1.4s ease-in-out infinite both;

      &:nth-child(1) {
        animation-delay: -0.32s;
      }
      &:nth-child(2) {
        animation-delay: -0.16s;
      }
    }
  }

  .loading-text {
    margin-top: 16px;
    color: #a0cfff;
    font-size: 14px;
  }
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;

  .empty-icon {
    font-size: 48px;
    color: rgba(0, 229, 255, 0.3);
    margin-bottom: 16px;
  }

  p {
    color: #6b8aad;
    font-size: 14px;
  }
}

// AI内容
.ai-content {
  .content-wrapper {
    color: #e0f0ff;
    font-size: 14px;
    line-height: 1.8;

    :deep(h1),
    :deep(h2),
    :deep(h3),
    :deep(h4) {
      color: #00e5ff;
      margin: 16px 0 8px;
      font-weight: 600;
    }

    :deep(p) {
      margin: 8px 0;
    }

    :deep(ul),
    :deep(ol) {
      padding-left: 20px;
      margin: 8px 0;
    }

    :deep(li) {
      margin: 4px 0;
    }

    :deep(code) {
      background: rgba(0, 229, 255, 0.1);
      padding: 2px 6px;
      border-radius: 4px;
      color: #7dffcf;
      font-family: 'Consolas', monospace;
    }

    :deep(pre) {
      background: rgba(0, 0, 0, 0.3);
      padding: 12px;
      border-radius: 8px;
      border: 1px solid rgba(0, 229, 255, 0.2);
      overflow-x: auto;

      code {
        background: transparent;
        padding: 0;
      }
    }

    :deep(blockquote) {
      border-left: 3px solid #00e5ff;
      padding-left: 12px;
      margin: 12px 0;
      color: #a0cfff;
      background: rgba(0, 229, 255, 0.05);
      padding: 8px 12px;
      border-radius: 0 8px 8px 0;
    }

    :deep(strong) {
      color: #00e5ff;
    }
  }

  .typing-cursor {
    display: inline-block;
    width: 2px;
    height: 18px;
    background: #00e5ff;
    margin-left: 2px;
    animation: blink 1s infinite;
  }
}

.panel-footer {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(0, 20, 40, 0.5);
  border-top: 1px solid rgba(0, 229, 255, 0.15);

  .analyze-btn {
    flex: 1;
    background: linear-gradient(135deg, #00e5ff, #8a2be2);
    border: none;
    font-weight: 500;

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #00d4ee, #7b1fa2);
      box-shadow: 0 0 20px rgba(0, 229, 255, 0.4);
    }

    &:disabled {
      opacity: 0.7;
    }
  }
}

// 动画
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}

// 过渡动画
.slide-fade-enter-active {
  transition: all 0.3s ease;
}

.slide-fade-leave-active {
  transition: all 0.2s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
