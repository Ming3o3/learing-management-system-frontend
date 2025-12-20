<template>
  <div class="paper-list">
    <!-- 搜索栏 -->
    <el-card class="search-card">
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
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="未发布" :value="0" />
            <el-option label="已发布" :value="1" />
            <el-option label="已结束" :value="2" />
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
    </el-card>

    <!-- 操作栏 -->
    <el-card v-if="isTeacher || isAdmin" class="action-card">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增试卷
      </el-button>
    </el-card>

    <!-- 数据表格 -->
    <el-card>
      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="paperName" label="试卷名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="courseName" label="课程名称" width="150" show-overflow-tooltip />
        <el-table-column prop="teacherName" label="创建教师" width="120" />
        <el-table-column prop="totalScore" label="总分" width="80" />
        <el-table-column prop="duration" label="时长(分钟)" width="100" />
        <el-table-column prop="questionCount" label="题目数" width="90">
          <template #default="{ row }">
            <el-tag type="info">{{ row.questionCount || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="passScore" label="及格分" width="90" />
        <el-table-column prop="startTime" label="开始时间" width="160" />
        <el-table-column prop="endTime" label="结束时间" width="160" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 0" type="info">未发布</el-tag>
            <el-tag v-else-if="row.status === 1" type="success">已发布</el-tag>
            <el-tag v-else type="warning">已结束</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="320" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleView(row)">查看</el-button>
            <template v-if="isTeacher || isAdmin">
              <el-button
                v-if="row.status === 0"
                type="success"
                size="small"
                @click="handlePublish(row)"
              >
                发布
              </el-button>
              <el-button type="info" size="small" @click="handleCompose(row)">组卷</el-button>
              <el-button type="warning" size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
            </template>
            <template v-if="isStudent && row.status === 1">
              <el-button type="success" size="small" @click="handleTakeExam(row)">
                参加考试
              </el-button>
            </template>
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
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadPaperList"
          @current-change="loadPaperList"
        />
      </div>
    </el-card>

    <!-- 组卷对话框 -->
    <el-dialog v-model="composeDialogVisible" title="组卷" width="800px" @close="handleComposeClose">
      <el-form :model="composeForm" label-width="100px">
        <el-form-item label="课程">
          <el-select
            v-model="composeForm.courseId"
            placeholder="请选择课程"
            style="width: 100%"
            @change="handleCourseChange"
          >
            <el-option
              v-for="course in courseList"
              :key="course.id"
              :label="course.courseName"
              :value="course.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="题型筛选">
          <el-select
            v-model="composeForm.questionType"
            placeholder="请选择题型"
            clearable
            style="width: 200px"
            @change="loadQuestions"
          >
            <el-option label="单选题" :value="1" />
            <el-option label="多选题" :value="2" />
            <el-option label="判断题" :value="3" />
            <el-option label="填空题" :value="4" />
            <el-option label="简答题" :value="5" />
          </el-select>
        </el-form-item>
        <el-form-item label="选择试题">
          <el-transfer
            v-model="composeForm.selectedQuestions"
            :data="availableQuestions"
            :titles="['可选试题', '已选试题']"
            :props="{ key: 'id', label: 'title' }"
            filterable
            :filter-placeholder="'请输入关键字'"
            style="text-align: left"
          >
            <template #default="{ option }">
              <span>{{ option.title }}</span>
              <span style="margin-left: 10px; color: #999">({{ option.score }}分)</span>
            </template>
          </el-transfer>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="composeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleComposeSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import {
  getPaperPage,
  deletePaper,
  publishPaper,
  addQuestionsToPaper,
  clearPaperQuestions,
  getQuestionByPaper
} from '@/api/exam'
import { getQuestionByCourse } from '@/api/exam'
import { getCourseList } from '@/api/course'

const router = useRouter()
const userStore = useUserStore()

const isTeacher = computed(() => userStore.isTeacher)
const isAdmin = computed(() => userStore.isAdmin)
const isStudent = computed(() => userStore.isStudent)

const loading = ref(false)
const courseList = ref([])
const tableData = ref([])

const searchForm = reactive({
  paperName: '',
  courseId: null,
  status: null
})

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

const composeDialogVisible = ref(false)
const composeForm = reactive({
  paperId: null,
  courseId: null,
  questionType: null,
  selectedQuestions: []
})
const availableQuestions = ref([])

onMounted(async () => {
  await loadCourseList()
  await loadPaperList()
})

/**
 * 加载课程列表
 */
const loadCourseList = async () => {
  try {
    const res = await getCourseList({ status: 1 })
    courseList.value = res.data || []
  } catch (error) {
    console.error('加载课程列表失败:', error)
  }
}

/**
 * 加载试卷列表
 */
const loadPaperList = async () => {
  loading.value = true
  try {
    const params = {
      ...searchForm,
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize
    }
    const res = await getPaperPage(params)
    console.log('API响应:', res)

    if (res.code === 200 && res.data) {
      tableData.value = res.data.list || []
      pagination.total = res.data.total || 0
      console.log('试卷列表:', tableData.value)
      console.log('总数:', pagination.total)
    }
  } catch (error) {
    ElMessage.error('加载试卷列表失败')
    console.error('加载失败:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 搜索
 */
const handleSearch = () => {
  pagination.pageNum = 1
  loadPaperList()
}

/**
 * 重置
 */
const handleReset = () => {
  searchForm.paperName = ''
  searchForm.courseId = null
  searchForm.status = null
  handleSearch()
}

/**
 * 新增
 */
const handleAdd = () => {
  router.push('/exam/paper/add')
}

/**
 * 查看
 */
const handleView = (row) => {
  router.push(`/exam/paper/detail/${row.id}`)
}

/**
 * 编辑
 */
const handleEdit = (row) => {
  router.push(`/exam/paper/edit/${row.id}`)
}

/**
 * 发布
 */
const handlePublish = async (row) => {
  if (!row.questionCount || row.questionCount === 0) {
    ElMessage.warning('请先为试卷添加试题后再发布')
    return
  }

  try {
    await ElMessageBox.confirm('确定要发布该试卷吗？发布后将无法修改', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const res = await publishPaper(row.id)
    if (res.code === 200) {
      ElMessage.success('发布成功')
      await loadPaperList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('发布失败')
      console.error(error)
    }
  }
}

/**
 * 删除
 */
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该试卷吗？此操作不可恢复', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const res = await deletePaper(row.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      await loadPaperList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }
}

/**
 * 组卷
 */
const handleCompose = async (row) => {
  composeForm.paperId = row.id
  composeForm.courseId = row.courseId
  composeForm.questionType = null
  composeForm.selectedQuestions = []
  composeDialogVisible.value = true

  // 加载可选试题
  await loadQuestions()

  // 加载已选试题
  await loadSelectedQuestions(row.id)
}

/**
 * 课程改变
 */
const handleCourseChange = () => {
  composeForm.questionType = null
  loadQuestions()
}

/**
 * 加载试题列表
 */
const loadQuestions = async () => {
  if (!composeForm.courseId) return

  try {
    const res = await getQuestionByCourse(composeForm.courseId)
    if (res.code === 200) {
      let questions = res.data || []

      // 如果选择了题型，进行筛选
      if (composeForm.questionType) {
        questions = questions.filter((q) => q.questionType === composeForm.questionType)
      }

      availableQuestions.value = questions.map((q) => ({
        id: q.id,
        title: q.title,
        score: q.score,
        questionType: q.questionType
      }))
    }
  } catch (error) {
    ElMessage.error('加载试题列表失败')
    console.error(error)
  }
}

/**
 * 加载已选试题
 */
const loadSelectedQuestions = async (paperId) => {
  try {
    const res = await getQuestionByPaper(paperId)
    if (res.code === 200) {
      const selectedIds = (res.data || []).map((q) => q.id)
      composeForm.selectedQuestions = selectedIds
      console.log('已选试题ID:', selectedIds)
    }
  } catch (error) {
    console.error('加载已选试题失败:', error)
  }
}

/**
 * 组卷提交
 */
const handleComposeSubmit = async () => {
  if (composeForm.selectedQuestions.length === 0) {
    ElMessage.warning('请至少选择一道试题')
    return
  }

  try {
    // 先清空试卷原有试题，避免重复
    await clearPaperQuestions(composeForm.paperId)

    // 再添加新选择的试题
    const res = await addQuestionsToPaper({
      paperId: composeForm.paperId,
      questionIds: composeForm.selectedQuestions
    })

    if (res.code === 200) {
      ElMessage.success('组卷成功')
      composeDialogVisible.value = false
      await loadPaperList()
    }
  } catch (error) {
    ElMessage.error('组卷失败')
    console.error(error)
  }
}

/**
 * 组卷对话框关闭
 */
const handleComposeClose = () => {
  composeForm.paperId = null
  composeForm.courseId = null
  composeForm.questionType = null
  composeForm.selectedQuestions = []
  availableQuestions.value = []
}

/**
 * 参加考试
 */
const handleTakeExam = (row) => {
  router.push(`/exam/take/${row.id}`)
}
</script>

<style scoped>
.paper-list {
  padding: 20px;
}

.search-card,
.action-card {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
