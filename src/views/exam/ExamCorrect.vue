<template>
  <div class="exam-correct">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>批改试卷</span>
          <el-button @click="handleBack">返回</el-button>
        </div>
      </template>

      <!-- 考试记录信息 -->
      <el-descriptions :column="3" border class="record-info">
        <el-descriptions-item label="试卷名称">
          {{ recordDetail.paperName }}
        </el-descriptions-item>
        <el-descriptions-item label="学生姓名">
          {{ recordDetail.studentName }}
        </el-descriptions-item>
        <el-descriptions-item label="学号">
          {{ recordDetail.studentNo }}
        </el-descriptions-item>
        <el-descriptions-item label="开始时间">
          {{ recordDetail.startTime }}
        </el-descriptions-item>
        <el-descriptions-item label="提交时间">
          {{ recordDetail.submitTime }}
        </el-descriptions-item>
        <el-descriptions-item label="用时">
          {{ recordDetail.usedDuration }} 分钟
        </el-descriptions-item>
        <el-descriptions-item label="试卷总分">
          {{ recordDetail.paperTotalScore }} 分
        </el-descriptions-item>
        <el-descriptions-item label="当前得分">
          <el-tag :type="getScoreTagType(recordDetail)">
            {{ recordDetail.totalScore || 0 }} 分
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusTagType(recordDetail.status)">
            {{ EXAM_RECORD_STATUS_MAP[recordDetail.status] }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <el-divider />

      <!-- 答题列表 -->
      <div class="answers-list">
        <div
          v-for="(answer, index) in recordDetail.answers"
          :key="answer.id"
          class="answer-item"
        >
          <el-card shadow="hover" :class="{ 'subjective-question': isSubjectiveQuestion(answer.questionType) }">
            <template #header>
              <div class="question-header">
                <div class="question-title">
                  <span class="question-number">第 {{ index + 1 }} 题</span>
                  <el-tag size="small" :type="getQuestionTypeTagType(answer.questionType)">
                    {{ QUESTION_TYPE_MAP[answer.questionType] }}
                  </el-tag>
                  <span class="question-score">{{ answer.questionScore }} 分</span>
                </div>
                <div class="answer-score">
                  <span v-if="answer.score !== null" class="current-score">
                    得分:
                    <el-tag :type="answer.score >= answer.questionScore ? 'success' : 'warning'">
                      {{ answer.score }} 分
                    </el-tag>
                  </span>
                  <span v-else class="not-graded">未批改</span>
                </div>
              </div>
            </template>

            <!-- 题目内容 -->
            <div class="question-content">
              <div class="content-label">题目:</div>
              <div class="content-text">{{ answer.questionContent }}</div>
            </div>

            <!-- 正确答案 (仅客观题显示) -->
            <div v-if="!isSubjectiveQuestion(answer.questionType)" class="correct-answer">
              <div class="content-label">正确答案:</div>
              <div class="content-text answer-text correct">{{ answer.correctAnswer }}</div>
            </div>

            <!-- 学生答案 -->
            <div class="student-answer">
              <div class="content-label">学生答案:</div>
              <div
                class="content-text answer-text"
                :class="{
                  'correct': answer.isCorrect === 1,
                  'wrong': answer.isCorrect === 0 && !isSubjectiveQuestion(answer.questionType)
                }"
              >
                {{ answer.studentAnswer || '未作答' }}
              </div>
            </div>

            <!-- 主观题批改区域 -->
            <div v-if="isSubjectiveQuestion(answer.questionType)" class="grading-area">
              <el-divider />
              <div class="grading-form">
                <el-form :inline="true" @submit.prevent>
                  <el-form-item label="给分">
                    <el-input-number
                      v-model="answer.tempScore"
                      :min="0"
                      :max="answer.questionScore"
                      :precision="1"
                      :step="0.5"
                      style="width: 150px"
                      placeholder="请输入分数"
                    />
                    <span class="max-score">/ {{ answer.questionScore }} 分</span>
                  </el-form-item>
                  <el-form-item>
                    <el-button
                      type="primary"
                      :loading="answer.submitting"
                      @click="handleCorrectAnswer(answer)"
                    >
                      提交分数
                    </el-button>
                  </el-form-item>
                </el-form>
              </div>
            </div>

            <!-- 客观题自动判分提示 -->
            <div v-else class="auto-graded-tip">
              <el-alert
                :type="answer.isCorrect === 1 ? 'success' : 'error'"
                :title="answer.isCorrect === 1 ? '回答正确' : '回答错误'"
                :closable="false"
                show-icon
              />
            </div>
          </el-card>
        </div>
      </div>

      <!-- 批改完成提示 -->
      <el-alert
        v-if="allSubjectiveGraded"
        type="success"
        title="所有主观题已批改完成！总分已自动更新。"
        :closable="false"
        show-icon
        class="complete-tip"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getRecordDetailById, correctAnswer } from '@/api/exam'
