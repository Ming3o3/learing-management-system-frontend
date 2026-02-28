<template>
  <div class="ai-assistant neon-module">
    <!-- 顶部标题栏 -->
    <el-card class="header-card">
      <div class="page-header">
        <div class="header-left">
          <el-icon :size="24" color="#00e5ff"><Cpu /></el-icon>
          <span class="page-title">学习助手</span>
        </div>
        <div class="header-right">
          <span class="course-label">当前课程：</span>
          <el-select
            v-model="selectedCourseId"
            placeholder="请选择课程（可选）"
            clearable
            class="course-select"
            @change="onCourseChange"
          >
            <el-option
              v-for="c in myCourses"
              :key="c.id"
              :label="c.courseName"
              :value="c.id"
            />
          </el-select>
        </div>
      </div>
    </el-card>

    <!-- 主内容区 -->
    <el-card class="main-card">
      <el-tabs v-model="activeTab" class="assistant-tabs">
        <!-- Tab 1: 知识点学习 -->
        <el-tab-pane label="📚 知识点学习" name="knowledge">
          <div class="tab-content">
            <div class="input-area">
              <el-input
                v-model="knowledgeTopic"
                placeholder="请输入想学习的知识点，如：二叉树的前序遍历"
                size="large"
                clearable
                @keyup.enter="handleKnowledge"
              >
                <template #prepend>知识点</template>
              </el-input>
              <el-input
                v-model="knowledgeDetail"
                placeholder="补充说明（可选），如：请结合递归讲解"
                size="large"
                clearable
                class="mt-12"
              />
              <el-button
                type="primary"
                size="large"
                :loading="knowledgeLoading"
                :disabled="!knowledgeTopic.trim()"
                class="mt-12 action-btn"
                @click="handleKnowledge"
              >
                <el-icon><Search /></el-icon>
                开始学习
              </el-button>
            </div>
            <div class="result-area">
              <!-- 加载中 -->
              <div v-if="knowledgeLoading" class="loading-wrap">
                <el-icon class="is-loading" :size="28" color="#00e5ff"><Loading /></el-icon>
                <span class="loading-text">AI 正在生成知识点讲解，请稍候…</span>
              </div>
              <!-- 知识点卡片 -->
              <div v-else-if="knowledgeData" class="knowledge-card">
                <h3 class="k-title">{{ knowledgeData.topic }}</h3>

                <div class="k-section">
                  <div class="k-section-header">
                    <el-icon color="#00e5ff"><InfoFilled /></el-icon>
                    <span>概念定义</span>
                  </div>
                  <div class="k-section-body">{{ knowledgeData.definition }}</div>
                </div>

                <div class="k-section">
                  <div class="k-section-header">
                    <el-icon color="#00e5ff"><Setting /></el-icon>
                    <span>核心原理</span>
                  </div>
                  <div class="k-section-body">{{ knowledgeData.principle }}</div>
                </div>

                <div class="k-section">
                  <div class="k-section-header">
                    <el-icon color="#00e5ff"><Promotion /></el-icon>
                    <span>举例说明</span>
                  </div>
                  <div class="k-section-body">
                    <div v-for="(ex, i) in knowledgeData.examples" :key="i" class="k-list-item">
                      <span class="k-bullet">{{ i + 1 }}.</span> {{ ex }}
                    </div>
                  </div>
                </div>

                <div class="k-section">
                  <div class="k-section-header">
                    <el-icon color="#ff6b6b"><WarningFilled /></el-icon>
                    <span>常见误区</span>
                  </div>
                  <div class="k-section-body">
                    <div v-for="(m, i) in knowledgeData.misconceptions" :key="i" class="k-list-item k-warn">
                      <span class="k-bullet">⚠</span> {{ m }}
                    </div>
                  </div>
                </div>

                <div class="k-section">
                  <div class="k-section-header">
                    <el-icon color="#7dffcf"><Checked /></el-icon>
                    <span>练习建议</span>
                  </div>
                  <div class="k-section-body">
                    <div v-for="(p, i) in knowledgeData.practices" :key="i" class="k-list-item k-good">
                      <span class="k-bullet">✔</span> {{ p }}
                    </div>
                  </div>
                </div>
              </div>
              <!-- 空态 -->
              <span v-else class="placeholder">输入知识点后点击「开始学习」，AI 将为你详细讲解</span>
            </div>
          </div>
        </el-tab-pane>

        <!-- Tab 2: AI 智能出题 -->
        <el-tab-pane label="📝 AI 智能出题" name="question">
          <div class="tab-content">
            <div class="input-area">
              <el-input
                v-model="questionTopic"
                placeholder="请输入出题的知识点，如：链表"
                size="large"
                clearable
              >
                <template #prepend>知识点</template>
              </el-input>
              <div class="option-row mt-12">
                <el-select v-model="questionType" placeholder="题型" class="option-select">
                  <el-option label="单选题" :value="1" />
                  <el-option label="多选题" :value="2" />
                  <el-option label="判断题" :value="3" />
                  <el-option label="填空题" :value="4" />
                  <el-option label="简答题" :value="5" />
                </el-select>
                <el-select v-model="questionDifficulty" placeholder="难度" class="option-select">
                  <el-option label="简单" value="easy" />
                  <el-option label="中等" value="medium" />
                  <el-option label="困难" value="hard" />
                </el-select>
                <el-input-number
                  v-model="questionCount"
                  :min="1"
                  :max="10"
                  controls-position="right"
                  placeholder="数量"
                  class="option-count"
                />
                <span class="count-label">题</span>
              </div>
              <el-button
                type="primary"
                size="large"
                :loading="questionLoading"
                :disabled="!questionTopic.trim()"
                class="mt-12 action-btn"
                @click="handleQuestion"
              >
                <el-icon><EditPen /></el-icon>
                生成题目
              </el-button>
            </div>
            <div class="result-area">
              <!-- 加载中 -->
              <div v-if="questionLoading" class="loading-wrap">
                <el-icon class="is-loading" :size="28" color="#00e5ff"><Loading /></el-icon>
                <span class="loading-text">AI 正在生成题目，请稍候…</span>
              </div>
              <!-- 题目卡片列表 -->
              <div v-else-if="questionList.length" class="question-cards">
                <div
                  v-for="(q, idx) in questionList"
                  :key="idx"
                  class="question-card"
                >
                  <div class="q-header">
                    <span class="q-no">第 {{ q.questionNo || idx + 1 }} 题</span>
                    <el-tag size="small" :type="difficultyTag" class="q-diff">{{ difficultyLabel }}</el-tag>
                  </div>
                  <div class="q-content">{{ q.questionContent }}</div>
                  <!-- 选项 -->
                  <div v-if="q.options && q.options.length" class="q-options">
                    <div
                      v-for="(opt, oi) in q.options"
                      :key="oi"
                      class="q-option"
                    >{{ opt }}</div>
                  </div>
                  <!-- 展开答案 -->
                  <el-collapse class="q-collapse">
                    <el-collapse-item title="查看答案与解析">
                      <div class="q-answer"><strong>答案：</strong>{{ q.answer }}</div>
                      <div class="q-explain"><strong>解析：</strong>{{ q.explanation }}</div>
                    </el-collapse-item>
                  </el-collapse>
                </div>
              </div>
              <!-- 空态提示 -->
              <span v-else class="placeholder">选择题型和难度后点击「生成题目」，AI 将为你出题</span>
            </div>
          </div>
        </el-tab-pane>

        <!-- Tab 3: 学习路径推荐 -->
        <el-tab-pane label="🗺️ 学习路径推荐" name="path">
          <div class="tab-content">
            <div class="input-area">
              <el-input
                v-model="pathTopic"
                placeholder="请输入你不理解的知识点，如：动态规划"
                size="large"
                clearable
                @keyup.enter="handlePath"
              >
                <template #prepend>知识点</template>
              </el-input>
              <el-button
                type="primary"
                size="large"
                :loading="pathLoading"
                :disabled="!pathTopic.trim()"
                class="mt-12 action-btn"
                @click="handlePath"
              >
                <el-icon><Guide /></el-icon>
                生成学习路径
              </el-button>
            </div>
            <div class="result-area">
              <!-- 加载中 -->
              <div v-if="pathLoading" class="loading-wrap">
                <el-icon class="is-loading" :size="28" color="#00e5ff"><Loading /></el-icon>
                <span class="loading-text">AI 正在分析学习路径，请稍候…</span>
              </div>
              <!-- 学习路径卡片 -->
              <div v-else-if="pathData" class="path-card">
                <h3 class="path-title">📍 {{ pathData.topic }} — 学习路径</h3>

                <!-- 步骤时间线 -->
                <div class="path-timeline">
                  <div
                    v-for="(step, idx) in pathData.steps"
                    :key="idx"
                    class="path-step"
                  >
                    <div class="step-indicator">
                      <span class="step-no">{{ step.stepNo || idx + 1 }}</span>
                      <span v-if="idx < pathData.steps.length - 1" class="step-line"></span>
                    </div>
                    <div class="step-body">
                      <div class="step-header">
                        <span class="step-name">{{ step.name }}</span>
                        <el-tag size="small" type="info" class="step-hours">⏱ {{ step.estimatedHours }}</el-tag>
                      </div>
                      <div class="step-reason">{{ step.reason }}</div>
                      <div v-if="step.keyPoints && step.keyPoints.length" class="step-points">
                        <span
                          v-for="(kp, ki) in step.keyPoints"
                          :key="ki"
                          class="step-point-tag"
                        >{{ kp }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 学习建议 -->
                <div v-if="pathData.tips && pathData.tips.length" class="path-tips">
                  <div class="path-tips-header">
                    <el-icon color="#7dffcf"><Checked /></el-icon>
                    <span>学习建议</span>
                  </div>
                  <div class="path-tips-body">
                    <div v-for="(tip, i) in pathData.tips" :key="i" class="path-tip-item">
                      <span class="k-bullet">✔</span> {{ tip }}
                    </div>
                  </div>
                </div>
              </div>
              <!-- 空态 -->
              <span v-else class="placeholder">输入不理解的知识点后点击「生成学习路径」，AI 将推荐前置学习内容</span>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Cpu, Search, EditPen, Guide, Loading, InfoFilled, Setting, Promotion, WarningFilled, Checked } from '@element-plus/icons-vue'
