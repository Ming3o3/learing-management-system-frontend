<template>
  <div class="exam-record-list">
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
              <el-tag v-else type="success">已批改</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="handleView(row)">查看</el-button>
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
              <el-tag v-else type="success">已批改</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="handleView(row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </el-card>

    <!-- 查看答题详情对话框 -->
    <el-dialog v-model="viewDialogVisible" title="答题详情" width="900px" top="5vh">
      <div v-loading="detailLoading">
        <el-descriptions :column="2" border style="margin-bottom: 20px">
          <el-descriptions-item label="试卷名称">
            {{ recordDetail.paperName }}
          </el-descriptions-item>
          <el-descriptions-item label="学生">
            {{ recordDetail.studentName }}<span v-if="recordDetail.studentNo">({{ recordDetail.studentNo }})</span>
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
            <el-tag v-if="recordDetail.status === 3" type="success">已批改</el-tag>
            <el-tag v-else type="warning">待批改</el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 答题详情列表 -->
        <el-divider>答题详情</el-divider>
        <div v-if="recordDetail.answers && recordDetail.answers.length > 0">
          <div
            v-for="(answer, index) in recordDetail.answers"
            :key="answer.id"
            class="answer-item"
          >
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
                    :type="answer.score === answer.questionScore ? 'success' : (answer.score > 0 ? 'warning' : 'danger')"
                    size="small"
                  >
                    得分: {{ answer.score || 0 }}
                  </el-tag>
                </div>
              </template>

              <div class="question-content">
                <p><strong>题目:</strong> {{ answer.questionContent }}</p>

                <el-descriptions :column="1" border style="margin-top: 10px">
                  <el-descriptions-item label="学生答案">
                    <span :style="{ color: answer.isCorrect === 1 ? '#67c23a' : '#f56c6c' }">
                      {{ answer.studentAnswer || '未作答' }}
                    </span>
                  </el-descriptions-item>
                  <el-descriptions-item label="正确答案">
                    <span style="color: #67c23a">{{ answer.correctAnswer }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="判定结果" v-if="answer.questionType <= 3">
                    <el-tag v-if="answer.isCorrect === 1" type="success" size="small">正确</el-tag>
                    <el-tag v-else-if="answer.isCorrect === 0" type="danger" size="small">错误</el-tag>
                    <el-tag v-else type="info" size="small">待批改</el-tag>
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </el-card>
          </div>
        </div>
        <el-empty v-else description="暂无答题记录" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import { getCourseList } from '@/api/course'
import { getRecordPage, getMyRecords, getRecordDetailById } from '@/api/exam'

const router = useRouter()
const userStore = useUserStore()

const isTeacher = computed(() => userStore.isTeacher)
const isAdmin = computed(() => userStore.isAdmin)
const isStudent = computed(() => userStore.isStudent)

const loading = ref(false)
const detailLoading = ref(false)
const courseList = ref([])
const tableData = ref([])
const myRecords = ref([])
const viewDialogVisible = ref(false)
const recordDetail = ref({})

const searchForm = reactive({
  paperName: '',
  courseId: null
})

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
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
      pageSize: pagination.pageSize
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
    }
  } catch (error) {
    ElMessage.error('加载考试记录失败')
    console.error(error)
  } finally {
    loading.value = false
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
    params: { id: row.id }
  })
}

/**
 * 获取分数标签类型
 */
const getScoreType = (row) => {
  if (!row.totalScore) return 'info'
  if (row.isPassed === 1) return 'success'
  return 'danger'
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
    5: '简答题'
  }
  return typeMap[type] || '未知'
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

.answer-item .question-content {
  line-height: 1.8;
}

.answer-item .question-content p {
  margin: 0 0 10px 0;
  font-size: 14px;
}

.answer-item .question-content strong {
  color: #303133;
}
</style>
