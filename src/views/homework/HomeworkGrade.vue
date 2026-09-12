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
        <el-table-column label="版本" width="80" align="center">
          <template #default="{ row }">V{{ row.revisionNo || 1 }}</template>
        </el-table-column>
        <el-table-column label="提交内容" min-width="260">
          <template #default="{ row }">
            <div class="submission-content">{{ row.content || '仅提交附件' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 2" type="success">已批改</el-tag>
            <el-tag v-else-if="row.status === 3" type="warning">待重交</el-tag>
            <el-tag v-else type="info">待批改</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="score" label="成绩" width="90" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status !== 3" type="primary" link @click="openGrade(row)">
              {{ row.status === 2 ? '修改成绩' : '批改' }}
            </el-button>
            <el-button
              v-if="row.status === 2 || row.status === 3"
              type="warning"
              link
              @click="openResubmit(row)"
            >
              {{ row.status === 3 ? '调整重交' : '允许重交' }}
            </el-button>
            <el-button v-if="(row.revisionNo || 1) > 1" type="info" link @click="openHistory(row)">
              历史
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
          <el-input
            v-model="gradeForm.feedback"
            type="textarea"
            :rows="5"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveGrade">保存批改</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="resubmitVisible"
      title="允许重交作业"
      width="min(560px, calc(100vw - 32px))"
      :close-on-click-modal="false"
    >
      <el-form label-position="top">
        <el-form-item label="学生">
          {{ activeSubmission?.studentName }}（{{ activeSubmission?.studentNumber }}）
        </el-form-item>
        <el-form-item label="重交截止时间" required>
          <el-date-picker
            v-model="resubmitForm.deadline"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss"
            format="YYYY-MM-DD HH:mm:ss"
            :disabled-date="disablePastDate"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="修改要求" required>
          <el-input
            v-model="resubmitForm.reason"
            type="textarea"
            :rows="4"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resubmitVisible = false">取消</el-button>
        <el-button type="primary" :loading="resubmitSaving" @click="saveResubmit">
          确认授权
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="historyVisible" title="作业提交历史" width="min(760px, calc(100vw - 32px))">
      <el-table v-loading="historyLoading" :data="revisionHistory" border>
        <el-table-column label="版本" width="80">
          <template #default="{ row }">V{{ row.revisionNo }}</template>
        </el-table-column>
        <el-table-column prop="submitTime" label="提交时间" width="170" />
        <el-table-column prop="content" label="提交内容" min-width="220" show-overflow-tooltip />
        <el-table-column label="成绩" width="100">
          <template #default="{ row }">{{ row.score ?? '-' }}</template>
        </el-table-column>
        <el-table-column
          prop="archiveReason"
          label="替换原因"
          min-width="180"
          show-overflow-tooltip
        />
      </el-table>
      <el-empty v-if="!historyLoading && revisionHistory.length === 0" description="暂无历史版本" />
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  authorizeHomeworkResubmission,
  getHomeworkById,
  getHomeworkRevisions,
  getHomeworkSubmissions,
  gradeHomework,
} from '@/api/homework'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const saving = ref(false)
const homework = ref({})
const submissions = ref([])
const dialogVisible = ref(false)
const resubmitVisible = ref(false)
const resubmitSaving = ref(false)
const historyVisible = ref(false)
const historyLoading = ref(false)
const revisionHistory = ref([])
const activeSubmission = ref(null)
const targetSubmissionHandled = ref(false)
const gradeForm = reactive({ score: null, feedback: '' })
const resubmitForm = reactive({ deadline: '', reason: '' })

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
    openTargetSubmission()
  } catch (error) {
    console.error('Load homework submissions failed:', error)
  } finally {
    loading.value = false
  }
}

function openTargetSubmission() {
  if (targetSubmissionHandled.value || !route.query.submissionId) return
  targetSubmissionHandled.value = true
  const target = submissions.value.find(
    (submission) => String(submission.id) === String(route.query.submissionId),
  )
  if (target) {
    openGrade(target)
  } else {
    ElMessage.warning('未找到对应的作业提交记录')
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
    await gradeHomework({
      id: activeSubmission.value.id,
      score: gradeForm.score,
      feedback: gradeForm.feedback,
    })
    ElMessage.success('批改成功，成绩已归集')
    dialogVisible.value = false
    await loadData()
  } catch (error) {
    console.error('Grade homework failed:', error)
  } finally {
    saving.value = false
  }
}

function openResubmit(submission) {
  activeSubmission.value = submission
  resubmitForm.deadline = defaultDeadline()
  resubmitForm.reason =
    submission.status === 3 ? submission.resubmitReason || '' : submission.feedback || ''
  resubmitVisible.value = true
}

async function saveResubmit() {
  if (!resubmitForm.deadline || !resubmitForm.reason.trim()) {
    ElMessage.warning('请填写重交截止时间和修改要求')
    return
  }
  resubmitSaving.value = true
  try {
    await authorizeHomeworkResubmission(activeSubmission.value.id, {
      deadline: resubmitForm.deadline,
      reason: resubmitForm.reason.trim(),
    })
    ElMessage.success(activeSubmission.value.status === 3 ? '重交期限已更新' : '已允许学生重交作业')
    resubmitVisible.value = false
    await loadData()
  } catch (error) {
    console.error('Authorize homework resubmission failed:', error)
  } finally {
    resubmitSaving.value = false
  }
}

async function openHistory(submission) {
  activeSubmission.value = submission
  revisionHistory.value = []
  historyVisible.value = true
  historyLoading.value = true
  try {
    const res = await getHomeworkRevisions(submission.id)
    revisionHistory.value = res.data || []
  } catch (error) {
    console.error('Load homework revision history failed:', error)
  } finally {
    historyLoading.value = false
  }
}

function defaultDeadline() {
  const value = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const offset = value.getTimezoneOffset() * 60 * 1000
  return new Date(value.getTime() - offset).toISOString().slice(0, 19)
}

const disablePastDate = (date) => date.getTime() < Date.now() - 24 * 60 * 60 * 1000
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