import { getMyEnrollments, getAllCourses, getCoursesByTeacher } from '@/api/course'
import { useUserStore } from '@/stores/user'
import {
  explainKnowledge,
  generateQuestion,
  recommendLearningPath,
} from '@/api/knowledgeAi'

// ========== 课程选择 ==========
const route = useRoute()
const userStore = useUserStore()
const myCourses = ref([])
const selectedCourseId = ref(null)
const selectedCourseName = ref('')

onMounted(async () => {
  // 根据角色加载不同的课程列表
  try {
    let res
    if (userStore.isAdmin) {
      // 管理员：加载所有课程
      res = await getAllCourses()
    } else if (userStore.isTeacher) {
      // 教师：加载自己授课的课程
      res = await getCoursesByTeacher(userStore.userId)
    } else {
      // 学生：加载已报名的课程
      res = await getMyEnrollments()
    }
    myCourses.value = res.data || []
  } catch (e) {
    console.error('加载课程列表失败:', e)
  }

  // 从 URL 参数初始化课程
  const qCourseId = route.query.courseId
  const qCourseName = route.query.courseName
  if (qCourseId) {
    selectedCourseId.value = Number(qCourseId)
    selectedCourseName.value = qCourseName || ''
  }
})

function onCourseChange(val) {
  const course = myCourses.value.find((c) => c.id === val)
  selectedCourseName.value = course ? course.courseName : ''
}

