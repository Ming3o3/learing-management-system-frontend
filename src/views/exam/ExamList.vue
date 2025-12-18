<template>
  <div class="exam-list">
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
        <el-table-column prop="examTitle" label="考试标题" min-width="200" />
        <el-table-column prop="duration" label="时长(分钟)" width="100" />
        <el-table-column prop="startTime" label="开始时间" width="180" />
        <el-table-column prop="endTime" label="结束时间" width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.examStatus === 0" type="info">未开始</el-tag>
            <el-tag v-else-if="row.examStatus === 1" type="success">进行中</el-tag>
            <el-tag v-else type="warning">已结束</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="score" label="成绩" width="100">
          <template #default="{ row }">
            {{ row.score !== null ? row.score : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button
              v-if="row.examStatus === 1 && !row.hasSubmitted"
              type="primary"
              size="small"
              @click="handleTakeExam(row)"
            >
              参加考试
            </el-button>
            <el-button v-else type="info" size="small" @click="handleView(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          layout="total, prev, pager, next"
          @current-change="loadExamList"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getExamList } from '@/api/exam'
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
  await loadExamList()
})

const loadMyCourses = async () => {
  try {
    const res = await getMyCourses()
    myCourses.value = res.data
  } catch (error) {
    console.error('Load courses failed:', error)
  }
}

const loadExamList = async () => {
  try {
    loading.value = true
    const res = await getExamList({
      ...searchForm,
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize
    })
    tableData.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    console.error('Load exam list failed:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.pageNum = 1
  loadExamList()
}

const handleReset = () => {
  searchForm.courseId = null
  handleSearch()
}

const handleView = (row) => {
  router.push(`/exams/${row.id}`)
}

const handleTakeExam = (row) => {
  router.push(`/exams/${row.id}/take`)
}
</script>

<style scoped>
.exam-list {
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