import { QUESTION_TYPE_MAP, EXAM_RECORD_STATUS_MAP, QUESTION_TYPE } from '@/constants'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const recordDetail = ref({
  answers: []
})

// 获取考试记录ID
const recordId = computed(() => route.params.id)

/**
 * 加载考试记录详情
 */
const loadRecordDetail = async () => {
  loading.value = true
  try {
    const res = await getRecordDetailById(recordId.value)
    if (res.code === 200) {
      recordDetail.value = res.data
      // 初始化临时分数字段
      recordDetail.value.answers.forEach(answer => {
        answer.tempScore = answer.score !== null ? answer.score : null
        answer.submitting = false
      })
    }
  } catch (error) {
    ElMessage.error('加载考试记录失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

/**
 * 批改单道主观题
 */
const handleCorrectAnswer = async (answer) => {
  if (answer.tempScore === null || answer.tempScore === undefined) {
    ElMessage.warning('请输入分数')
    return
  }

  if (answer.tempScore < 0) {
    ElMessage.warning('分数不能为负数')
    return
  }

  if (answer.tempScore > answer.questionScore) {
    ElMessage.warning(`分数不能超过题目总分 ${answer.questionScore}`)
    return
  }

  answer.submitting = true
  try {
    const res = await correctAnswer(answer.id, answer.tempScore)
    if (res.code === 200) {
      ElMessage.success('批改成功')
      // 更新答案分数
      answer.score = answer.tempScore
      // 重新加载记录详情以更新总分
      await loadRecordDetail()
    }
  } catch (error) {
    ElMessage.error(error.message || '批改失败')
    console.error(error)
  } finally {
    answer.submitting = false
  }
}

/**
 * 判断是否为主观题
 */
const isSubjectiveQuestion = (questionType) => {
  return questionType === QUESTION_TYPE.FILL_BLANK || questionType === QUESTION_TYPE.SHORT_ANSWER
}

/**
 * 所有主观题是否已批改
 */
const allSubjectiveGraded = computed(() => {
  const subjectiveQuestions = recordDetail.value.answers.filter(answer =>
    isSubjectiveQuestion(answer.questionType)
  )
  if (subjectiveQuestions.length === 0) return false
  return subjectiveQuestions.every(answer => answer.score !== null)
})

/**
 * 获取分数标签类型
 */
const getScoreTagType = (record) => {
  if (!record.totalScore) return 'info'
  if (record.isPassed === 1) return 'success'
  return 'danger'
}

/**
 * 获取状态标签类型
 */
const getStatusTagType = (status) => {
  const statusTypeMap = {
    0: 'info',
    1: 'warning',
    2: 'primary',
    3: 'success'
  }
  return statusTypeMap[status] || 'info'
}

/**
 * 获取题型标签类型
 */
const getQuestionTypeTagType = (questionType) => {
  if (isSubjectiveQuestion(questionType)) {
    return 'warning'
  }
  return ''
}

/**
 * 返回
 */
const handleBack = () => {
  router.back()
}

onMounted(() => {
  loadRecordDetail()
})
</script>

<style scoped>
.exam-correct {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-info {
  margin-bottom: 20px;
}

.answers-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.answer-item {
  width: 100%;
}

.subjective-question {
  border-left: 4px solid var(--el-color-warning);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.question-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.question-number {
  font-weight: bold;
  font-size: 16px;
}

.question-score {
  color: var(--el-color-primary);
  font-weight: bold;
}

.answer-score {
  font-size: 14px;
}

.current-score {
  color: var(--el-text-color-primary);
}

.not-graded {
  color: var(--el-color-warning);
  font-weight: bold;
}

.question-content,
.correct-answer,
.student-answer {
  margin-bottom: 15px;
}

.content-label {
  font-weight: bold;
  color: var(--el-text-color-regular);
  margin-bottom: 8px;
}

.content-text {
  padding: 10px;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.answer-text {
  font-size: 15px;
}

.answer-text.correct {
  background-color: var(--el-color-success-light-9);
  border-left: 3px solid var(--el-color-success);
}

.answer-text.wrong {
  background-color: var(--el-color-danger-light-9);
  border-left: 3px solid var(--el-color-danger);
}

.grading-area {
  margin-top: 10px;
}

.grading-form {
  display: flex;
  align-items: center;
}

.max-score {
  margin-left: 10px;
  color: var(--el-text-color-secondary);
}

.auto-graded-tip {
  margin-top: 10px;
}

.complete-tip {
  margin-top: 20px;
}

:deep(.el-descriptions__label) {
  width: 100px;
}
</style>