// ========== Tab 切换 ==========
const activeTab = ref('knowledge')

// ========== 知识点学习 ==========
const knowledgeTopic = ref('')
const knowledgeDetail = ref('')
const knowledgeLoading = ref(false)
const knowledgeData = ref(null)

async function handleKnowledge() {
  if (!knowledgeTopic.value.trim()) return
  knowledgeData.value = null
  knowledgeLoading.value = true

  try {
    const res = await explainKnowledge({
      courseId: selectedCourseId.value,
      courseName: selectedCourseName.value,
      topic: knowledgeTopic.value.trim(),
      detail: knowledgeDetail.value.trim() || null,
    })
    if (res.code === 200 && res.data) {
      knowledgeData.value = res.data
    } else {
      ElMessage.error(res.msg || 'AI 知识点讲解失败，请稍后重试')
    }
  } catch (err) {
    ElMessage.error('知识点学习请求失败: ' + (err.message || '网络异常'))
  } finally {
    knowledgeLoading.value = false
  }
}

// ========== AI 出题 ==========
const questionTopic = ref('')
const questionType = ref(1)
const questionDifficulty = ref('medium')
const questionCount = ref(3)
const questionLoading = ref(false)
const questionList = ref([])

// 生成时快照的难度（不随下拉框变化）
const generatedDifficulty = ref('medium')

const difficultyLabelMap = { easy: '简单', medium: '中等', hard: '困难' }
const difficultyTagMap = { easy: 'success', medium: 'warning', hard: 'danger' }

