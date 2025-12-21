<template>
  <div class="question-list">
    <!-- 搜索栏 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" @submit.prevent="handleSearch">
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
        <el-form-item label="题型">
          <el-select
            v-model="searchForm.questionType"
            placeholder="请选择题型"
            clearable
            style="width: 150px"
          >
            <el-option label="单选题" :value="1" />
            <el-option label="多选题" :value="2" />
            <el-option label="判断题" :value="3" />
            <el-option label="填空题" :value="4" />
            <el-option label="简答题" :value="5" />
          </el-select>
        </el-form-item>
        <el-form-item label="难度">
          <el-select
            v-model="searchForm.difficulty"
            placeholder="请选择难度"
            clearable
            style="width: 120px"
          >
            <el-option label="简单" :value="1" />
            <el-option label="中等" :value="2" />
            <el-option label="困难" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键字">
          <el-input
            v-model="searchForm.title"
            placeholder="请输入题目关键字"
            clearable
            style="width: 200px"
          />
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
        新增试题
      </el-button>
      <el-button
        type="danger"
        :disabled="selectedIds.length === 0"
        @click="handleBatchDelete"
      >
        <el-icon><Delete /></el-icon>
        批量删除
      </el-button>
    </el-card>

    <!-- 数据表格 -->
    <el-card>
      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="题目" min-width="300" show-overflow-tooltip />
        <el-table-column prop="courseName" label="课程" width="150" />
        <el-table-column prop="questionTypeDesc" label="题型" width="100" />
        <el-table-column prop="difficultyDesc" label="难度" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.difficulty === 1" type="success">简单</el-tag>
            <el-tag v-else-if="row.difficulty === 2" type="warning">中等</el-tag>
            <el-tag v-else type="danger">困难</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="score" label="分值" width="80" />
        <el-table-column prop="teacherName" label="创建人" width="120" />
        <el-table-column label="操作" width="200" fixed="right" v-if="isTeacher || isAdmin">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleView(row)">查看</el-button>
            <el-button type="warning" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
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
          @size-change="loadQuestionList"
          @current-change="loadQuestionList"
        />
      </div>
    </el-card>

    <!-- 查看对话框 -->
    <el-dialog v-model="viewDialogVisible" title="试题详情" width="700px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="题目">{{ currentQuestion.title }}</el-descriptions-item>
        <el-descriptions-item label="课程">{{ currentQuestion.courseName }}</el-descriptions-item>
        <el-descriptions-item label="题型">
          {{ currentQuestion.questionTypeDesc }}
        </el-descriptions-item>
        <el-descriptions-item label="难度">
          {{ currentQuestion.difficultyDesc }}
        </el-descriptions-item>
        <el-descriptions-item label="分值">{{ currentQuestion.score }}</el-descriptions-item>
        <el-descriptions-item label="选项" v-if="currentQuestion.options">
          <div v-for="(value, key) in parseOptions(currentQuestion.options)" :key="key">
            {{ key }}: {{ value }}
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="答案">{{ currentQuestion.answer }}</el-descriptions-item>
        <el-descriptions-item label="解析">
          {{ currentQuestion.analysis || '无' }}
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="viewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, Delete } from '@element-plus/icons-vue'
import { getQuestionPage, deleteQuestion, deleteQuestionBatch } from '@/api/exam'
import { getCourseList } from '@/api/course'

const router = useRouter()
const userStore = useUserStore()

const isTeacher = computed(() => userStore.isTeacher)
const isAdmin = computed(() => userStore.isAdmin)

const loading = ref(false)
const courseList = ref([])
const tableData = ref([])
const selectedIds = ref([])

const searchForm = reactive({
  courseId: null,
  questionType: null,
  difficulty: null,
  title: ''
})

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

const viewDialogVisible = ref(false)
const currentQuestion = ref({})

onMounted(async () => {
  await loadCourseList()
  await loadQuestionList()
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
 * 加载试题列表
 */
const loadQuestionList = async () => {
  loading.value = true
  try {
    const params = {
      ...searchForm,
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize
    }
    // 如果是教师角色，只查询自己创建的试题
    if (isTeacher.value) {
      params.teacherId = userStore.userInfo.id
    }
    const res = await getQuestionPage(params)
    if (res.code === 200) {
      tableData.value = res.data.list || []
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    ElMessage.error('加载试题列表失败')
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
  loadQuestionList()
}

/**
 * 重置
 */
const handleReset = () => {
  searchForm.courseId = null
  searchForm.questionType = null
  searchForm.difficulty = null
  searchForm.title = ''
  handleSearch()
}

/**
 * 新增
 */
const handleAdd = () => {
  router.push('/exam/question/add')
}

/**
 * 查看
 */
const handleView = (row) => {
  currentQuestion.value = row
  viewDialogVisible.value = true
}

/**
 * 编辑
 */
const handleEdit = (row) => {
  router.push(`/exam/question/edit/${row.id}`)
}

/**
 * 删除
 */
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该试题吗？此操作不可恢复', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const res = await deleteQuestion(row.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      await loadQuestionList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }
}

/**
 * 选择改变
 */
const handleSelectionChange = (selection) => {
  selectedIds.value = selection.map((item) => item.id)
}

/**
 * 批量删除
 */
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 道试题吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const res = await deleteQuestionBatch(selectedIds.value)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      await loadQuestionList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }
}

/**
 * 解析选项
 */
const parseOptions = (options) => {
  try {
    return JSON.parse(options)
  } catch (error) {
    return {}
  }
}
</script>

<style scoped>
.question-list {
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
