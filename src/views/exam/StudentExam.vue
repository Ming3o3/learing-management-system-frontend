<template>
  <div class="student-exam">
    <el-card v-loading="loading">
      <template #header>
        <div class="header">
          <span>{{ paperInfo.paperName }}</span>
          <div class="timer" v-if="examStatus === 'doing'">
            <el-icon><Clock /></el-icon>
            <span>剩余时间: {{ formatTime(remainingTime) }}</span>
          </div>
        </div>
      </template>

      <!-- 考试信息 -->
      <el-alert
        v-if="examStatus === 'not-started'"
        title="考试说明"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      >
        <p>考试名称: {{ paperInfo.paperName }}</p>
        <p>总分: {{ paperInfo.totalScore }} 分</p>
        <p>及格分: {{ paperInfo.passScore }} 分</p>
        <p>考试时长: {{ paperInfo.duration }} 分钟</p>
        <p>题目数量: {{ questions.length }} 题</p>
        <p>开始时间: {{ paperInfo.startTime }}</p>
        <p>结束时间: {{ paperInfo.endTime }}</p>
        <p style="margin-top: 10px; color: #e6a23c">
          注意: 考试开始后不可中途退出,请确保网络畅通!
        </p>
      </el-alert>

      <!-- 开始考试按钮 -->
      <div v-if="examStatus === 'not-started'" style="text-align: center">
        <el-button type="primary" size="large" @click="handleStartExam">开始考试</el-button>
      </div>

      <!-- 答题区域 -->
      <div v-if="examStatus === 'doing'">
        <!-- 题目导航 -->
        <div class="question-nav">
          <el-tag
            v-for="(q, index) in questions"
            :key="q.id"
            :type="answers[q.id] ? 'success' : 'info'"
            style="margin: 5px; cursor: pointer"
            @click="currentQuestionIndex = index"
          >
            {{ index + 1 }}
          </el-tag>
        </div>

        <!-- 当前题目 -->
        <div v-if="currentQuestion" class="question-content">
          <h3>
            第 {{ currentQuestionIndex + 1 }} 题
            <el-tag>{{ getQuestionTypeText(currentQuestion.questionType) }}</el-tag>
            <el-tag type="warning">{{ currentQuestion.score }} 分</el-tag>
          </h3>

          <div class="question-title">{{ currentQuestion.title }}</div>

          <!-- 单选题 -->
          <el-radio-group
            v-if="currentQuestion.questionType === 1"
            v-model="answers[currentQuestion.id]"
            class="answer-area"
          >
            <el-radio
              v-for="(value, key) in parseOptions(currentQuestion.options)"
              :key="key"
              :label="key"
              class="option-item"
            >
              <span class="option-key">{{ key }}.</span>
              <span class="option-value">{{ value }}</span>
            </el-radio>
          </el-radio-group>

          <!-- 多选题 -->
          <el-checkbox-group
            v-else-if="currentQuestion.questionType === 2"
            v-model="multipleAnswers[currentQuestion.id]"
            class="answer-area"
            @change="handleMultipleChange(currentQuestion.id)"
          >
            <el-checkbox
              v-for="(value, key) in parseOptions(currentQuestion.options)"
              :key="key"
              :label="key"
              class="option-item"
            >
              <span class="option-key">{{ key }}.</span>
              <span class="option-value">{{ value }}</span>
            </el-checkbox>
          </el-checkbox-group>

          <!-- 判断题 -->
          <el-radio-group
            v-else-if="currentQuestion.questionType === 3"
            v-model="answers[currentQuestion.id]"
            class="answer-area"
          >
            <el-radio label="A" class="option-item">正确</el-radio>
            <el-radio label="B" class="option-item">错误</el-radio>
          </el-radio-group>

          <!-- 填空题/简答题 -->
          <el-input
            v-else
            v-model="answers[currentQuestion.id]"
            type="textarea"
            :rows="6"
            placeholder="请输入答案"
            class="answer-area"
          />
        </div>

        <!-- 导航按钮 -->
        <div class="nav-buttons">
          <el-button
            :disabled="currentQuestionIndex === 0"
            @click="currentQuestionIndex--"
          >
            上一题
          </el-button>
          <el-button
            v-if="currentQuestionIndex < questions.length - 1"
            type="primary"
            @click="currentQuestionIndex++"
          >
            下一题
          </el-button>
          <el-button v-else type="success" @click="handleSubmitExam">提交试卷</el-button>
        </div>
      </div>

      <!-- 已提交状态 -->
      <el-result
        v-if="examStatus === 'submitted'"
        icon="success"
        title="考试已提交"
        sub-title="请等待系统批改或教师评分"
      >
        <template #extra>
          <el-button type="primary" @click="router.push('/exam/records')">
            查看考试记录
          </el-button>
        </template>
      </el-result>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Clock } from '@element-plus/icons-vue'