// 用于题目卡片展示（取生成时的快照）
const difficultyLabel = computed(() => difficultyLabelMap[generatedDifficulty.value] || '中等')
const difficultyTag = computed(() => difficultyTagMap[generatedDifficulty.value] || 'warning')

async function handleQuestion() {
  if (!questionTopic.value.trim()) return
  questionList.value = []
  questionLoading.value = true
  // 快照当前难度，防止后续修改下拉框影响已生成的题目标签
  generatedDifficulty.value = questionDifficulty.value

  try {
    const res = await generateQuestion({
      courseId: selectedCourseId.value,
      courseName: selectedCourseName.value,
      topic: questionTopic.value.trim(),
      questionType: questionType.value,
      count: questionCount.value,
      difficulty: questionDifficulty.value,
    })
    if (res.code === 200 && Array.isArray(res.data)) {
      questionList.value = res.data
    } else {
      ElMessage.error(res.msg || 'AI 出题失败，请稍后重试')
    }
  } catch (err) {
    ElMessage.error('AI 出题请求失败: ' + (err.message || '网络异常'))
  } finally {
    questionLoading.value = false
  }
}

// ========== 学习路径 ==========
const pathTopic = ref('')
const pathLoading = ref(false)
const pathData = ref(null)

async function handlePath() {
  if (!pathTopic.value.trim()) return
  pathData.value = null
  pathLoading.value = true

  try {
    const res = await recommendLearningPath({
      courseId: selectedCourseId.value,
      courseName: selectedCourseName.value,
      topic: pathTopic.value.trim(),
    })
    if (res.code === 200 && res.data) {
      pathData.value = res.data
    } else {
      ElMessage.error(res.msg || 'AI 学习路径生成失败，请稍后重试')
    }
  } catch (err) {
    ElMessage.error('学习路径请求失败: ' + (err.message || '网络异常'))
  } finally {
    pathLoading.value = false
  }
}
</script>

