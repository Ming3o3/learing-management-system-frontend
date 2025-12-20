<template>
  <div class="score-list">
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="课程">
          <el-select v-model="searchForm.courseId" placeholder="请选择课程" clearable>
            <el-option
              v-for="course in courses"
              :key="course.id"
              :label="course.courseName"
              :value="course.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="学生">
          <el-input v-model="searchForm.studentName" placeholder="请输入学生姓名" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="action-card">
      <el-button type="success" @click="handleExport">
        <el-icon><Download /></el-icon>
        导出成绩
      </el-button>
      <el-button type="primary" @click="handleStatistics">
        <el-icon><DataAnalysis /></el-icon>
        成绩统计
      </el-button>
    </el-card>

    <el-card>
      <el-table v-loading="loading" :data="tableData" border>
        <el-table-column prop="studentName" label="学生姓名" width="120" />
        <el-table-column prop="studentNumber" label="学号" width="120" />
        <el-table-column prop="courseName" label="课程" width="180" />
        <el-table-column prop="examTitle" label="考试/作业" min-width="200" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 'EXAM' ? 'danger' : 'primary'">
              {{ row.type === 'EXAM' ? '考试' : '作业' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="score" label="成绩" width="100" sortable>
          <template #default="{ row }">
            <span :class="{ 'low-score': row.score < 60, 'high-score': row.score >= 90 }">
              {{ row.score }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="totalScore" label="总分" width="100" />
        <el-table-column prop="submitTime" label="提交时间" width="180" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleView(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadScoreList"
          @current-change="loadScoreList"
        />
      </div>
    </el-card>

    <!-- 统计对话框 -->
    <el-dialog v-model="statisticsVisible" title="成绩统计" width="800px">
      <div class="statistics">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-statistic title="平均分" :value="statistics.average" :precision="2" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="最高分" :value="statistics.max" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="最低分" :value="statistics.min" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="及格率" :value="statistics.passingRate" suffix="%" />
          </el-col>
        </el-row>

        <el-divider />

        <div class="chart">
          <!-- TODO: 可以使用 ECharts 绘制成绩分布图 -->
          <p class="placeholder">成绩分布图（待实现）</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getScoreList, exportScores } from '@/api/score'
import { getMyEnrollments } from '@/api/course'

const router = useRouter()
const loading = ref(false)
const statisticsVisible = ref(false)
const courses = ref([])

const searchForm = reactive({
  courseId: null,
  studentName: ''
})

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

const tableData = ref([])

const statistics = reactive({
  average: 0,
  max: 0,
  min: 0,
  passingRate: 0
})

onMounted(async () => {
  await loadCourses()
  await loadScoreList()
})

const loadCourses = async () => {
  try {
    const res = await getMyEnrollments()
    courses.value = res.data
  } catch (error) {
    console.error('Load courses failed:', error)
  }
}

const loadScoreList = async () => {
  try {
    loading.value = true
    const res = await getScoreList({
      ...searchForm,
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize
    })
    tableData.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    console.error('Load score list failed:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.pageNum = 1
  loadScoreList()
}

const handleReset = () => {
  Object.assign(searchForm, {
    courseId: null,
    studentName: ''
  })
  handleSearch()
}

const handleView = (row) => {
  if (row.type === 'EXAM') {
    router.push(`/exams/${row.examId}`)
  } else {
    router.push(`/homework/${row.homeworkId}`)
  }
}

const handleExport = async () => {
  try {
    await exportScores(searchForm)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('Export scores failed:', error)
  }
}

const handleStatistics = () => {
  // 计算统计数据
  const scores = tableData.value.map(item => item.score)
  statistics.average = scores.reduce((a, b) => a + b, 0) / scores.length
  statistics.max = Math.max(...scores)
  statistics.min = Math.min(...scores)
  statistics.passingRate = (scores.filter(s => s >= 60).length / scores.length) * 100

  statisticsVisible.value = true
}
</script>

<style scoped>
.score-list {
  padding: 20px;
}

.search-card,
.action-card {
  margin-bottom: 20px;
}

.low-score {
  color: #f56c6c;
  font-weight: 600;
}

.high-score {
  color: #67c23a;
  font-weight: 600;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.statistics {
  padding: 20px;
}

.chart {
  text-align: center;
  padding: 40px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.placeholder {
  color: #909399;
  font-size: 14px;
}
</style>