import { getPaperById, getQuestionByPaper, startExam, submitAnswers } from '@/api/exam'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const examStatus = ref('not-started') // not-started, doing, submitted
const paperInfo = ref({})
const questions = ref([])
const answers = reactive({})
const multipleAnswers = reactive({})
const currentQuestionIndex = ref(0)
const recordId = ref(null)
const remainingTime = ref(0)
let timer = null

const currentQuestion = computed(() => questions.value[currentQuestionIndex.value])

onMounted(async () => {
  const paperId = route.params.id
  if (paperId) {
    await loadPaperInfo(paperId)
    await loadQuestions(paperId)
  }
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})

/**
 * 加载试卷信息
 */
const loadPaperInfo = async (paperId) => {
  loading.value = true
  try {
    const res = await getPaperById(paperId)
    if (res.code === 200) {
      paperInfo.value = res.data
    }
  } catch (error) {
    ElMessage.error('加载试卷信息失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

/**
 * 加载试题列表
 */
const loadQuestions = async (paperId) => {
  try {
    const res = await getQuestionByPaper(paperId)
    if (res.code === 200) {
      questions.value = res.data || []
    }
  } catch (error) {
    ElMessage.error('加载试题失败')
    console.error(error)
  }
}

/**
 * 开始考试
 */
const handleStartExam = async () => {
  try {
    const res = await startExam(route.params.id)
    if (res.code === 200) {
      recordId.value = res.data.id
      examStatus.value = 'doing'
      remainingTime.value = paperInfo.value.duration * 60 // 转换为秒

      // 启动倒计时
      startTimer()

      ElMessage.success('考试已开始,请认真作答!')
    }
  } catch (error) {
    ElMessage.error(error.message || '开始考试失败')
    console.error(error)
  }
}

/**
 * 启动倒计时
 */
const startTimer = () => {
  timer = setInterval(() => {
    if (remainingTime.value > 0) {
      remainingTime.value--
    } else {
      clearInterval(timer)
      ElMessage.warning('考试时间已到,系统将自动提交!')
      handleSubmitExam()
    }
  }, 1000)
}

/**
 * 格式化时间
 */
const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * 多选题改变
 */
const handleMultipleChange = (questionId) => {
  answers[questionId] = multipleAnswers[questionId].sort().join(',')
}

/**
 * 提交考试
 */
const handleSubmitExam = async () => {
  // 检查是否全部作答
  const unansweredCount = questions.value.filter((q) => !answers[q.id]).length
  if (unansweredCount > 0) {
    try {
      await ElMessageBox.confirm(
        `还有 ${unansweredCount} 道题未作答,确定要提交吗?`,
        '提示',
        {
          confirmButtonText: '确定提交',
          cancelButtonText: '继续答题',
          type: 'warning'
        }
      )
    } catch {
      return
    }
  }

  try {
    // 组装答案数据
    const answerList = Object.keys(answers)
      .filter((questionId) => answers[questionId])
      .map((questionId) => ({
        questionId: parseInt(questionId),
        studentAnswer: answers[questionId]
      }))

    const res = await submitAnswers({
      recordId: recordId.value,
      answers: answerList
    })

    if (res.code === 200) {
      examStatus.value = 'submitted'
      if (timer) {
        clearInterval(timer)
      }
      ElMessage.success('提交成功!')
    }
  } catch (error) {
    ElMessage.error('提交失败')
    console.error(error)
  }
}

/**
 * 解析选项
 */
const parseOptions = (options) => {
  try {
    return JSON.parse(options)
  } catch (error) {
    return {}
  }
}

/**
 * 获取题型文本
 */
const getQuestionTypeText = (type) => {
  const types = {
    1: '单选题',
    2: '多选题',
    3: '判断题',
    4: '填空题',
    5: '简答题'
  }
  return types[type] || '未知'
}
</script>

<style scoped>
.student-exam {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timer {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #e6a23c;
  font-size: 18px;
  font-weight: bold;
}

.question-nav {
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.question-content {
  margin: 30px 0;
}

.question-title {
  font-size: 16px;
  line-height: 1.8;
  margin: 20px 0;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.answer-area {
  width: 100%;
  margin: 20px 0;
}

.option-item {
  display: flex;
  align-items: flex-start;
  margin: 15px 0;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.option-item:hover {
  background: #f5f7fa;
  border-color: #409eff;
}

.option-key {
  font-weight: bold;
  margin-right: 10px;
  min-width: 30px;
}

.option-value {
  flex: 1;
  line-height: 1.6;
}

.nav-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
  padding: 20px 0;
  border-top: 1px solid #ebeef5;
}
</style>