<style scoped>
.ai-assistant {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 顶部标题栏 */
.header-card {
  background: rgba(16, 30, 66, 0.85);
  border: 1px solid rgba(0, 229, 255, 0.2);
  border-radius: 8px;
}

.header-card :deep(.el-card__body) {
  padding: 12px 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #00e5ff;
  text-shadow: 0 0 10px rgba(0, 229, 255, 0.3);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.course-label {
  color: #9fe8ff;
  font-size: 14px;
  white-space: nowrap;
}

.course-select {
  width: 220px;
}

/* 主内容卡片 */
.main-card {
  background: rgba(16, 30, 66, 0.85);
  border: 1px solid rgba(0, 229, 255, 0.2);
  border-radius: 8px;
  flex: 1;
}

.main-card :deep(.el-card__body) {
  padding: 16px 20px;
}

/* Tabs 样式 */
.assistant-tabs :deep(.el-tabs__item) {
  color: #a0cfff;
  font-size: 15px;
}

.assistant-tabs :deep(.el-tabs__item.is-active) {
  color: #00e5ff;
}

.assistant-tabs :deep(.el-tabs__active-bar) {
  background-color: #00e5ff;
}

.assistant-tabs :deep(.el-tabs__nav-wrap::after) {
  background-color: rgba(0, 229, 255, 0.15);
}

/* Tab 内容 */
.tab-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-area {
  display: flex;
  flex-direction: column;
}

.mt-12 {
  margin-top: 12px;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.option-select {
  width: 140px;
}

.option-count {
  width: 100px;
}

/* 修复 el-input-number 右侧控制按钮在暗色主题下的白边 */
.option-count :deep(.el-input-number__decrease),
.option-count :deep(.el-input-number__increase) {
  border-color: rgba(0, 229, 255, 0.2);
  background: rgba(16, 30, 66, 0.85);
  color: #9fe8ff;
}

.option-count :deep(.el-input-number__decrease:hover),
.option-count :deep(.el-input-number__increase:hover) {
  color: #00e5ff;
}

.option-count :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px rgba(0, 229, 255, 0.2) inset;
}

.count-label {
  color: #9fe8ff;
  font-size: 14px;
}

.action-btn {
  align-self: flex-start;
}

/* 结果区域 */
.result-area {
  min-height: 200px;
  max-height: 600px;
  overflow-y: auto;
  padding: 16px;
  background: rgba(8, 20, 40, 0.9);
  border: 1px solid rgba(0, 229, 255, 0.15);
  border-radius: 8px;
}

.placeholder {
  color: rgba(159, 232, 255, 0.5);
  font-size: 14px;
}

/* === v-md-preview 深色主题适配 === */
.ai-md-wrap {
  isolation: isolate;
  color: #e0f0ff;
  font-size: 14px;
  line-height: 1.7;
}

.ai-md-wrap :deep(.v-md-editor-preview),
.ai-md-wrap :deep(.github-markdown-body) {
  background: transparent !important;
  color: #e0f0ff !important;
  font-size: 14px;
  line-height: 1.7;
  padding: 0 !important;
}

.ai-md-wrap :deep(.github-markdown-body h1),
.ai-md-wrap :deep(.github-markdown-body h2),
.ai-md-wrap :deep(.github-markdown-body h3),
.ai-md-wrap :deep(.github-markdown-body h4) {
  color: #00e5ff;
  margin: 16px 0 10px;
  border: none !important;
  font-weight: 600;
}

.ai-md-wrap :deep(.github-markdown-body h1) { font-size: 20px; }
.ai-md-wrap :deep(.github-markdown-body h2) { font-size: 18px; }
.ai-md-wrap :deep(.github-markdown-body h3) { font-size: 16px; }
.ai-md-wrap :deep(.github-markdown-body h4) { font-size: 15px; }

.ai-md-wrap :deep(.github-markdown-body p),
.ai-md-wrap :deep(.github-markdown-body li) {
  font-size: 14px;
  margin: 6px 0;
  color: #e0f0ff;
}

.ai-md-wrap :deep(.github-markdown-body strong) {
  color: #e0f0ff;
}

.ai-md-wrap :deep(.github-markdown-body ul),
.ai-md-wrap :deep(.github-markdown-body ol) {
  padding-left: 20px;
}

.ai-md-wrap :deep(.github-markdown-body hr) {
  display: none !important;
}

/* 代码块 */
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
  padding: 12px;
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

.ai-md-wrap :deep(.hljs-keyword),
.ai-md-wrap :deep(.hljs-type),
.ai-md-wrap :deep(.hljs-built_in) { color: #00e5ff !important; }
.ai-md-wrap :deep(.hljs-string),
.ai-md-wrap :deep(.hljs-number),
.ai-md-wrap :deep(.hljs-literal) { color: #ffab40 !important; }
.ai-md-wrap :deep(.hljs-comment),
.ai-md-wrap :deep(.hljs-meta) { color: #78909c !important; }
.ai-md-wrap :deep(.hljs-title),
.ai-md-wrap :deep(.hljs-function) { color: #7dffcf !important; }

/* 滚动条 */
.result-area::-webkit-scrollbar {
  width: 6px;
}
.result-area::-webkit-scrollbar-track {
  background: transparent;
}
.result-area::-webkit-scrollbar-thumb {
  background: rgba(0, 229, 255, 0.3);
  border-radius: 3px;
}
.result-area::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 229, 255, 0.5);
}

/* ========== 知识点卡片样式 ========== */

.knowledge-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.k-title {
  font-size: 18px;
  font-weight: 600;
  color: #00e5ff;
  margin: 0 0 4px;
  text-shadow: 0 0 8px rgba(0, 229, 255, 0.3);
}

.k-section {
  background: rgba(0, 229, 255, 0.04);
  border: 1px solid rgba(0, 229, 255, 0.15);
  border-radius: 8px;
  overflow: hidden;
}

.k-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  font-size: 15px;
  font-weight: 600;
  color: #00e5ff;
  background: rgba(0, 229, 255, 0.08);
  border-bottom: 1px solid rgba(0, 229, 255, 0.1);
}

.k-section-body {
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.8;
  color: #e0f0ff;
  white-space: pre-wrap;
}

.k-list-item {
  padding: 6px 0;
  display: flex;
  gap: 6px;
}

.k-bullet {
  flex-shrink: 0;
  color: #00e5ff;
  font-weight: 600;
}

.k-warn {
  color: #ffab40;
}

.k-warn .k-bullet {
  color: #ff6b6b;
}

.k-good {
  color: #b8e0ff;
}

.k-good .k-bullet {
  color: #7dffcf;
}

/* ========== 题目卡片样式 ========== */

.loading-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 0;
}

.loading-text {
  color: #9fe8ff;
  font-size: 14px;
}

.question-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-card {
  background: rgba(0, 229, 255, 0.05);
  border: 1px solid rgba(0, 229, 255, 0.2);
  border-radius: 8px;
  padding: 16px 20px;
  transition: border-color 0.2s;
}

.question-card:hover {
  border-color: rgba(0, 229, 255, 0.45);
}

.q-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.q-no {
  font-size: 15px;
  font-weight: 600;
  color: #00e5ff;
}

.q-diff {
  font-size: 12px;
}

.q-content {
  font-size: 14px;
  line-height: 1.7;
  color: #e0f0ff;
  margin-bottom: 12px;
  white-space: pre-wrap;
}

.q-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
  padding-left: 8px;
}

.q-option {
  font-size: 14px;
  color: #b8e0ff;
  padding: 6px 12px;
  border-radius: 4px;
  background: rgba(0, 229, 255, 0.06);
  border: 1px solid rgba(0, 229, 255, 0.1);
  transition: background 0.15s;
}

.q-option:hover {
  background: rgba(0, 229, 255, 0.12);
}

/* 折叠面板（答案区域）自定义 */
.q-collapse {
  --el-collapse-border-color: rgba(0, 229, 255, 0.15);
  --el-collapse-header-bg-color: transparent;
  --el-collapse-content-bg-color: transparent;
  border: none;
}

.q-collapse :deep(.el-collapse-item__header) {
  color: #00e5ff;
  font-size: 13px;
  height: 36px;
  line-height: 36px;
  border-bottom-color: rgba(0, 229, 255, 0.1);
  background: transparent;
}

.q-collapse :deep(.el-collapse-item__wrap) {
  background: transparent;
  border-bottom: none;
}

.q-collapse :deep(.el-collapse-item__content) {
  color: #e0f0ff;
  font-size: 14px;
  line-height: 1.7;
  padding-bottom: 4px;
}

.q-collapse :deep(.el-collapse-item__arrow) {
  color: #00e5ff;
}

.q-answer {
  margin-bottom: 8px;
  color: #7dffcf;
}

.q-explain {
  color: #b8e0ff;
  white-space: pre-wrap;
}

/* ========== 学习路径卡片样式 ========== */

.path-card {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.path-title {
  font-size: 18px;
  font-weight: 600;
  color: #00e5ff;
  margin: 0;
  text-shadow: 0 0 8px rgba(0, 229, 255, 0.3);
}

/* 时间线容器 */
.path-timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.path-step {
  display: flex;
  gap: 16px;
}

/* 左侧序号 + 竖线 */
.step-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 36px;
  flex-shrink: 0;
}

.step-no {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 229, 255, 0.15);
  border: 2px solid #00e5ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #00e5ff;
  flex-shrink: 0;
}

