<template>
  <div class="paper-detail neon-module">
    <el-card v-loading="loading">
      <template #header>
        <div class="header">
          <span>试卷详情</span>
          <div>
            <el-button @click="handleBack">返回</el-button>
          </div>
        </div>
      </template>

      <!-- 基本信息 -->
      <el-descriptions :column="2" border>
        <el-descriptions-item label="试卷名称">{{ paperDetail.paperName }}</el-descriptions-item>
        <el-descriptions-item label="课程名称">{{ paperDetail.courseName }}</el-descriptions-item>
        <el-descriptions-item label="创建教师">{{ paperDetail.teacherName }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag v-if="paperDetail.status === 0" type="info">未发布</el-tag>
          <el-tag v-else-if="paperDetail.status === 1" type="success">已发布</el-tag>
          <el-tag v-else type="warning">已结束</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="总分">{{ paperDetail.totalScore }}</el-descriptions-item>
        <el-descriptions-item label="及格分">{{ paperDetail.passScore }}</el-descriptions-item>
        <el-descriptions-item label="考试时长">
          {{ paperDetail.duration }} 分钟
        </el-descriptions-item>
        <el-descriptions-item label="题目数量">
          {{ paperDetail.questionCount || 0 }}
        </el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ paperDetail.startTime }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ paperDetail.endTime }}</el-descriptions-item>
        <el-descriptions-item label="允许查看答案">
          {{ paperDetail.allowViewAnswer === 1 ? '是' : '否' }}
        </el-descriptions-item>
        <el-descriptions-item label="试卷描述" :span="2">
          {{ paperDetail.description || '无' }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 试题列表 - 仅教师和管理员可见 -->
      <template v-if="isTeacher || isAdmin">
        <el-divider content-position="left">试题列表</el-divider>

        <el-table :data="questionList" border style="margin-top: 20px">
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="title" label="题目" min-width="300" show-overflow-tooltip />
          <el-table-column prop="questionTypeDesc" label="题型" width="100" />
          <el-table-column prop="difficultyDesc" label="难度" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.difficulty === 1" type="success">简单</el-tag>
              <el-tag v-else-if="row.difficulty === 2" type="warning">中等</el-tag>
              <el-tag v-else type="danger">困难</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="score" label="分值" width="80" />
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button
                type="danger"
                size="small"
                @click="handleRemoveQuestion(row)"
                :disabled="paperDetail.status !== 0"
              >
                移除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-divider content-position="left">学生考试记录</el-divider>
        <el-table v-loading="recordLoading" :data="recordList" border stripe>
          <el-table-column prop="studentName" label="学生" width="130" />
          <el-table-column prop="studentNo" label="学号" width="150" />
          <el-table-column prop="startTime" label="开始时间" width="180" />
          <el-table-column prop="submitTime" label="提交时间" width="180">
            <template #default="{ row }">{{ row.submitTime || '-' }}</template>
          </el-table-column>
          <el-table-column prop="totalScore" label="得分" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.totalScore !== null && row.totalScore !== undefined" :type="getScoreType(row)">
                {{ row.totalScore }}
              </el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="handleViewRecord(row)">查看详情</el-button>
              <el-button
                v-if="row.status === 2"
                type="success"
                size="small"
                @click="handleCorrect(row)"
              >
                批改
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          v-model:current-page="recordPagination.pageNum"
          v-model:page-size="recordPagination.pageSize"
          :total="recordPagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          class="record-pagination"
          @size-change="loadRecordList"
          @current-change="loadRecordList"
        />
      </template>
    </el-card>

    <el-dialog v-model="recordDialogVisible" title="答题详情" width="900px" top="5vh">
      <div v-loading="recordDetailLoading">
        <el-descriptions v-if="recordDetail.id" :column="2" border class="record-summary">
          <el-descriptions-item label="学生">
            {{ recordDetail.studentName || '-' }}
            <span v-if="recordDetail.studentNo">（{{ recordDetail.studentNo }}）</span>
          </el-descriptions-item>
          <el-descriptions-item label="得分">
            {{ recordDetail.totalScore ?? '-' }} / {{ recordDetail.paperTotalScore ?? paperDetail.totalScore ?? '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ recordDetail.startTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ recordDetail.submitTime || '-' }}</el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">答题明细</el-divider>
        <div v-if="recordDetail.answers?.length" class="answer-list">
          <el-card v-for="(answer, index) in recordDetail.answers" :key="answer.id" shadow="never" class="answer-item">
            <template #header>
              <div class="answer-header">
                <span>第{{ index + 1 }}题 · {{ getQuestionTypeText(answer.questionType) }}</span>
                <el-tag :type="getAnswerTagType(answer)">
                  {{ answer.score ?? 0 }} / {{ answer.questionScore ?? 0 }} 分
                </el-tag>
              </div>
            </template>
            <div class="answer-question">{{ answer.questionContent || '题目内容不可用' }}</div>
            <div class="answer-line"><span class="answer-label">学生答案</span>{{ answer.studentAnswer || '未作答' }}</div>
            <div class="answer-line"><span class="answer-label">正确答案</span>{{ answer.correctAnswer || '暂不公开' }}</div>
          </el-card>
        </div>
        <el-empty v-else description="暂无答题记录" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getPaperById,
  getQuestionByPaper,
  removeQuestionFromPaper,
  getRecordsByPaper,
  getRecordDetailById,
} from '@/api/exam'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const isTeacher = computed(() => userStore.isTeacher)
const isAdmin = computed(() => userStore.isAdmin)

const loading = ref(false)
const paperDetail = reactive({
  id: null,
  paperName: '',
  courseName: '',
  teacherName: '',
  status: 0,
  totalScore: 0,
  passScore: 0,
  duration: 0,
  questionCount: 0,
  startTime: '',
  endTime: '',
  allowViewAnswer: 0,
  description: '',
})

const questionList = ref([])
const recordList = ref([])
const recordLoading = ref(false)
const recordDialogVisible = ref(false)
const recordDetailLoading = ref(false)
const recordDetail = ref({})
const recordPagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0,
})

