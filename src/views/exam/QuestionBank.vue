<template>
  <div class="question-bank">
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm">
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
            <el-option
              v-for="item in questionTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="难度">
          <el-select
            v-model="searchForm.difficulty"
            placeholder="请选择难度"
            clearable
            style="width: 120px"
          >
            <el-option
              v-for="item in difficultyOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
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

    <el-card class="action-card">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增题目
      </el-button>
      <el-button type="danger" :disabled="!selectedIds.length" @click="handleBatchDelete">
        <el-icon><Delete /></el-icon>
        批量删除
      </el-button>
    </el-card>

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
        <el-table-column prop="courseName" label="课程" width="150" show-overflow-tooltip />
        <el-table-column prop="questionType" label="题型" width="100">
          <template #default="{ row }">
            {{ getQuestionTypeLabel(row.questionType) }}
          </template>
        </el-table-column>
        <el-table-column prop="difficulty" label="难度" width="100">
          <template #default="{ row }">
            <el-tag :type="getDifficultyType(row.difficulty)">
              {{ getDifficultyLabel(row.difficulty) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="score" label="分值" width="80" />
        <el-table-column prop="creatorName" label="创建人" width="120" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
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
          @size-change="loadQuestionList"
          @current-change="loadQuestionList"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Search, Refresh } from '@element-plus/icons-vue'
import { getQuestionPage, deleteQuestion, deleteQuestionBatch } from '@/api/exam'
import { getCourseList } from '@/api/course'

const router = useRouter()

const loading = ref(false)
const selectedIds = ref([])
const courseList = ref([])

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

const tableData = ref([])

// 题型选项
const questionTypeOptions = [
  { label: '单选题', value: 1 },
  { label: '多选题', value: 2 },
  { label: '判断题', value: 3 },
  { label: '填空题', value: 4 },
  { label: '简答题', value: 5 }
]

// 难度选项
const difficultyOptions = [
  { label: '简单', value: 1 },
  { label: '中等', value: 2 },
  { label: '困难', value: 3 }
]

onMounted(async () => {
  await loadCourseList()
  await loadQuestionList()
})

/**
 * 加载课程列表
 */
const loadCourseList = async () => {
  try {
    const res = await getCourseList({ status: 1 })
    if (res.code === 200) {
      courseList.value = res.data || []
    }
  } catch (error) {
    console.error('加载课程列表失败:', error)
  }
}

/**
 * 加载试题列表
 */
const loadQuestionList = async () => {
  try {
    loading.value = true
    const res = await getQuestionPage({
      ...searchForm,
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize
    })
    if (res.code === 200) {
      tableData.value = res.data?.list || res.data?.records || []
      pagination.total = res.data?.total || 0
    }
  } catch (error) {
    ElMessage.error('加载试题列表失败')
    console.error('Load question list failed:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.pageNum = 1
  loadQuestionList()
}

const handleReset = () => {
  Object.assign(searchForm, {
    courseId: null,
    questionType: null,
    difficulty: null,
    title: ''
  })
  handleSearch()
}

const handleSelectionChange = (selection) => {
  selectedIds.value = selection.map((item) => item.id)
}

/**
 * 新增试题
 */
const handleAdd = () => {
  router.push('/exam/question/add')
}

/**
 * 编辑试题
 */
const handleEdit = (row) => {
  router.push(`/exam/question/edit/${row.id}`)
}

/**
 * 删除试题
 */
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定删除该试题吗？', '提示', {
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
      console.error('Delete question failed:', error)
    }
  }
}

/**
 * 批量删除试题
 */
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${selectedIds.value.length} 个试题吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const res = await deleteQuestionBatch(selectedIds.value)
    if (res.code === 200) {
      ElMessage.success('批量删除成功')
      await loadQuestionList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败')
      console.error('Batch delete failed:', error)
    }
  }
}

/**
 * 获取题型标签
 */
const getQuestionTypeLabel = (type) => {
  return questionTypeOptions.find((t) => t.value === type)?.label || type
}

/**
 * 获取难度标签
 */
const getDifficultyLabel = (difficulty) => {
  return difficultyOptions.find((d) => d.value === difficulty)?.label || difficulty
}

/**
 * 获取难度类型
 */
const getDifficultyType = (difficulty) => {
  const types = { 1: 'success', 2: 'warning', 3: 'danger' }
  return types[difficulty] || 'info'
}
</script>

<style scoped>
.question-bank {
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