.step-line {
  width: 2px;
  flex: 1;
  min-height: 16px;
  background: linear-gradient(180deg, #00e5ff 0%, rgba(0, 229, 255, 0.2) 100%);
}

/* 右侧内容 */
.step-body {
  flex: 1;
  background: rgba(0, 229, 255, 0.04);
  border: 1px solid rgba(0, 229, 255, 0.15);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 12px;
  transition: border-color 0.2s;
}

.step-body:hover {
  border-color: rgba(0, 229, 255, 0.4);
}

.step-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.step-name {
  font-size: 15px;
  font-weight: 600;
  color: #00e5ff;
}

.step-hours {
  font-size: 12px;
  flex-shrink: 0;
}

.step-reason {
  font-size: 14px;
  line-height: 1.7;
  color: #b8e0ff;
  margin-bottom: 8px;
}

.step-points {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.step-point-tag {
  display: inline-block;
  padding: 2px 10px;
  font-size: 12px;
  color: #7dffcf;
  background: rgba(125, 255, 207, 0.08);
  border: 1px solid rgba(125, 255, 207, 0.2);
  border-radius: 12px;
}

/* 学习建议区 */
.path-tips {
  background: rgba(0, 229, 255, 0.04);
  border: 1px solid rgba(0, 229, 255, 0.15);
  border-radius: 8px;
  overflow: hidden;
}

.path-tips-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  font-size: 15px;
  font-weight: 600;
  color: #7dffcf;
  background: rgba(125, 255, 207, 0.06);
  border-bottom: 1px solid rgba(125, 255, 207, 0.1);
}

.path-tips-body {
  padding: 12px 16px;
}

.path-tip-item {
  padding: 4px 0;
  font-size: 14px;
  line-height: 1.8;
  color: #b8e0ff;
  display: flex;
  gap: 6px;
}
</style>