onMounted(() => {
  const id = route.params.id
  if (id) {
    loadPaperDetail(id)
    loadQuestionList(id)
    if (isTeacher.value || isAdmin.value) {
      loadRecordList(id)
    }
  }
})

/**
 * 加载试卷详情
 */
const loadPaperDetail = async (id) => {
  loading.value = true
  try {
    const res = await getPaperById(id)
    if (res.code === 200) {
      Object.assign(paperDetail, res.data)
    }
  } catch (error) {
    ElMessage.error('加载试卷详情失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

/**
 * 加载试题列表
 */
const loadQuestionList = async (paperId) => {
  try {
    const res = await getQuestionByPaper(paperId)
    if (res.code === 200) {
      questionList.value = res.data || []
    }
  } catch (error) {
    ElMessage.error('加载试题列表失败')
    console.error(error)
  }
}

/**
 * 加载学生考试记录
 */
const loadRecordList = async (paperId = route.params.id) => {
  if (!paperId || (!isTeacher.value && !isAdmin.value)) return
  recordLoading.value = true
  try {
    const res = await getRecordsByPaper(paperId, {
      pageNum: recordPagination.pageNum,
      pageSize: recordPagination.pageSize,
    })
    if (res.code === 200) {
      recordList.value = res.data?.list || []
      recordPagination.total = res.data?.total || 0
    }
  } catch (error) {
    ElMessage.error('加载学生考试记录失败')
    console.error(error)
  } finally {
    recordLoading.value = false
  }
}

/**
 * 查看答题详情
 */
const handleViewRecord = async (row) => {
  if (!row?.id) return
  recordDialogVisible.value = true
  recordDetailLoading.value = true
  recordDetail.value = {}
  try {
    const res = await getRecordDetailById(row.id)
    if (res.code === 200) {
      recordDetail.value = res.data || {}
    }
  } catch (error) {
    ElMessage.error('加载答题详情失败')
    console.error(error)
  } finally {
    recordDetailLoading.value = false
  }
}

const handleCorrect = (row) => {
  router.push({ name: 'ExamCorrect', params: { id: row.id } })
}

const getStatusLabel = (status) => {
  const labels = { 0: '未开始', 1: '进行中', 2: '已提交', 3: '已批改', 4: '已中断' }
  return labels[status] || '未知'
}

const getStatusTagType = (status) => {
  const types = { 0: 'info', 1: 'warning', 2: 'primary', 3: 'success', 4: 'danger' }
  return types[status] || 'info'
}

const getScoreType = (row) => {
  if (row.isPassed === 1) return 'success'
  if (row.isPassed === 0) return 'danger'
  return 'info'
}

const getAnswerTagType = (answer) => {
  if (answer.score === answer.questionScore) return 'success'
  if (Number(answer.score) > 0) return 'warning'
  return 'danger'
}

const getQuestionTypeText = (type) => {
  const labels = { 1: '单选题', 2: '多选题', 3: '判断题', 4: '填空题', 5: '简答题' }
  return labels[type] || '未知题型'
}

/**
 * 移除试题
 */
const handleRemoveQuestion = async (row) => {
  try {
    await ElMessageBox.confirm('确定要从试卷中移除该试题吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    const res = await removeQuestionFromPaper(paperDetail.id, row.id)
    if (res.code === 200) {
      ElMessage.success('移除成功')
      await loadPaperDetail(paperDetail.id)
      await loadQuestionList(paperDetail.id)
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('移除失败')
      console.error(error)
    }
  }
}

/**
 * 返回
 */
const handleBack = () => {
  router.back()
}
</script>

<style scoped>
.paper-detail {
  padding: 20px;
  --el-text-color-primary: #e9fbff;
  --el-text-color-regular: #e9fbff;
  --el-text-color-secondary: rgba(233, 251, 255, 0.78);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-pagination {
  margin-top: 16px;
  justify-content: flex-end;
}

.record-summary {
  margin-bottom: 18px;
}

.answer-item {
  margin-bottom: 14px;
}

.answer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.answer-question {
  margin-bottom: 12px;
  line-height: 1.7;
  font-weight: 600;
}

.answer-line {
  margin-top: 8px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.answer-label {
  display: inline-block;
  width: 78px;
  color: #8aaec4;
}

:deep(.el-descriptions__label) {
  color: #e9fbff;
}

:deep(.el-descriptions__content) {
  color: #e9fbff;
}

:deep(.el-descriptions__cell.el-descriptions__content.is-bordered-content) {
  color: #e9fbff;
}

:deep(.el-descriptions__cell.el-descriptions__label.is-bordered-label) {
  color: #e9fbff;
}
</style>
