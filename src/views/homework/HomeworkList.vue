<template>
  <div class="homework-list">
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="课程">
          <el-select v-model="searchForm.courseId" placeholder="请选择课程" clearable>
            <el-option
              v-for="course in myCourses"
              :key="course.id"
              :label="course.courseName"
              :value="course.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-table v-loading="loading" :data="tableData" border>
        <el-table-column prop="courseName" label="课程" width="180" />
        <el-table-column prop="title" label="作业标题" min-width="200" />
        <el-table-column prop="deadline" label="截止时间" width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.submitStatus === 0" type="warning">未提交</el-tag>
            <el-tag v-else-if="row.submitStatus === 1" type="info">已提交</el-tag>
            <el-tag v-else type="success">已批改</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="score" label="成绩" width="100">
          <template #default="{ row }">
            {{ row.score !== null ? row.score : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleView(row)">查看</el-button>
            <el-button
              v-if="row.submitStatus === 0"
              type="success"
              size="small"
              @click="handleSubmit(row)"
            >
              提交作业
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          layout="total, prev, pager, next"
          @current-change="loadHomeworkList"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getHomeworkList } from '@/api/homework'
import { getMyCourses } from '@/api/course'

const router = useRouter()
const loading = ref(false)
const myCourses = ref([])

const searchForm = reactive({
  courseId: null
})

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

const tableData = ref([])

onMounted(async () => {
  await loadMyCourses()
  await loadHomeworkList()
})

const loadMyCourses = async () => {
  try {
    const res = await getMyCourses()
    myCourses.value = res.data
  } catch (error) {
    console.error('Load courses failed:', error)
  }
}

const loadHomeworkList = async () => {
  try {
    loading.value = true
    const res = await getHomeworkList({
      ...searchForm,
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize
    })
    tableData.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    console.error('Load homework list failed:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.pageNum = 1
  loadHomeworkList()
}

const handleReset = () => {
  searchForm.courseId = null
  handleSearch()
}

const handleView = (row) => {
  router.push(`/homework/${row.id}`)
}

const handleSubmit = (row) => {
  router.push(`/homework/${row.id}/submit`)
}
</script>

<style scoped>
.homework-list {
  padding: 20px;
}

.search-card {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
