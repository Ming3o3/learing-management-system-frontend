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
        <el-table-column prop="examTitle" label="考核项目" min-width="200" />
        <el-table-column prop="scoreTypeName" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="scoreTypeTag(row.scoreType)">{{ row.scoreTypeName || '未知' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="score" label="成绩" width="100">
          <template #default="{ row }">
            <span :class="{ 'low-score': row.passed === false }">{{ row.score ?? '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="fullScore" label="总分" width="100" />
        <el-table-column prop="createTime" label="记录时间" width="180" />
        <el-table-column label="操作" width="340">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)"
              >查看详情</el-button
            >
            <el-button
              v-if="row.scoreType !== 3"
              type="primary"
              link
              size="small"
              @click="handleHistory(row)"
            >
              变更记录
            </el-button>
            <el-button
              v-if="row.scoreType === 1 || row.scoreType === 2"
              type="warning"
              link
              size="small"
              @click="openAppeal(row)"
            >
              申请复核
            </el-button>
            <el-button
              v-if="row.scoreType === 2 && row.relatedId"
              type="success"
              link
              size="small"
              @click="handleVerify(row)"
            >
              成绩验真
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="detailVisible" title="成绩详情" width="560px">
      <el-descriptions v-if="selectedScore.id" :column="1" border>
        <el-descriptions-item label="课程">{{
          selectedScore.courseName || '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="考核项目">{{
          selectedScore.examTitle || '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{
          selectedScore.scoreTypeName || '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="成绩">
          {{ selectedScore.score ?? '-' }} / {{ selectedScore.fullScore ?? '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="selectedScore.passed ? 'success' : 'danger'">
            {{ selectedScore.passed ? '及格' : '不及格' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="时间">{{
          selectedScore.createTime || '-'
        }}</el-descriptions-item>
        <el-descriptions-item v-if="selectedScore.remark" label="计算说明">
          {{ selectedScore.remark }}
        </el-descriptions-item>
      </el-descriptions>
      <el-empty v-else description="暂无成绩详情" />
    </el-dialog>

    <el-dialog
      v-model="appealVisible"
      title="申请成绩复核"
      width="min(560px, calc(100vw - 32px))"
      :close-on-click-modal="false"
    >
      <el-descriptions v-if="appealScore.id" :column="1" border class="appeal-summary">
        <el-descriptions-item label="课程">{{
          appealScore.courseName || '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="考核项目">
          {{ appealScore.scoreTypeName || '-' }} · {{ appealScore.examTitle || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="当前成绩">
          {{ appealScore.score ?? '-' }} / {{ appealScore.fullScore ?? '-' }}
        </el-descriptions-item>
      </el-descriptions>
      <el-form label-position="top">
        <el-form-item label="申诉理由" required>
          <el-input
            v-model="appealReason"
            type="textarea"
            :rows="5"
            maxlength="1000"
            show-word-limit
            placeholder="请说明需要核对的题目、评分或其他情况"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="appealVisible = false">取消</el-button>
        <el-button type="primary" :loading="appealLoading" @click="submitAppeal">
          提交申诉
        </el-button>
      </template>
    </el-dialog>

    <ScoreHistoryDialog ref="historyDialogRef" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createScoreAppeal, getMyScores, getScoreById } from '@/api/score'
import ScoreHistoryDialog from '@/components/ScoreHistoryDialog.vue'

const router = useRouter()
const loading = ref(false)

const tableData = ref([])
const detailVisible = ref(false)
const selectedScore = ref({})
const historyDialogRef = ref(null)
const appealVisible = ref(false)
const appealLoading = ref(false)
const appealScore = ref({})
const appealReason = ref('')

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
  if (openBusinessDetail(row)) return

  try {
    const res = await getScoreById(row.id)
    selectedScore.value = res.data || row
  } catch (error) {
    console.error('Load score detail failed:', error)
    selectedScore.value = row
  }
  if (openBusinessDetail(selectedScore.value)) return
  detailVisible.value = true
}

const openBusinessDetail = (score) => {
  if (score.scoreType === 2 && score.relatedId) {
    router.push({ name: 'ExamRecordList', query: { recordId: score.relatedId } })
    return true
  }
  if (score.scoreType === 1 && score.homeworkId) {
    router.push({ name: 'HomeworkDetail', params: { id: score.homeworkId } })
    return true
  }
  return false
}

const handleHistory = (row) => {
  historyDialogRef.value?.open(row)
}

const handleVerify = (row) => {
  router.push({
    name: 'VerifyGrade',
    query: { userId: row.studentId, relatedId: row.relatedId },
  })
}

const openAppeal = (row) => {
  appealScore.value = { ...row }
  appealReason.value = ''
  appealVisible.value = true
}

const submitAppeal = async () => {
  const reason = appealReason.value.trim()
  if (!reason) {
    ElMessage.warning('请填写申诉理由')
    return
  }
  appealLoading.value = true
  try {
    await createScoreAppeal({ scoreId: appealScore.value.id, reason })
    ElMessage.success('成绩申诉已提交')
    appealVisible.value = false
  } catch (error) {
    console.error('Create score appeal failed:', error)
  } finally {
    appealLoading.value = false
  }
}

const scoreTypeTag = (scoreType) => {
  if (scoreType === 2) return 'danger'
  if (scoreType === 3) return 'success'
  return 'primary'
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

.appeal-summary {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
