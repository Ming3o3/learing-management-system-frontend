<template>
  <div class="exam-detail">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>{{ exam.title }}</span>
          <div class="header-actions">
            <el-button v-if="isTeacher || isAdmin" type="primary" @click="handleEdit">
              编辑试卷
            </el-button>
            <el-button @click="handleBack">返回</el-button>
          </div>
        </div>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="所属课程">{{ exam.courseName }}</el-descriptions-item>
        <el-descriptions-item label="考试时长">{{ exam.duration }} 分钟</el-descriptions-item>
        <el-descriptions-item label="总分">{{ exam.totalScore }} 分</el-descriptions-item>
        <el-descriptions-item label="及格分数">{{ exam.passingScore }} 分</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ exam.startTime }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ exam.endTime }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag v-if="exam.status === 0" type="info">未开始</el-tag>
          <el-tag v-else-if="exam.status === 1" type="success">进行中</el-tag>
          <el-tag v-else type="warning">已结束</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ exam.createTime }}</el-descriptions-item>
      </el-descriptions>

      <el-divider v-if="exam.description" content-position="left">试卷说明</el-divider>
      <div v-if="exam.description" class="description">{{ exam.description }}</div>

      <el-divider content-position="left">试题列表（共 {{ exam.questions?.length || 0 }} 题）</el-divider>
      
      <div v-if="exam.questions?.length" class="questions">
        <div v-for="(question, index) in exam.questions" :key="question.id" class="question-item">
          <div class="question-header">
            <span class="question-number">{{ index + 1 }}.</span>
            <el-tag size="small">{{ getQuestionTypeLabel(question.type) }}</el-tag>
            <span class="question-score">{{ question.score }} 分</span>
          </div>
          <div class="question-content">{{ question.content }}</div>
          
          <div v-if="question.options?.length" class="options">
            <div v-for="(option, optIndex) in question.options" :key="option.id" class="option">
              <span class="option-label">{{ String.fromCharCode(65 + optIndex) }}.</span>
              <span>{{ option.content }}</span>
              <el-tag v-if="option.isCorrect && showAnswers" type="success" size="small">
                正确答案
              </el-tag>
            </div>
          </div>
        </div>
      </div>
      <el-empty v-else description="暂无试题" />

      <!-- 学生答题记录（教师视图） -->
      <template v-if="isTeacher || isAdmin">
        <el-divider content-position="left">学生答题记录</el-divider>
        <el-table :data="examRecords" border>
          <el-table-column prop="studentName" label="学生" width="120" />
          <el-table-column prop="submitTime" label="提交时间" width="180" />
          <el-table-column prop="score" label="得分" width="100">
            <template #default="{ row }">
              <span :class="{ 'low-score': row.score < exam.passingScore }">
                {{ row.score }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="handleViewRecord(row)">
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getExamById } from '@/api/exam'
import { QUESTION_TYPE } from '@/constants'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const isAdmin = computed(() => userStore.isAdmin)
const isTeacher = computed(() => userStore.isTeacher)

const loading = ref(false)
const exam = ref({})
const examRecords = ref([])
const showAnswers = ref(false)

onMounted(() => {
  loadExamDetail()
})

const loadExamDetail = async () => {
  try {
    loading.value = true
    const res = await getExamById(route.params.id)
    exam.value = res.data
    
    // 教师可以查看答案
    if (isTeacher.value || isAdmin.value) {
      showAnswers.value = true
      // TODO: 加载学生答题记录
      loadExamRecords()
    }
  } catch (error) {
    console.error('Load exam detail failed:', error)
    ElMessage.error('加载考试详情失败')
  } finally {
    loading.value = false
  }
}

const loadExamRecords = async () => {
  // TODO: 调用API加载学生答题记录
  examRecords.value = []
}

const getQuestionTypeLabel = (type) => {
  return QUESTION_TYPE.find(t => t.value === type)?.label || type
}

const handleEdit = () => {
  router.push(`/exams/${route.params.id}/edit`)
}

const handleBack = () => {
  router.back()
}

const handleViewRecord = (row) => {
  // TODO: 查看学生答题详情
  ElMessage.info('查看答题详情功能待实现')
}
</script>

<style scoped>
.exam-detail {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.description {
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  line-height: 1.8;
  color: #606266;
}

.questions {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.question-item {
  padding: 20px;
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
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.option-label {
  font-weight: 600;
  color: #409eff;
}

.low-score {
  color: #f56c6c;
  font-weight: 600;
}
</style>
