<template>
  <div class="score-list neon-module">
    <!-- 搜索卡片 -->
    <el-card class="search-card neon-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="课程">
          <el-select v-model="searchForm.courseId" placeholder="请选择课程" clearable filterable>
            <el-option label="全部课程" :value="null" />
            <el-option
              v-for="course in courses"
              :key="course.id"
              :label="course.courseName"
              :value="course.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="学生" v-if="isTeacher || isAdmin">
          <el-input v-model="searchForm.studentName" placeholder="请输入学生姓名" clearable />
        </el-form-item>
        <el-form-item label="类型">
          <el-select
            v-model="searchForm.scoreType"
            placeholder="全部类型"
            clearable
            class="type-select"
          >
            <el-option label="考试" :value="2" />
            <el-option label="作业" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="不及格" v-if="isTeacher || isAdmin">
          <el-checkbox v-model="searchForm.failedOnly">只看不及格</el-checkbox>
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

    <!-- 操作按钮 -->
    <el-card class="action-card neon-card" v-if="isTeacher || isAdmin">
      <div class="action-buttons">
        <el-button type="warning" @click="handleSyncAll">
          <el-icon><Refresh /></el-icon>
          同步考试成绩
        </el-button>
        <el-button type="success" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出成绩
        </el-button>
        <el-button type="primary" @click="handleStatistics">
          <el-icon><DataAnalysis /></el-icon>
          成绩统计
        </el-button>
      </div>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-card neon-card">
      <el-table v-loading="loading" :data="tableData" border stripe class="neon-table">
        <el-table-column prop="studentName" label="学生姓名" width="120" />
        <el-table-column prop="courseName" label="课程" width="180" show-overflow-tooltip />
        <el-table-column prop="examTitle" label="考试/作业" min-width="200" show-overflow-tooltip />
        <el-table-column prop="scoreTypeName" label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.scoreType === 2 ? 'danger' : 'primary'" effect="dark">
              {{ row.scoreTypeName || '未知' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="score" label="成绩" width="120" sortable align="center">
          <template #default="{ row }">
            <span class="score-value" :class="getScoreClass(row.score)">
              {{ row.score?.toFixed(1) || '0.0' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="fullScore" label="满分" width="100" align="center">
          <template #default="{ row }">
            {{ row.fullScore?.toFixed(1) || '0.0' }}
          </template>
        </el-table-column>
        <el-table-column label="百分比" width="120" align="center">
          <template #default="{ row }">
            <el-progress
              :percentage="row.scorePercentage || 0"
              :color="getProgressColor(row.scorePercentage)"
              :stroke-width="12"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="提交时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.passed ? 'success' : 'danger'" effect="dark">
              {{ row.passed ? '及格' : '不及格' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          :background="true"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadScoreList"
          @current-change="loadScoreList"
        />
      </div>
    </el-card>

    <!-- 统计对话框 -->
    <el-dialog
      v-model="statisticsVisible"
      title="成绩统计分析"
      width="900px"
      class="stats-dialog"
      :close-on-click-modal="false"
    >
      <div class="statistics-content">
        <!-- 基础统计 -->
        <el-row :gutter="20" class="stats-row">
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-icon average">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-label">平均分</div>
                <div class="stat-value">{{ statistics.average?.toFixed(2) || '0.00' }}</div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-icon max">
                <el-icon><Top /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-label">最高分</div>
                <div class="stat-value">{{ statistics.max?.toFixed(1) || '0.0' }}</div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-icon min">
                <el-icon><Bottom /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-label">最低分</div>
                <div class="stat-value">{{ statistics.min?.toFixed(1) || '0.0' }}</div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-icon passing">
                <el-icon><Checked /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-label">及格率</div>
                <div class="stat-value">{{ statistics.passingRate?.toFixed(1) || '0.0' }}%</div>
              </div>
            </div>
          </el-col>
        </el-row>

        <el-divider />

        <!-- 详细统计 -->
        <el-row :gutter="20" class="stats-detail">
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">中位数:</span>
              <span class="detail-value">{{ statistics.median?.toFixed(2) || '0.00' }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">优秀率(≥90):</span>
              <span class="detail-value excellent"
                >{{ statistics.excellentRate?.toFixed(1) || '0.0' }}%</span
              >
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <span class="detail-label">总人数:</span>
              <span class="detail-value">{{ statistics.totalCount || 0 }}</span>
            </div>
          </el-col>
        </el-row>

        <el-divider />

        <!-- 分数段分布 -->
        <div class="distribution-section">
          <h4 class="section-title">分数段分布</h4>
          <el-table :data="statistics.distributions" border class="distribution-table">
            <el-table-column prop="range" label="分数段" width="120" align="center" />
            <el-table-column prop="count" label="人数" width="100" align="center" />
            <el-table-column prop="percentage" label="占比" align="center">
              <template #default="{ row }">
                <el-progress
                  :percentage="row.percentage || 0"
                  :stroke-width="20"
                  :format="(p) => `${p.toFixed(1)}%`"
                />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Download,
  DataAnalysis,
  Search,
  Refresh,
  TrendCharts,
  Top,
  Bottom,
  Checked,
} from '@element-plus/icons-vue'
import { getScoreList, exportScores, getCourseScoreStats, syncAllExamScores } from '@/api/score'
import { getAllCourses } from '@/api/course'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const statisticsVisible = ref(false)
const courses = ref([])

const isTeacher = computed(() => userStore.isTeacher)
const isAdmin = computed(() => userStore.isAdmin)

const searchForm = reactive({
  courseId: null,
  studentName: '',
  scoreType: '',
  failedOnly: false,
})

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0,
})

const tableData = ref([])

const statistics = reactive({
  average: 0,
  max: 0,
  min: 0,
  median: 0,
  passingRate: 0,
  excellentRate: 0,
  totalCount: 0,
  passedCount: 0,
  excellentCount: 0,
  failedCount: 0,
  distributions: [],
})

onMounted(async () => {
  await loadCourses()
  await loadScoreList()
})

/**
 * 加载课程列表
 */
const loadCourses = async () => {
  try {
    const res = await getAllCourses()
    courses.value = res.data || []
  } catch (error) {
    console.error('Load courses failed:', error)
    ElMessage.error('加载课程列表失败')
  }
}

/**
 * 加载成绩列表
 */
const loadScoreList = async () => {
  try {
    loading.value = true
    const res = await getScoreList({
      ...searchForm,
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
    })
    tableData.value = res.data.list || []
    pagination.total = res.data.total || 0
  } catch (error) {
    console.error('Load score list failed:', error)
    ElMessage.error('加载成绩列表失败')
  } finally {
    loading.value = false
  }
}

/**
 * 查询
 */
const handleSearch = () => {
  pagination.pageNum = 1
  loadScoreList()
}

/**
 * 重置
 */
const handleReset = () => {
  Object.assign(searchForm, {
    courseId: null,
    studentName: '',
    scoreType: '',
    failedOnly: false,
  })
  handleSearch()
}

/**
 * 查看详情
 */
const handleView = (row) => {
  if (row.type === 'EXAM' && row.examId) {
    router.push(`/exams/records/${row.id}`)
  } else if (row.type === 'HOMEWORK' && row.homeworkId) {
    router.push(`/homework/submissions/${row.id}`)
  } else {
    ElMessage.warning('详情页面暂未开发')
  }
}

/**
 * 同步所有考试成绩
 */
const handleSyncAll = async () => {
  try {
    loading.value = true
    const res = await syncAllExamScores()
    ElMessage.success(res.data || '同步成功')
    // 重新加载数据
    await loadScoreList()
  } catch (error) {
    console.error('Sync exam scores failed:', error)
    ElMessage.error('同步失败')
  } finally {
    loading.value = false
  }
}

/**
 * 导出成绩
 */
const handleExport = async () => {
  try {
    const response = await exportScores(searchForm)

    // 创建下载链接（response是完整响应对象，需要用response.data）
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `成绩列表_${new Date().getTime()}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)

    ElMessage.success('导出成功')
  } catch (error) {
    console.error('Export scores failed:', error)
    ElMessage.error('导出失败')
  }
}

/**
 * 成绩统计
 */
const handleStatistics = async () => {
  if (!searchForm.courseId) {
    ElMessage.warning('请先选择课程')
    return
  }

  try {
    const res = await getCourseScoreStats(searchForm.courseId, searchForm.scoreType)
    Object.assign(statistics, res.data)
    statisticsVisible.value = true
  } catch (error) {
    console.error('Get statistics failed:', error)
    ElMessage.error('获取统计数据失败')
  }
}

/**
 * 获取分数样式类
 */
const getScoreClass = (score) => {
  if (score >= 90) return 'excellent-score'
  if (score >= 60) return 'good-score'
  return 'fail-score'
}

/**
 * 获取进度条颜色
 */
const getProgressColor = (percentage) => {
  if (percentage >= 90) return '#67c23a'
  if (percentage >= 60) return '#409eff'
  return '#f56c6c'
}

/**
 * 格式化日期时间
 */
const formatDateTime = (dateTime) => {
  if (!dateTime) return '-'
  // 如果是字符串，直接处理
  if (typeof dateTime === 'string') {
    // 处理ISO格式：2026-02-01T04:31:09
    return dateTime.replace('T', ' ').split('.')[0]
  }
  return dateTime
}
</script>

<style scoped lang="scss">
.score-list {
  padding: 20px;
}

.search-card,
.action-card,
.table-card {
  margin-bottom: 20px;
}

.neon-card {
  background: rgba(20, 35, 70, 0.75);
  border: 1px solid rgba(0, 229, 255, 0.4);
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.35),
    0 0 15px rgba(0, 255, 255, 0.2);
  backdrop-filter: blur(12px);
}

.search-form {
  :deep(.el-form-item__label) {
    color: #e9fbff;
  }

  :deep(.el-input__inner),
  :deep(.el-select .el-input__inner) {
    background: rgba(10, 24, 52, 0.6);
    border-color: rgba(0, 229, 255, 0.3);
    color: #e9fbff;
  }

  // placeholder文字颜色设置为白色
  :deep(.el-input__inner::placeholder) {
    color: rgba(255, 255, 255, 0.8);
  }

  // 复选框文字颜色设置为白色
  :deep(.el-checkbox__label) {
    color: #e9fbff !important;
  }

  // 扩大类型选择框宽度
  .type-select {
    width: 180px;
  }
}

.action-buttons {
  display: flex;
  gap: 12px;
}

/* 表格样式 */
.neon-table {
  :deep(.el-table__header-wrapper) {
    background: rgba(8, 20, 40, 0.9);
  }

  :deep(.el-table__header th) {
    background: rgba(8, 20, 40, 0.9);
    color: #bfefff;
    font-weight: 600;
    border-color: rgba(0, 229, 255, 0.2);
  }

  :deep(.el-table__body tr) {
    background: rgba(10, 24, 52, 0.5);
    color: #e9fbff;
  }

  :deep(.el-table__body tr:hover > td) {
    background: rgba(0, 229, 255, 0.08) !important;
  }

  :deep(.el-table__body td) {
    border-color: rgba(0, 229, 255, 0.12);
  }

  :deep(.el-table--striped .el-table__body tr.el-table__row--striped) {
    background: rgba(10, 26, 48, 0.6);
  }
}

/* 分数样式 */
.score-value {
  font-weight: 700;
  font-size: 16px;
  text-shadow: 0 0 8px currentColor;
}

.excellent-score {
  color: #7dffcf;
}

.good-score {
  color: #8fefff;
}

.fail-score {
  color: #ff8f8f;
}

/* 分页 */
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;

  :deep(.el-pagination) {
    --el-pagination-bg-color: rgba(10, 24, 52, 0.6);
    --el-pagination-button-bg-color: rgba(10, 24, 52, 0.6);
    --el-pagination-hover-color: #00e5ff;
  }

  :deep(.el-pager li) {
    background: rgba(10, 24, 52, 0.6);
    border: 1px solid rgba(0, 229, 255, 0.2);
    color: #e9fbff;
  }

  :deep(.el-pager li.is-active) {
    background: rgba(0, 229, 255, 0.3);
    border-color: #00e5ff;
    color: #00e5ff;
  }

  // 向前向后按钮样式优化
  :deep(.btn-prev),
  :deep(.btn-next) {
    background: rgba(10, 24, 52, 0.6) !important;
    border: 1px solid rgba(0, 229, 255, 0.3);
    color: #e9fbff;

    &:hover:not(:disabled) {
      background: rgba(0, 229, 255, 0.2) !important;
      border-color: #00e5ff;
      color: #00e5ff;
    }

    &:disabled {
      background: rgba(10, 24, 52, 0.3) !important;
      border-color: rgba(0, 229, 255, 0.1);
      color: rgba(233, 251, 255, 0.3);
    }
  }
}

/* 统计对话框 */
.stats-dialog {
  :deep(.el-dialog) {
    background: rgba(17, 32, 69, 0.95);
    border: 1px solid rgba(0, 255, 255, 0.4);
    box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
  }

  :deep(.el-dialog__header) {
    background: linear-gradient(90deg, rgba(0, 229, 255, 0.15), transparent);
    border-bottom: 1px solid rgba(0, 255, 255, 0.3);
  }

  :deep(.el-dialog__title) {
    color: #00e5ff;
    font-size: 20px;
    font-weight: 600;
    text-shadow: 0 0 10px rgba(0, 229, 255, 0.5);
  }

  :deep(.el-dialog__headerbtn .el-dialog__close) {
    color: #a0cfff;

    &:hover {
      color: #00e5ff;
    }
  }

  :deep(.el-dialog__body) {
    background: rgba(10, 24, 48, 0.6);
    color: #e7f6ff;
  }
}

.statistics-content {
  padding: 10px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: rgba(10, 24, 52, 0.6);
  border: 1px solid rgba(0, 229, 255, 0.3);
  border-radius: 8px;
  transition: all 0.3s;

  &:hover {
    border-color: #00e5ff;
    box-shadow: 0 0 15px rgba(0, 229, 255, 0.3);
    transform: translateY(-2px);
  }
}

.stat-icon {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-right: 15px;
  font-size: 24px;

  &.average {
    background: linear-gradient(135deg, rgba(64, 158, 255, 0.2), rgba(64, 158, 255, 0.05));
    color: #409eff;
  }

  &.max {
    background: linear-gradient(135deg, rgba(103, 194, 58, 0.2), rgba(103, 194, 58, 0.05));
    color: #67c23a;
  }

  &.min {
    background: linear-gradient(135deg, rgba(245, 108, 108, 0.2), rgba(245, 108, 108, 0.05));
    color: #f56c6c;
  }

  &.passing {
    background: linear-gradient(135deg, rgba(230, 162, 60, 0.2), rgba(230, 162, 60, 0.05));
    color: #e6a23c;
  }
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 13px;
  color: #a0cfff;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #00e5ff;
  text-shadow: 0 0 10px rgba(0, 229, 255, 0.4);
}

.stats-detail {
  margin: 20px 0;
}

.detail-item {
  padding: 10px;
  background: rgba(8, 20, 40, 0.5);
  border-left: 3px solid rgba(0, 229, 255, 0.5);
  border-radius: 4px;
}

.detail-label {
  color: #a0cfff;
  margin-right: 8px;
}

.detail-value {
  color: #00e5ff;
  font-weight: 600;
  font-size: 16px;

  &.excellent {
    color: #7dffcf;
  }
}

.distribution-section {
  margin-top: 20px;
}

.section-title {
  color: #00e5ff;
  font-size: 16px;
  margin-bottom: 15px;
  padding-left: 10px;
  border-left: 3px solid #00e5ff;
}

.distribution-table {
  :deep(.el-table__header th) {
    background: rgba(8, 20, 40, 0.9);
    color: #bfefff;
    border-color: rgba(0, 229, 255, 0.2);
  }

  :deep(.el-table__body td) {
    background: rgba(10, 24, 52, 0.5);
    color: #e9fbff;
    border-color: rgba(0, 229, 255, 0.12);
  }

  :deep(.el-progress__text) {
    color: #e9fbff !important;
  }
}

// 主表格进度条文字颜色
:deep(.el-table .el-progress__text) {
  color: #ffffff !important;
  font-weight: 500;
}
</style>
