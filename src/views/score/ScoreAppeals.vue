<template>
  <div class="appeal-page neon-module">
    <el-card class="search-card neon-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable>
            <el-option label="待处理" :value="0" />
            <el-option label="申诉成立" :value="1" />
            <el-option label="申诉不成立" :value="2" />
            <el-option label="已撤回" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="canReview" label="课程">
          <el-select
            v-model="searchForm.courseId"
            placeholder="全部课程"
            clearable
            filterable
            class="course-select"
          >
            <el-option
              v-for="course in courses"
              :key="course.id"
              :label="course.courseName"
              :value="course.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="canReview" label="学生">
          <el-input v-model="searchForm.studentName" placeholder="请输入学生姓名" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card neon-card">
      <template #header>
        <div class="card-header">
          <span>{{ canReview ? '申诉复核' : '我的申诉' }}</span>
          <el-tag v-if="pendingCount > 0" type="warning" effect="dark">
            本页 {{ pendingCount }} 条待处理
          </el-tag>
        </div>
      </template>

      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column label="状态" width="120" fixed="left" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)" effect="dark">
              {{ row.statusName || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="canReview" prop="studentName" label="学生" width="130">
          <template #default="{ row }">
            <div>{{ row.studentName || '-' }}</div>
            <div class="secondary-text">{{ row.studentNumber || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="courseName" label="课程" min-width="160" show-overflow-tooltip />
        <el-table-column label="考核项目" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag size="small" :type="row.scoreType === 2 ? 'danger' : 'primary'">
              {{ row.scoreTypeName || '-' }}
            </el-tag>
            <span class="assessment-name">{{ row.assessmentTitle || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="成绩" width="150" align="center">
          <template #default="{ row }">
            <span>{{ formatScore(row.originalScore, row.originalFullScore) }}</span>
            <template v-if="row.scoreChanged">
              <el-icon class="score-arrow"><Right /></el-icon>
              <span class="changed-score">{{
                formatScore(row.currentScore, row.currentFullScore)
              }}</span>
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="申诉理由" min-width="220" show-overflow-tooltip />
        <el-table-column prop="createTime" label="提交时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openDetail(row)"> 查看 </el-button>
            <el-button v-if="canReview" type="primary" link size="small" @click="openSource(row)">
              核对成绩
            </el-button>
            <el-button
              v-if="canReview && row.status === 0"
              type="warning"
              link
              size="small"
              @click="openReview(row)"
            >
              复核
            </el-button>
            <el-button
              v-if="isStudent && row.status === 0"
              type="danger"
              link
              size="small"
              @click="cancelAppeal(row)"
            >
              撤回
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && tableData.length === 0" description="暂无申诉记录" />

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          background
          layout="total, sizes, prev, pager, next"
          @size-change="loadAppeals"
          @current-change="loadAppeals"
        />
      </div>
    </el-card>

    <el-dialog v-model="detailVisible" title="申诉详情" width="min(640px, calc(100vw - 32px))">
      <el-descriptions v-if="currentAppeal.id" :column="1" border>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTag(currentAppeal.status)">
            {{ currentAppeal.statusName || '-' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item v-if="canReview" label="学生">
          {{ currentAppeal.studentName || '-' }}
          <span v-if="currentAppeal.studentNumber">（{{ currentAppeal.studentNumber }}）</span>
        </el-descriptions-item>
        <el-descriptions-item label="课程">{{
          currentAppeal.courseName || '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="考核项目">
          {{ currentAppeal.scoreTypeName || '-' }} · {{ currentAppeal.assessmentTitle || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="申诉时成绩">
          {{ formatScore(currentAppeal.originalScore, currentAppeal.originalFullScore) }}
        </el-descriptions-item>
        <el-descriptions-item label="当前成绩">
          {{ formatScore(currentAppeal.currentScore, currentAppeal.currentFullScore) }}
          <el-tag v-if="currentAppeal.scoreChanged" type="success" size="small">已调整</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="申诉理由">
          <div class="long-text">{{ currentAppeal.reason || '-' }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="提交时间">
          {{ formatDateTime(currentAppeal.createTime) }}
        </el-descriptions-item>
        <el-descriptions-item v-if="currentAppeal.resolution" label="复核说明">
          <div class="long-text">{{ currentAppeal.resolution }}</div>
        </el-descriptions-item>
        <el-descriptions-item v-if="currentAppeal.reviewTime" label="复核信息">
          {{ currentAppeal.reviewerName || '-' }} · {{ formatDateTime(currentAppeal.reviewTime) }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog
      v-model="reviewVisible"
      title="复核成绩申诉"
      width="min(560px, calc(100vw - 32px))"
      :close-on-click-modal="false"
    >
      <el-form label-position="top">
        <el-form-item label="复核结果" required>
          <el-radio-group v-model="reviewForm.status">
            <el-radio-button :value="1">申诉成立</el-radio-button>
            <el-radio-button :value="2">申诉不成立</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="复核说明" required>
          <el-input
            v-model="reviewForm.resolution"
            type="textarea"
            :rows="5"
            maxlength="1000"
            show-word-limit
            placeholder="请填写核对过程与结论"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reviewVisible = false">取消</el-button>
        <el-button type="primary" :loading="reviewLoading" @click="submitReview">
          提交复核
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Right, Search } from '@element-plus/icons-vue'
import { getAllCourses } from '@/api/course'
import { cancelScoreAppeal, getScoreAppeals, reviewScoreAppeal } from '@/api/score'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const isStudent = computed(() => userStore.isStudent)
const canReview = computed(() => userStore.isTeacher || userStore.isAdmin)

const loading = ref(false)
const courses = ref([])
const tableData = ref([])
const detailVisible = ref(false)
const reviewVisible = ref(false)
const reviewLoading = ref(false)
const currentAppeal = ref({})

const searchForm = reactive({
  status: null,
  courseId: null,
  studentName: '',
})

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0,
})

const reviewForm = reactive({
  status: 1,
  resolution: '',
})

const pendingCount = computed(() => tableData.value.filter((item) => item.status === 0).length)

const loadAppeals = async () => {
  loading.value = true
  try {
    const res = await getScoreAppeals({
      ...searchForm,
      studentName: canReview.value ? searchForm.studentName : undefined,
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
    })
    tableData.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (error) {
    console.error('Load score appeals failed:', error)
  } finally {
    loading.value = false
  }
}

const loadCourses = async () => {
  if (!canReview.value) return
  try {
    const res = await getAllCourses()
    courses.value = res.data || []
  } catch (error) {
    console.error('Load courses failed:', error)
  }
}

const handleSearch = () => {
  pagination.pageNum = 1
  loadAppeals()
}

const handleReset = () => {
  Object.assign(searchForm, { status: null, courseId: null, studentName: '' })
  handleSearch()
}

const openDetail = (row) => {
  currentAppeal.value = { ...row }
  detailVisible.value = true
}

const openReview = (row) => {
  currentAppeal.value = { ...row }
  reviewForm.status = 1
  reviewForm.resolution = ''
  reviewVisible.value = true
}

const submitReview = async () => {
  if (!reviewForm.resolution.trim()) {
    ElMessage.warning('请填写复核说明')
    return
  }
  reviewLoading.value = true
  try {
    await reviewScoreAppeal(currentAppeal.value.id, {
      status: reviewForm.status,
      resolution: reviewForm.resolution.trim(),
    })
    ElMessage.success('复核结果已提交')
    reviewVisible.value = false
    await loadAppeals()
  } catch (error) {
    console.error('Review score appeal failed:', error)
  } finally {
    reviewLoading.value = false
  }
}

const cancelAppeal = async (row) => {
  try {
    await ElMessageBox.confirm('撤回后本次申诉将不再处理。', '撤回申诉', {
      type: 'warning',
      confirmButtonText: '确认撤回',
      cancelButtonText: '取消',
    })
    await cancelScoreAppeal(row.id)
    ElMessage.success('申诉已撤回')
    await loadAppeals()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      console.error('Cancel score appeal failed:', error)
    }
  }
}

const openSource = (row) => {
  if (row.scoreType === 2 && row.relatedId) {
    router.push({ name: 'ExamCorrect', params: { id: row.relatedId } })
    return
  }
  if (row.scoreType === 1 && row.homeworkId) {
    router.push({
      name: 'HomeworkGrade',
      params: { id: row.homeworkId },
      query: row.relatedId ? { submissionId: row.relatedId } : undefined,
    })
    return
  }
  ElMessage.warning('该申诉的原始成绩记录已不可用')
}

const statusTag = (status) => {
  if (status === 0) return 'warning'
  if (status === 1) return 'success'
  if (status === 2) return 'danger'
  return 'info'
}

const formatScore = (score, fullScore) => {
  if (score === null || score === undefined) return '-'
  return `${Number(score).toFixed(2)} / ${Number(fullScore ?? 100).toFixed(2)}`
}

const formatDateTime = (value) => {
  if (!value) return '-'
  return typeof value === 'string' ? value.replace('T', ' ').split('.')[0] : value
}

onMounted(() => {
  loadCourses()
  loadAppeals()
})
</script>

<style scoped>
.appeal-page {
  padding: 20px;
}

.search-card,
.table-card {
  margin-bottom: 20px;
}

.neon-card {
  background: rgba(20, 35, 70, 0.75);
  border: 1px solid rgba(0, 229, 255, 0.4);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
}

.search-form :deep(.el-form-item__label) {
  color: #e9fbff;
}

.course-select {
  width: 220px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #e9fbff;
  font-size: 17px;
  font-weight: 600;
}

.secondary-text {
  color: #8ea7c9;
  font-size: 12px;
}

.assessment-name {
  margin-left: 8px;
}

.score-arrow {
  margin: 0 4px;
  color: #8ea7c9;
  vertical-align: middle;
}

.changed-score {
  color: #67c23a;
  font-weight: 600;
}

.long-text {
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: break-word;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

@media (max-width: 768px) {
  .appeal-page {
    padding: 12px;
  }

  .course-select {
    width: 100%;
  }
}
</style>
