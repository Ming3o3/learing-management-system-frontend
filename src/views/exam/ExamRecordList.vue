<template>
  <div class="exam-record-list neon-module">
    <el-card>
      <template #header>
        <span>{{ isTeacher ? '考试记录管理' : '我的考试记录' }}</span>
      </template>

      <!-- 教师视图 - 按试卷查看 -->
      <template v-if="isTeacher || isAdmin">
        <el-form :inline="true" :model="searchForm" @submit.prevent="handleSearch">
          <el-form-item label="试卷名称">
            <el-input
              v-model="searchForm.paperName"
              placeholder="请输入试卷名称"
              clearable
              style="width: 200px"
            />
          </el-form-item>
          <el-form-item label="课程">
            <el-select
              v-model="searchForm.courseId"
              placeholder="请选择课程"
              clearable
              style="width: 200px"
            >
              <el-option
                v-for="course in courseList"
                :key="course.id"
                :label="course.courseName"
                :value="course.id"
              />
            </el-select>
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

        <el-table v-loading="loading" :data="tableData" border stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="paperName" label="试卷名称" width="200" show-overflow-tooltip />
          <el-table-column prop="courseName" label="课程名称" width="140" show-overflow-tooltip />
          <el-table-column prop="studentName" label="学生姓名" width="120" />
          <el-table-column prop="studentNo" label="学号" width="150" />
          <el-table-column label="次数" width="90" align="center">
            <template #default="{ row }">第 {{ row.attemptNo || 1 }} 次</template>
          </el-table-column>
          <el-table-column prop="startTime" label="开始时间" width="160" />
          <el-table-column prop="submitTime" label="提交时间" width="160" />
          <el-table-column prop="usedDuration" label="用时(分钟)" width="120">
            <template #default="{ row }">
              {{ row.usedDuration || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="totalScore" label="得分" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.totalScore !== null" :type="getScoreType(row)">
                {{ row.totalScore }}
              </el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="isPassed" label="是否通过" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.isPassed === 1" type="success">通过</el-tag>
              <el-tag v-else-if="row.isPassed === 0" type="danger">未通过</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.status === 0" type="info">未开始</el-tag>
              <el-tag v-else-if="row.status === 1" type="warning">进行中</el-tag>
              <el-tag v-else-if="row.status === 2" type="primary">已提交</el-tag>
              <el-tag v-else-if="row.status === 4" type="danger">已中断</el-tag>
              <el-tag v-else-if="row.status === 5" type="warning">待补考</el-tag>
              <el-tag v-else type="success">已批改</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="250" fixed="right">
            <template #default="{ row }">
              <div class="record-actions">
                <el-button type="primary" size="small" @click="handleView(row)">查看</el-button>
                <el-button
                  v-if="row.status === 2"
                  type="success"
                  size="small"
                  @click="handleCorrect(row)"
                >
                  批改
                </el-button>
                <el-button
                  v-if="row.status === 3 || row.status === 5"
                  type="warning"
                  link
                  @click="openRetake(row)"
                >
                  {{ row.status === 5 ? '调整补考' : '安排补考' }}
                </el-button>
                <el-button
                  v-if="(row.attemptNo || 1) > 1"
                  type="info"
                  size="small"
                  :icon="Clock"
                  @click="openAttemptHistory(row)"
                >
                  历史
                </el-button>
              </div>
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
            @size-change="loadRecordList"
            @current-change="loadRecordList"
          />
        </div>
      </template>

      <!-- 学生视图 - 我的考试记录 -->
      <template v-else>
        <el-table v-loading="loading" :data="myRecords" border stripe>
          <el-table-column prop="paperName" label="试卷名称" width="200" show-overflow-tooltip />
          <el-table-column prop="courseName" label="课程名称" width="140" show-overflow-tooltip />
          <el-table-column label="次数" width="90" align="center">
            <template #default="{ row }">第 {{ row.attemptNo || 1 }} 次</template>
          </el-table-column>
          <el-table-column prop="startTime" label="开始时间" width="160" />
          <el-table-column prop="submitTime" label="提交时间" width="160" />
          <el-table-column prop="totalScore" label="得分" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.totalScore !== null" :type="getScoreType(row)">
                {{ row.totalScore }}
              </el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="isPassed" label="是否通过" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.isPassed === 1" type="success">通过</el-tag>
              <el-tag v-else-if="row.isPassed === 0" type="danger">未通过</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <el-tag v-if="row.status === 0" type="info">未开始</el-tag>
              <el-tag v-else-if="row.status === 1" type="warning">进行中</el-tag>
              <el-tag v-else-if="row.status === 2" type="primary">已提交</el-tag>
              <el-tag v-else-if="row.status === 4" type="danger">已中断</el-tag>
              <el-tag v-else-if="row.status === 5" type="warning">待补考</el-tag>
              <el-tag v-else type="success">已批改</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="240">
            <template #default="{ row }">
              <div class="record-actions">
                <el-button type="primary" size="small" @click="handleView(row)">查看</el-button>
                <el-button
                  v-if="row.status === 1 || row.status === 4 || row.status === 5"
                  type="success"
                  size="small"
                  :disabled="row.status === 5 && isDeadlineExpired(row.retakeDeadline)"
                  @click="handleResume(row)"
                >
                  {{
                    row.status === 5
                      ? isDeadlineExpired(row.retakeDeadline)
                        ? '补考已过期'
                        : '开始补考'
                      : '继续考试'
                  }}
                </el-button>
                <el-button
                  v-if="(row.attemptNo || 1) > 1"
                  type="info"
                  size="small"
                  :icon="Clock"
                  @click="openAttemptHistory(row)"
                >
                  历史
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </el-card>

    <!-- 查看答题详情对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="答题详情"
      width="900px"
      top="5vh"
      class="answer-detail-dialog"
    >
      <div v-loading="detailLoading">
        <el-descriptions :column="2" border style="margin-bottom: 20px">
          <el-descriptions-item label="试卷名称">
            {{ recordDetail.paperName }}
          </el-descriptions-item>
          <el-descriptions-item label="学生">
            {{ recordDetail.studentName
            }}<span v-if="recordDetail.studentNo">({{ recordDetail.studentNo }})</span>
          </el-descriptions-item>
          <el-descriptions-item label="开始时间">
            {{ recordDetail.startTime }}
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">
            {{ recordDetail.submitTime }}
          </el-descriptions-item>
          <el-descriptions-item label="得分">
            <el-tag :type="getScoreType(recordDetail)">
              {{ recordDetail.totalScore || 0 }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTagType(recordDetail.status)">
              {{ getStatusLabel(recordDetail.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="考试次数">
            第 {{ recordDetail.attemptNo || 1 }} 次
          </el-descriptions-item>
          <el-descriptions-item v-if="recordDetail.status === 5" label="补考截止时间">
            {{ recordDetail.retakeDeadline }}
          </el-descriptions-item>
          <el-descriptions-item v-if="recordDetail.status === 5" label="补考说明">
            {{ recordDetail.retakeReason }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 答题详情列表 -->
        <el-divider>答题详情</el-divider>
        <div v-if="recordDetail.answers && recordDetail.answers.length > 0">
          <div v-for="(answer, index) in recordDetail.answers" :key="answer.id" class="answer-item">
            <el-card shadow="hover" style="margin-bottom: 15px">
              <template #header>
                <div style="display: flex; justify-content: space-between; align-items: center">
                  <span>
                    <el-tag size="small">第{{ index + 1 }}题</el-tag>
                    <el-tag type="info" size="small" style="margin-left: 10px">
                      {{ getQuestionTypeText(answer.questionType) }}
                    </el-tag>
                    <el-tag type="warning" size="small" style="margin-left: 10px">
                      {{ answer.questionScore }}分
                    </el-tag>
                  </span>
                  <el-tag
                    :type="
                      answer.score === answer.questionScore
                        ? 'success'
                        : answer.score > 0
                          ? 'warning'
                          : 'danger'
                    "
                    size="small"
                  >
                    得分: {{ answer.score || 0 }}
                  </el-tag>
                </div>
              </template>

              <div class="question-content">
                <p><strong>题目:</strong> {{ answer.questionContent }}</p>

                <div v-if="getAllOptionsList(answer.options).length" class="all-options-box">
                  <div class="all-options-label">题目选项</div>
                  <div class="all-options-list">
                    <div
                      v-for="item in getAllOptionsList(answer.options)"
                      :key="item.key"
                      class="all-options-item"
                    >
                      <span class="opt-key">{{ item.key }}.</span>
                      <span class="opt-text">{{ item.text }}</span>
                    </div>
                  </div>
                </div>

                <el-descriptions :column="1" border style="margin-top: 10px">
                  <el-descriptions-item label="学生答案">
                    <div class="answer-with-option">
                      <span :style="{ color: answer.isCorrect === 1 ? '#67c23a' : '#f56c6c' }">
                        {{ answer.studentAnswer || '未作答' }}
                      </span>
                      <span
                        v-if="getOptionContent(answer.studentAnswer, answer.options)"
                        class="option-desc"
                      >
                        {{ getOptionContent(answer.studentAnswer, answer.options) }}
                      </span>
                    </div>
                  </el-descriptions-item>
                  <el-descriptions-item label="正确答案">
                    <div class="answer-with-option">
                      <span style="color: #67c23a">{{ answer.correctAnswer }}</span>
                      <span
                        v-if="getOptionContent(answer.correctAnswer, answer.options)"
                        class="option-desc"
                      >
                        {{ getOptionContent(answer.correctAnswer, answer.options) }}
                      </span>
                    </div>
                  </el-descriptions-item>
                  <el-descriptions-item label="判定结果" v-if="answer.questionType <= 3">
                    <el-tag v-if="answer.isCorrect === 1" type="success" size="small">正确</el-tag>
                    <el-tag v-else-if="answer.isCorrect === 0" type="danger" size="small"
                      >错误</el-tag
                    >
                    <el-tag v-else type="info" size="small">待批改</el-tag>
                  </el-descriptions-item>
                </el-descriptions>

                <!-- AI智能解析 -->
                <div class="ai-section">
                  <AiAnalyzer :question="answer" />
                </div>
              </div>
            </el-card>
          </div>
        </div>
        <el-empty v-else description="暂无答题记录" />
      </div>
    </el-dialog>

    <el-dialog
      v-model="retakeVisible"
      title="安排补考"
      width="min(560px, calc(100vw - 32px))"
      :close-on-click-modal="false"
    >
      <el-form label-position="top">
        <el-form-item label="学生">
          {{ activeRecord.studentName }}（{{ activeRecord.studentNo }}）
        </el-form-item>
        <el-form-item label="补考截止时间" required>
          <el-date-picker
            v-model="retakeForm.deadline"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss"
            format="YYYY-MM-DD HH:mm:ss"
            :disabled-date="disablePastDate"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="补考说明" required>
          <el-input
            v-model="retakeForm.reason"
            type="textarea"
            :rows="4"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="retakeVisible = false">取消</el-button>
        <el-button type="primary" :loading="retakeSaving" @click="saveRetake"> 确认安排 </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="historyVisible" title="历史考试记录" width="min(720px, calc(100vw - 32px))">
      <el-table v-loading="historyLoading" :data="attemptHistory" border>
        <el-table-column label="次数" width="90">
          <template #default="{ row }">第 {{ row.attemptNo }} 次</template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="170" />
        <el-table-column prop="submitTime" label="提交时间" width="170" />
        <el-table-column label="得分" width="90">
          <template #default="{ row }">{{ row.totalScore ?? '-' }}</template>
        </el-table-column>
        <el-table-column
          prop="archiveReason"
          label="补考原因"
          min-width="180"
          show-overflow-tooltip
        />
      </el-table>
      <el-empty v-if="!historyLoading && attemptHistory.length === 0" description="暂无历史考试" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { Clock, Search, Refresh } from '@element-plus/icons-vue'
import AiAnalyzer from '@/components/AiAnalyzer.vue'
import { getCourseList } from '@/api/course'
import {
  authorizeExamRetake,
  getExamAttemptHistory,
  getRecordPage,
  getMyRecords,
  getRecordDetailById,
} from '@/api/exam'

const route = useRoute()
const router = useRouter()
/**
 * 恢复考试
 */
const handleResume = (row) => {
  if (!row || !row.paperId) {
    return
  }
  if (row.status === 5) {
    router.push(`/exam/take/${row.paperId}`)
  } else {
    router.push(`/exam/take/${row.paperId}?recordId=${row.id}`)
  }
}
const userStore = useUserStore()

const isTeacher = computed(() => userStore.isTeacher)
const isAdmin = computed(() => userStore.isAdmin)

const loading = ref(false)
const detailLoading = ref(false)
const courseList = ref([])
const tableData = ref([])
const myRecords = ref([])
const viewDialogVisible = ref(false)
const recordDetail = ref({})
const targetRecordHandled = ref(false)
const retakeVisible = ref(false)
const retakeSaving = ref(false)
const historyVisible = ref(false)
const historyLoading = ref(false)
const activeRecord = ref({})
const attemptHistory = ref([])
const retakeForm = reactive({ deadline: '', reason: '' })

const searchForm = reactive({
  paperName: '',
  courseId: null,
})

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0,
})

onMounted(async () => {
  if (isTeacher.value || isAdmin.value) {
    await loadCourseList()
    await loadRecordList()
  } else {
    await loadMyRecords()
  }
})

/**
 * 加载课程列表
 */
const loadCourseList = async () => {
  try {
    const params = { status: 1 }
    // 如果是教师角色，只查询自己的课程
    if (isTeacher.value) {
      params.teacherId = userStore.userInfo.id
    }
    const res = await getCourseList(params)
    courseList.value = res.data || []
  } catch (error) {
    console.error('加载课程列表失败:', error)
  }
}

/**
 * 加载考试记录列表
 */
const loadRecordList = async () => {
  loading.value = true
  try {
    const params = {
      paperName: searchForm.paperName,
      courseId: searchForm.courseId,
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
    }
    // 如果是教师角色，只查询自己创建的试卷的考试记录
    if (isTeacher.value) {
      params.teacherId = userStore.userInfo.id
    }
    const res = await getRecordPage(params)

    if (res.code === 200) {
      tableData.value = res.data.list || []
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    ElMessage.error('加载考试记录失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

/**
 * 搜索
 */
const handleSearch = () => {
  pagination.pageNum = 1
  loadRecordList()
}

/**
 * 重置
 */
const handleReset = () => {
  searchForm.paperName = ''
  searchForm.courseId = null
  pagination.pageNum = 1
  loadRecordList()
}

/**
 * 加载我的考试记录
 */
const loadMyRecords = async () => {
  loading.value = true
  try {
    const res = await getMyRecords()
    if (res.code === 200) {
      myRecords.value = res.data || []
      openTargetRecord()
    }
  } catch (error) {
    ElMessage.error('加载考试记录失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const openTargetRecord = () => {
  if (targetRecordHandled.value || !route.query.recordId) return
  targetRecordHandled.value = true
  const target = myRecords.value.find(
    (record) => String(record.id) === String(route.query.recordId),
  )
  if (target) {
    handleView(target)
  } else {
    ElMessage.warning('未找到对应的考试记录')
  }
}

/**
 * 查看详情
 */
const handleView = async (row) => {
  viewDialogVisible.value = true
  detailLoading.value = true
  try {
    const res = await getRecordDetailById(row.id)
    if (res.code === 200) {
      recordDetail.value = res.data
    }
  } catch (error) {
    ElMessage.error('加载详情失败')
    console.error(error)
  } finally {
    detailLoading.value = false
  }
}

/**
 * 批改
 */
const handleCorrect = (row) => {
  // 跳转到批改页面
  router.push({
    name: 'ExamCorrect',
    params: { id: row.id },
  })
}

const openRetake = (row) => {
  activeRecord.value = row
  retakeForm.deadline = defaultDeadline()
  retakeForm.reason = row.status === 5 ? row.retakeReason || '' : ''
  retakeVisible.value = true
}

const saveRetake = async () => {
  if (!retakeForm.deadline || !retakeForm.reason.trim()) {
    ElMessage.warning('请填写补考截止时间和说明')
    return
  }
  retakeSaving.value = true
  try {
    await authorizeExamRetake(activeRecord.value.id, {
      deadline: retakeForm.deadline,
      reason: retakeForm.reason.trim(),
    })
    ElMessage.success(
      activeRecord.value.status === 5 ? '补考期限已更新' : '补考已安排，原成绩已转入历史',
    )
    retakeVisible.value = false
    await loadRecordList()
  } catch (error) {
    console.error('Authorize exam retake failed:', error)
  } finally {
    retakeSaving.value = false
  }
}

const openAttemptHistory = async (row) => {
  activeRecord.value = row
  attemptHistory.value = []
  historyVisible.value = true
  historyLoading.value = true
  try {
    const res = await getExamAttemptHistory(row.id)
    attemptHistory.value = res.data || []
  } catch (error) {
    console.error('Load exam attempt history failed:', error)
  } finally {
    historyLoading.value = false
  }
}

const defaultDeadline = () => {
  const value = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const offset = value.getTimezoneOffset() * 60 * 1000
  return new Date(value.getTime() - offset).toISOString().slice(0, 19)
}

const disablePastDate = (date) => date.getTime() < Date.now() - 24 * 60 * 60 * 1000
const isDeadlineExpired = (value) =>
  Boolean(value) && new Date(value.replace(/-/g, '/')).getTime() <= Date.now()

/**
 * 获取分数标签类型
 */
const getScoreType = (row) => {
  if (!row.totalScore) return 'info'
  if (row.isPassed === 1) return 'success'
  return 'danger'
}

/**
 * 获取状态文本
 */
const getStatusLabel = (status) => {
  if (status === 0) return '未开始'
  if (status === 1) return '进行中'
  if (status === 2) return '已提交'
  if (status === 4) return '已中断'
  if (status === 5) return '待补考'
  return '已批改'
}

/**
 * 获取状态标签类型
 */
const getStatusTagType = (status) => {
  if (status === 0) return 'info'
  if (status === 1) return 'warning'
  if (status === 2) return 'primary'
  if (status === 4) return 'danger'
  if (status === 5) return 'warning'
  return 'success'
}

/**
 * 获取题型文本
 */
const getQuestionTypeText = (type) => {
  const typeMap = {
    1: '单选题',
    2: '多选题',
    3: '判断题',
    4: '填空题',
    5: '简答题',
  }
  return typeMap[type] || '未知'
}

const parseOptions = (optionsStr) => {
  if (!optionsStr || typeof optionsStr !== 'string') return {}
  try {
    return JSON.parse(optionsStr)
  } catch {
    return {}
  }
}

const getOptionContent = (answerKeys, optionsStr) => {
  if (!answerKeys || !optionsStr) return ''
  const opts = parseOptions(optionsStr)
  if (!opts || typeof opts !== 'object') return ''
  const keys = String(answerKeys)
    .split(/[,，]/)
    .map((k) => k.trim())
    .filter(Boolean)
  const parts = keys.map((k) => (opts[k] != null ? `${k}. ${opts[k]}` : k))
  return parts.length ? parts.join(' / ') : ''
}

const getAllOptionsList = (optionsStr) => {
  const opts = parseOptions(optionsStr)
  if (!opts || typeof opts !== 'object') return []
  return Object.entries(opts).map(([key, text]) => ({ key, text: text ?? '' }))
}
</script>

<style scoped>
.exam-record-list {
  padding: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.record-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.record-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.answer-item .question-content {
  line-height: 1.8;
}

.answer-item .question-content p {
  margin: 0 0 10px 0;
  font-size: 14px;
}

.answer-item .question-content strong {
  color: #9fe8ff;
}

.answer-with-option {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.answer-with-option .option-desc {
  font-size: 13px;
  color: rgba(159, 232, 255, 0.85);
  padding-left: 8px;
  border-left: 2px solid rgba(0, 229, 255, 0.35);
}

.all-options-box {
  margin-top: 12px;
  padding: 12px 14px;
  background: rgba(8, 20, 40, 0.9);
  border: 1px solid rgba(0, 229, 255, 0.25);
  border-radius: 6px;
}

.all-options-label {
  font-size: 13px;
  color: #9fe8ff;
  margin-bottom: 8px;
}

.all-options-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.all-options-item {
  font-size: 13px;
  color: #e7f6ff;
}

.all-options-item .opt-key {
  color: rgba(0, 229, 255, 0.9);
  margin-right: 6px;
}

:deep(.answer-detail-dialog) {
  background: rgba(17, 32, 69, 0.95);
  border: 1px solid rgba(0, 255, 255, 0.3);
}

:deep(.answer-detail-dialog .el-dialog__title) {
  color: #00e5ff;
}

:deep(.answer-detail-dialog .el-dialog__headerbtn .el-dialog__close) {
  color: #a0cfff;
}

:deep(.answer-detail-dialog .el-dialog__body) {
  color: #e7f6ff;
  background: rgba(10, 24, 48, 0.6);
}

:deep(.answer-detail-dialog .el-divider) {
  border-color: rgba(0, 229, 255, 0.2);
}

:deep(.answer-detail-dialog .el-descriptions) {
  background: rgba(10, 24, 48, 0.6);
  border: 1px solid rgba(0, 229, 255, 0.2);
}

:deep(.answer-detail-dialog .el-descriptions__cell) {
  border-color: rgba(0, 229, 255, 0.2) !important;
}

:deep(.answer-detail-dialog .el-descriptions__label) {
  background: rgba(12, 26, 52, 0.9);
  color: #cfefff;
}

:deep(.answer-detail-dialog .el-descriptions__content) {
  background: rgba(8, 20, 40, 0.9);
  color: #e7f6ff;
}

:deep(.answer-detail-dialog .el-descriptions__content.is-bordered-content) {
  background: rgba(8, 20, 40, 0.9);
}

:deep(.answer-detail-dialog .el-descriptions__label.is-bordered-label) {
  background: rgba(12, 26, 52, 0.9);
}

:deep(.answer-detail-dialog .el-descriptions__cell) {
  background: transparent;
}

:deep(.answer-detail-dialog .el-card) {
  background: rgba(12, 24, 48, 0.75);
  border: 1px solid rgba(0, 229, 255, 0.2);
}

:deep(.answer-detail-dialog .el-card__header) {
  background: rgba(18, 36, 72, 0.85);
  border-bottom: 1px solid rgba(0, 229, 255, 0.2);
}

:deep(.answer-detail-dialog .el-card__body) {
  color: #e7f6ff;
}

:deep(.answer-detail-dialog .el-divider__text) {
  color: #9fe8ff;
  background: rgba(17, 32, 69, 0.95);
}

:deep(.answer-detail-dialog .el-tag) {
  border-radius: 4px;
}

/* AI解析区域样式 */
.ai-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed rgba(0, 229, 255, 0.2);
}

:deep(.answer-detail-dialog .el-empty__description) {
  color: rgba(231, 246, 255, 0.7);
}
</style>
