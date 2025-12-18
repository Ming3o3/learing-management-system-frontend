<template>
  <div class="take-exam">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>{{ exam.title }}</span>
          <div class="timer">
            <el-icon><Timer /></el-icon>
            <span class="time">{{ formatTime(remainingTime) }}</span>
          </div>
        </div>
      </template>

      <el-alert
        title="考试须知"
        type="info"
        :closable="false"
        class="alert"
      >
        <template #default>
          <p>1. 考试时长：{{ exam.duration }} 分钟</p>
          <p>2. 总分：{{ exam.totalScore }} 分，及格分数：{{ exam.passingScore }} 分</p>
          <p>3. 考试开始后不可暂停，请合理安排时间</p>
          <p>4. 提交后不可修改答案</p>
        </template>
      </el-alert>

      <div class="questions">
        <div v-for="(question, index) in exam.questions" :key="question.id" class="question-item">
          <div class="question-header">
            <span class="question-number">{{ index + 1 }}.</span>
            <el-tag size="small">{{ getQuestionTypeLabel(question.type) }}</el-tag>
            <span class="question-score">{{ question.score }} 分</span>
          </div>

          <div class="question-content">{{ question.content }}</div>

          <!-- 单选题 -->
          <el-radio-group
            v-if="question.type === 'SINGLE_CHOICE'"
            v-model="answers[question.id]"
            class="options"
          >
            <el-radio
              v-for="option in question.options"
              :key="option.id"
              :label="option.id"
              class="option"
            >
              {{ option.content }}
            </el-radio>
          </el-radio-group>

          <!-- 多选题 -->
          <el-checkbox-group
            v-else-if="question.type === 'MULTIPLE_CHOICE'"
            v-model="answers[question.id]"
            class="options"
          >
            <el-checkbox
              v-for="option in question.options"
              :key="option.id"
              :label="option.id"
              class="option"
            >
              {{ option.content }}
            </el-checkbox>
          </el-checkbox-group>

          <!-- 判断题 -->
          <el-radio-group
            v-else-if="question.type === 'TRUE_FALSE'"
            v-model="answers[question.id]"
            class="options"
          >
            <el-radio label="true" class="option">正确</el-radio>
            <el-radio label="false" class="option">错误</el-radio>
          </el-radio-group>

          <!-- 填空题和简答题 -->
          <el-input
            v-else
            v-model="answers[question.id]"
            type="textarea"
            :rows="question.type === 'SHORT_ANSWER' ? 5 : 2"
            placeholder="请输入答案"
            class="answer-input"
          />
        </div>
      </div>

      <div class="actions">
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          {{ submitLoading ? '提交中...' : '提交试卷' }}
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getExamById, submitExamAnswers } from '@/api/exam'
import { QUESTION_TYPE } from '@/constants'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const submitLoading = ref(false)
const exam = ref({})
const answers = reactive({})
const remainingTime = ref(0)
let timer = null

onMounted(async () => {
  await loadExamDetail()
  startTimer()
})

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
  }
})

const loadExamDetail = async () => {
  try {
    loading.value = true
    const res = await getExamById(route.params.id)
    exam.value = res.data
    remainingTime.value = exam.value.duration * 60 // 转换为秒
  } catch (error) {
    console.error('Load exam detail failed:', error)
    ElMessage.error('加载考试详情失败')
    router.back()
  } finally {
    loading.value = false
  }
}

const startTimer = () => {
  timer = setInterval(() => {
    if (remainingTime.value > 0) {
      remainingTime.value--
    } else {
      clearInterval(timer)
      ElMessage.warning('考试时间已到，自动提交试卷')
      handleSubmit(true)
    }
  }, 1000)
}

const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const getQuestionTypeLabel = (type) => {
  return QUESTION_TYPE.find(t => t.value === type)?.label || type
}

const handleSubmit = async (autoSubmit = false) => {
  try {
    if (!autoSubmit) {
      await ElMessageBox.confirm('确定提交试卷吗？提交后不可修改', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
    }

    submitLoading.value = true

    const formData = {
      examId: route.params.id,
      answers: Object.entries(answers).map(([questionId, answer]) => ({
        questionId: parseInt(questionId),
        answer: Array.isArray(answer) ? answer.join(',') : answer
      })),
      timeTaken: exam.value.duration * 60 - remainingTime.value
    }

    await submitExamAnswers(formData)

    ElMessage.success('提交成功')
    
    if (timer) {
      clearInterval(timer)
    }
    
    router.push('/exams')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Submit exam failed:', error)
    }
  } finally {
    submitLoading.value = false
  }
}
</script>

<style scoped>
.take-exam {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
}

.timer {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #f56c6c;
}

.time {
  font-size: 20px;
  font-weight: 600;
}

.alert {
  margin-bottom: 20px;
}

.questions {
  margin: 20px 0;
}

.question-item {
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #fff;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.question-number {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.question-score {
  margin-left: auto;
  color: #909399;
}

.question-content {
  font-size: 15px;
  color: #606266;
  margin-bottom: 15px;
  line-height: 1.6;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option {
  width: 100%;
  padding: 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  transition: all 0.3s;
}

.option:hover {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.answer-input {
  margin-top: 10px;
}

.actions {
  margin-top: 30px;
  text-align: center;
}
</style>
