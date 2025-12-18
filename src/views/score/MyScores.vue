<template>
  <div class="score-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的成绩</span>
        </div>
      </template>

      <el-table v-loading="loading" :data="tableData" border>
        <el-table-column prop="courseName" label="课程" width="180" />
        <el-table-column prop="examTitle" label="考试/作业" min-width="200" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 'EXAM' ? 'danger' : 'primary'">
              {{ row.type === 'EXAM' ? '考试' : '作业' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="score" label="成绩" width="100">
          <template #default="{ row }">
            <span :class="{ 'low-score': row.score < 60 }">{{ row.score }}</span>
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
          layout="total, prev, pager, next"
          @current-change="loadScoreList"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMyScores } from '@/api/score'

const router = useRouter()
const loading = ref(false)

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

const tableData = ref([])

onMounted(() => {
  loadScoreList()
})

const loadScoreList = async () => {
  try {
    loading.value = true
    const res = await getMyScores({
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

const handleView = (row) => {
  if (row.type === 'EXAM') {
    router.push(`/exams/${row.examId}`)
  } else {
    router.push(`/homework/${row.homeworkId}`)
  }
}
</script>

<style scoped>
.score-list {
  padding: 20px;
}

.card-header {
  font-size: 18px;
  font-weight: 600;
}

.low-score {
  color: #f56c6c;
  font-weight: 600;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
