<template>
  <div class="score-list neon-module">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的成绩</span>
        </div>
      </template>

      <el-table v-loading="loading" :data="tableData" border>
        <el-table-column prop="courseName" label="课程" width="180" />
        <el-table-column prop="examTitle" label="考试/作业" min-width="200" />
        <el-table-column prop="scoreTypeName" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.scoreType === 2 ? 'danger' : 'primary'">{{ row.scoreTypeName || '未知' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="score" label="成绩" width="100">
          <template #default="{ row }">
            <span :class="{ 'low-score': row.passed === false }">{{ row.score ?? '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="fullScore" label="总分" width="100" />
        <el-table-column prop="createTime" label="提交时间" width="180" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleView(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>

    </el-card>

    <el-dialog v-model="detailVisible" title="成绩详情" width="560px">
      <el-descriptions v-if="selectedScore.id" :column="1" border>
        <el-descriptions-item label="课程">{{ selectedScore.courseName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="考试/作业">{{ selectedScore.examTitle || '-' }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ selectedScore.scoreTypeName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="成绩">
          {{ selectedScore.score ?? '-' }} / {{ selectedScore.fullScore ?? '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="selectedScore.passed ? 'success' : 'danger'">
            {{ selectedScore.passed ? '及格' : '不及格' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="时间">{{ selectedScore.createTime || '-' }}</el-descriptions-item>
      </el-descriptions>
      <el-empty v-else description="暂无成绩详情" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getMyScores, getScoreById } from '@/api/score'

const loading = ref(false)

const tableData = ref([])
const detailVisible = ref(false)
const selectedScore = ref({})

onMounted(() => {
  loadScoreList()
})

const loadScoreList = async () => {
  try {
    loading.value = true
    const res = await getMyScores()
    tableData.value = res.data || []
  } catch (error) {
    console.error('Load score list failed:', error)
  } finally {
    loading.value = false
  }
}

const handleView = async (row) => {
  if (!row?.id) return
  try {
    const res = await getScoreById(row.id)
    selectedScore.value = res.data || row
  } catch (error) {
    console.error('Load score detail failed:', error)
    selectedScore.value = row
  }
  detailVisible.value = true
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
