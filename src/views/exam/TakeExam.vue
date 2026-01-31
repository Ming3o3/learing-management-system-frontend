<template>
  <div class="take-exam neon-module">
    <el-row :gutter="20">
      <!-- 左侧：考试题目 -->
      <el-col :xs="24" :lg="16">
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

          <el-alert title="考试须知" type="info" :closable="false" class="alert">
            <template #default>
              <p>1. 考试时长：{{ exam.duration }} 分钟</p>
              <p>2. 总分：{{ exam.totalScore }} 分，及格分数：{{ exam.passingScore }} 分</p>
              <p>3. 考试开始后不可暂停，请合理安排时间</p>
              <p>4. 提交后不可修改答案</p>
              <p>
                5. <strong style="color: #f56c6c">考试全程开启AI监考，请保持正常考试状态</strong>
              </p>
            </template>
          </el-alert>

          <div class="questions">
            <div
              v-for="(question, index) in exam.questions"
              :key="question.id"
              class="question-item"
            >
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
      </el-col>

      <!-- 右侧:监考面板 -->
      <el-col :xs="24" :lg="8">
        <div class="proctor-section">
          <!-- 摄像头监控 -->
          <ProctorCamera
            ref="proctorCameraRef"
            :exam-id="parseInt(route.params.id)"
            :student-id="userStore.userInfo.id"
            :show-preview="true"
            :show-stats="isDevelopment"
            :auto-start="true"
            @violation="handleViolation"
            @error="handleProctorError"
            class="proctor-camera-card"
          />

          <!-- 违规记录面板 -->
          <ViolationPanel :max-display="5" class="violation-panel-card" />
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Timer } from '@element-plus/icons-vue'
import { getExamById, submitExamAnswers } from '@/api/exam'
import { QUESTION_TYPE } from '@/constants'
import { useUserStore } from '@/stores/user'
import { useProctorStore } from '@/stores/proctor'
import ProctorCamera from '@/components/ProctorCamera.vue'
import ViolationPanel from '@/components/ViolationPanel.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const proctorStore = useProctorStore()

const loading = ref(false)
const submitLoading = ref(false)
const exam = ref({})
const answers = reactive({})
const remainingTime = ref(0)
const proctorCameraRef = ref(null)
let timer = null

// 开发模式标识
const isDevelopment = computed(() => import.meta.env.DEV)

onMounted(async () => {
  await loadExamDetail()
  startTimer()
})

onBeforeUnmount(async () => {
  if (timer) {
    clearInterval(timer)
  }

  // 停止监考
  if (proctorCameraRef.value) {
    await proctorCameraRef.value.stop()
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
      handleSubmit(true, '考试时间到')
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
  return QUESTION_TYPE.find((t) => t.value === type)?.label || type
}

/**
 * 处理违规事件
 */
const handleViolation = (violation) => {
  console.log('检测到违规:', violation)

  // 如果需要强制提交
  if (violation.shouldForceSubmit) {
    ElMessageBox.alert(
      `违规次数已达上限（${proctorStore.violationCount}次），系统将自动提交试卷！`,
      '严重违规警告',
      {
        type: 'error',
        showClose: false,
        confirmButtonText: '确定',
      },
    ).then(() => {
      handleSubmit(true, '违规次数过多')
    })
  }
}

/**
 * 处理监考错误
 */
const handleProctorError = (error) => {
  console.error('监考系统错误:', error)

  // 摄像头错误给予提示但不中断考试
  if (error.type === 'camera') {
    ElMessage.warning({
      message: '摄像头无法访问，请检查权限设置',
      duration: 5000,
    })
  }
}

const handleSubmit = async (autoSubmit = false, reason = '') => {
  try {
    if (!autoSubmit) {
      await ElMessageBox.confirm('确定提交试卷吗？提交后不可修改', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
    }

    submitLoading.value = true

    const formData = {
      examId: route.params.id,
      answers: Object.entries(answers).map(([questionId, answer]) => ({
        questionId: parseInt(questionId),
        answer: Array.isArray(answer) ? answer.join(',') : answer,
      })),
      timeTaken: exam.value.duration * 60 - remainingTime.value,
      // 附加监考信息
      proctorInfo: {
        violationCount: proctorStore.violationCount,
        violations: proctorStore.violations,
        autoSubmitReason: reason,
      },
    }

    await submitExamAnswers(formData)

    ElMessage.success('提交成功')

    if (timer) {
      clearInterval(timer)
    }

    // 停止监考
    if (proctorCameraRef.value) {
      await proctorCameraRef.value.stop()
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
  border: 1px solid rgba(64, 158, 255, 0.25);
  border-radius: 4px;
  background: linear-gradient(180deg, rgba(12, 26, 60, 0.95), rgba(9, 20, 48, 0.95));
  box-shadow: 0 0 18px rgba(64, 158, 255, 0.08);
  backdrop-filter: blur(4px);
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
  color: #e6f1ff;
}

.question-score {
  margin-left: auto;
  color: #8fb7ff;
}

.question-content {
  font-size: 15px;
  color: #d7e5ff;
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
  padding: 10px 12px;
  border: 1px solid rgba(72, 156, 255, 0.28);
  border-radius: 8px;
  background: rgba(12, 28, 64, 0.6);
  color: #cfe3ff;
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
}

.option:hover {
  border-color: rgba(115, 189, 255, 0.9);
  background: rgba(18, 48, 105, 0.65);
  box-shadow: 0 0 14px rgba(64, 158, 255, 0.25);
}

.option::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 10% 50%, rgba(64, 158, 255, 0.18), transparent 55%);
  opacity: 0;
  transition: opacity 0.25s ease;
  pointer-events: none;
}

.option:hover::after {
  opacity: 1;
}

:deep(.option.is-checked),
:deep(.option.is-checked:hover) {
  border-color: rgba(64, 158, 255, 1);
  background: linear-gradient(90deg, rgba(24, 62, 132, 0.9), rgba(14, 38, 86, 0.9));
  box-shadow: 0 0 18px rgba(64, 158, 255, 0.45);
}

:deep(.option.is-checked .el-radio__label),
:deep(.option.is-checked .el-checkbox__label) {
  color: #eaf4ff;
  font-weight: 600;
}

:deep(.option .el-radio__inner),
:deep(.option .el-checkbox__inner) {
  border-color: rgba(122, 196, 255, 0.7);
  background-color: rgba(9, 24, 52, 0.9);
}

:deep(.option.is-checked .el-radio__inner),
:deep(.option.is-checked .el-checkbox__inner) {
  border-color: #73bdff;
  background-color: #409eff;
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.6);
}

:deep(.option .el-radio__label),
:deep(.option .el-checkbox__label) {
  color: #cfe3ff;
}

.answer-input {
  margin-top: 10px;
}

:deep(.answer-input .el-textarea__inner) {
  background: rgba(10, 24, 52, 0.7);
  border-color: rgba(72, 156, 255, 0.35);
  color: #dbeaff;
  box-shadow: inset 0 0 10px rgba(16, 48, 105, 0.35);
}

:deep(.answer-input .el-textarea__inner::placeholder) {
  color: rgba(191, 219, 255, 0.6);
}

.actions {
  margin-top: 30px;
  text-align: center;
}

.proctor-section {
  position: sticky;
  top: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.proctor-camera-card,
.violation-panel-card {
  width: 100%;
}

/* 响应式布局 */
@media (max-width: 992px) {
  .proctor-section {
    position: static;
    margin-top: 20px;
  }
}
</style>
