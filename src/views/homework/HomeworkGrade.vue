<template>
  <div class="homework-grade">
    <el-card v-loading="loading" class="neon-card">
      <template #header>
        <div class="card-header">
          <span>{{ homework.title || '作业批改' }}</span>
          <el-button @click="router.back">返回</el-button>
        </div>
      </template>

      <el-alert
        v-if="!submissions.length"
        title="当前还没有学生提交"
        type="info"
        :closable="false"
        show-icon
      />
      <el-table v-else :data="submissions" border>
        <el-table-column prop="studentName" label="学生" width="140" />
        <el-table-column prop="studentNumber" label="学号" width="150" />
        <el-table-column prop="submitTime" label="提交时间" width="180" />
        <el-table-column label="提交内容" min-width="260">
          <template #default="{ row }">
            <div class="submission-content">{{ row.content || '仅提交附件' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 2" type="success">已批改</el-tag>
            <el-tag v-else type="warning">待批改</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="score" label="成绩" width="90" />
        <el-table-column label="操作" width="110" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openGrade(row)">
              {{ row.status === 2 ? '修改成绩' : '批改' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="批改作业" width="520px">
      <el-form :model="gradeForm" label-width="80px">
        <el-form-item label="学生">
          <span>{{ activeSubmission?.studentName }}（{{ activeSubmission?.studentNumber }}）</span>
        </el-form-item>
        <el-form-item label="成绩" required>
          <el-input-number
            v-model="gradeForm.score"
            :min="0"
            :max="Number(homework.totalScore || 100)"
            :precision="2"
            controls-position="right"
          />
          <span class="score-hint">/ {{ homework.totalScore || 100 }}</span>
        </el-form-item>
        <el-form-item label="评语">
          <el-input v-model="gradeForm.feedback" type="textarea" :rows="5" maxlength="1000" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveGrade">保存批改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getHomeworkById, getHomeworkSubmissions, gradeHomework } from '@/api/homework'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const saving = ref(false)
const homework = ref({})
const submissions = ref([])
const dialogVisible = ref(false)
const activeSubmission = ref(null)
const gradeForm = reactive({ score: null, feedback: '' })

onMounted(loadData)

async function loadData() {
  loading.value = true
  try {
    const [homeworkRes, submissionRes] = await Promise.all([
      getHomeworkById(route.params.id),
      getHomeworkSubmissions(route.params.id),
    ])
    homework.value = homeworkRes.data || {}
    submissions.value = submissionRes.data || []
  } catch (error) {
    console.error('Load homework submissions failed:', error)
  } finally {
    loading.value = false
  }
}

function openGrade(submission) {
  activeSubmission.value = submission
  gradeForm.score = submission.score == null ? null : Number(submission.score)
  gradeForm.feedback = submission.feedback || ''
  dialogVisible.value = true
}

async function saveGrade() {
  if (gradeForm.score == null) {
    ElMessage.warning('请输入成绩')
    return
  }
  saving.value = true
  try {
    await gradeHomework({ id: activeSubmission.value.id, score: gradeForm.score, feedback: gradeForm.feedback })
    ElMessage.success('批改成功，成绩已归集')
    dialogVisible.value = false
    await loadData()
  } catch (error) {
    console.error('Grade homework failed:', error)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.homework-grade {
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.submission-content {
  max-height: 80px;
  overflow: auto;
  white-space: pre-wrap;
  line-height: 1.5;
}

.score-hint {
  margin-left: 8px;
  color: var(--el-text-color-secondary);
}

.neon-card {
  background: rgba(20, 35, 70, 0.75);
  border: 1px solid rgba(0, 229, 255, 0.4);
}
</style>
