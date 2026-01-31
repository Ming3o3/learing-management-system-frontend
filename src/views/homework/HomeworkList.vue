<template>
  <div class="homework-list">
    <el-card class="search-card neon-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="课程">
          <el-select
            v-model="searchForm.courseId"
            placeholder="请选择课程"
            clearable
            class="course-select"
          >
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

    <el-card class="neon-card">
      <el-table v-loading="loading" :data="tableData" border class="neon-table">
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
import { getMyEnrollments } from '@/api/course'

const router = useRouter()
const loading = ref(false)
const myCourses = ref([])

const searchForm = reactive({
  courseId: null,
})

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0,
})

const tableData = ref([])

onMounted(async () => {
  await loadMyCourses()
  await loadHomeworkList()
})

const loadMyCourses = async () => {
  try {
    const res = await getMyEnrollments()
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
      pageSize: pagination.pageSize,
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

.neon-card {
  background: rgba(20, 35, 70, 0.75);
  border: 1px solid rgba(0, 229, 255, 0.4);
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.35),
    0 0 15px rgba(0, 255, 255, 0.2);
  backdrop-filter: blur(12px);
}

:deep(.el-card__header) {
  border-bottom: 1px solid rgba(0, 255, 255, 0.2);
  color: #e7f6ff;
  font-weight: 600;
  background: linear-gradient(90deg, rgba(0, 229, 255, 0.1), transparent);
}

:deep(.el-form-item__label) {
  color: #b9dcff;
}

:deep(.el-input__wrapper),
:deep(.el-select__wrapper) {
  background: rgba(10, 20, 40, 0.7);
  border: 1px solid rgba(0, 229, 255, 0.25);
  box-shadow: 0 0 0 1px rgba(0, 229, 255, 0.08);
}

:deep(.el-input__inner),
:deep(.el-select__placeholder),
:deep(.el-select__selected-item) {
  color: #e9fbff;
}

:deep(.el-select-dropdown__wrap) {
  background: rgba(8, 20, 40, 0.98);
  border: 1px solid rgba(0, 229, 255, 0.25);
}

:deep(.el-select-dropdown__item) {
  color: #b9dcff;
}

:deep(.el-select-dropdown__item.is-hovering) {
  background: rgba(0, 229, 255, 0.12);
  color: #e9fbff;
}

:deep(.el-select-dropdown__item.is-selected) {
  background: rgba(0, 229, 255, 0.2);
  color: #7de7ff;
  font-weight: 600;
}

:deep(.el-table) {
  --el-table-border-color: rgba(0, 229, 255, 0.15);
  --el-table-header-bg-color: rgba(8, 20, 40, 0.9);
  --el-table-row-hover-bg-color: rgba(0, 229, 255, 0.08);
  --el-table-bg-color: rgba(8, 20, 40, 0.75);
  --el-table-tr-bg-color: rgba(8, 20, 40, 0.75);
  --el-table-row-striped-bg-color: rgba(10, 26, 48, 0.85);
  background-color: transparent;
  color: #e9fbff;
}

:deep(.el-table th.el-table__cell) {
  color: #bfefff;
  font-weight: 600;
  background: rgba(8, 20, 40, 0.9);
}

:deep(.el-table__cell) {
  border-bottom: 1px solid rgba(0, 229, 255, 0.12);
}

:deep(.el-table__inner-wrapper),
:deep(.el-table__body-wrapper),
:deep(.el-table__header-wrapper) {
  background: rgba(8, 20, 40, 0.75);
}

:deep(.el-table__body tr),
:deep(.el-table__body td.el-table__cell),
:deep(.el-table__header tr),
:deep(.el-table__header th.el-table__cell) {
  background-color: rgba(8, 20, 40, 0.75);
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped),
:deep(.el-table--striped .el-table__body tr.el-table__row--striped > td.el-table__cell) {
  background-color: rgba(10, 26, 48, 0.85) !important;
}

:deep(.el-tag) {
  border-radius: 6px;
  border: 1px solid rgba(0, 229, 255, 0.45);
  background: rgba(0, 229, 255, 0.12);
  color: #8fefff;
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.25);
}

:deep(.el-tag--success) {
  border-color: rgba(0, 255, 180, 0.45);
  background: rgba(0, 255, 180, 0.12);
  color: #7dffcf;
  box-shadow: 0 0 10px rgba(0, 255, 180, 0.25);
}

:deep(.el-tag--warning) {
  border-color: rgba(255, 204, 102, 0.65);
  background: rgba(255, 204, 102, 0.12);
  color: #ffd37a;
  box-shadow: 0 0 10px rgba(255, 204, 102, 0.35);
}

:deep(.el-tag--info) {
  border-color: rgba(120, 160, 255, 0.5);
  background: rgba(120, 160, 255, 0.12);
  color: #b6ccff;
  box-shadow: 0 0 10px rgba(120, 160, 255, 0.28);
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-pagination) {
  --el-pagination-button-bg-color: rgba(8, 20, 40, 0.8);
  --el-pagination-hover-color: #8fefff;
  --el-pagination-text-color: #cfe9ff;
}

:deep(.el-pagination__total),
:deep(.el-pagination__sizes),
:deep(.el-pagination__jump) {
  color: #cfe9ff;
}

:deep(.el-pagination .btn-prev),
:deep(.el-pagination .btn-next) {
  background: rgba(8, 20, 40, 0.8);
  color: #9edbff;
  border: 1px solid rgba(0, 229, 255, 0.2);
}

:deep(.el-pagination .btn-prev:hover),
:deep(.el-pagination .btn-next:hover) {
  color: #8fefff;
  border-color: rgba(0, 229, 255, 0.5);
}

:deep(.el-pager li) {
  background: rgba(8, 20, 40, 0.8);
  color: #cfe9ff;
  border: 1px solid rgba(0, 229, 255, 0.2);
}

:deep(.el-pager li.is-active) {
  background: rgba(0, 229, 255, 0.2);
  color: #8fefff;
  border-color: rgba(0, 229, 255, 0.6);
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.35);
}

:deep(.course-select) {
  width: 240px;
}
</style>
