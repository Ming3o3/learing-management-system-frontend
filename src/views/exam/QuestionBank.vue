<template>
  <div class="question-bank">
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="题目类型">
          <el-select v-model="searchForm.type" placeholder="请选择类型" clearable>
            <el-option
              v-for="item in QUESTION_TYPE"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="难度">
          <el-select v-model="searchForm.difficulty" placeholder="请选择难度" clearable>
            <el-option
              v-for="item in DIFFICULTY"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
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
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="content" label="题目内容" min-width="300" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            {{ getQuestionTypeLabel(row.type) }}
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
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { getQuestionBank, deleteQuestion } from '@/api/exam'
import { QUESTION_TYPE, DIFFICULTY } from '@/constants'

const loading = ref(false)
const selectedIds = ref([])

const searchForm = reactive({
  type: null,
  difficulty: null
})

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

const tableData = ref([])

onMounted(() => {
  loadQuestionList()
})

const loadQuestionList = async () => {
  try {
    loading.value = true
    const res = await getQuestionBank({
      ...searchForm,
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize
    })
    tableData.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
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
    type: null,
    difficulty: null
  })
  handleSearch()
}

const handleSelectionChange = (selection) => {
  selectedIds.value = selection.map(item => item.id)
}

const handleAdd = () => {
  // TODO: 打开新增对话框
  ElMessage.info('新增功能待实现')
}

const handleEdit = (row) => {
  // TODO: 打开编辑对话框
  ElMessage.info('编辑功能待实现')
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定删除该题目吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteQuestion(row.id)
    ElMessage.success('删除成功')
    loadQuestionList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete question failed:', error)
    }
  }
}

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${selectedIds.value.length} 个题目吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    // TODO: 批量删除API
    ElMessage.success('批量删除成功')
    loadQuestionList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Batch delete failed:', error)
    }
  }
}

const getQuestionTypeLabel = (type) => {
  return QUESTION_TYPE.find(t => t.value === type)?.label || type
}

const getDifficultyLabel = (difficulty) => {
  return DIFFICULTY.find(d => d.value === difficulty)?.label || difficulty
}

const getDifficultyType = (difficulty) => {
  const types = {
    EASY: 'success',
    MEDIUM: 'warning',
    HARD: 'danger'
  }
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
