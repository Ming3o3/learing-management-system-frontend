<template>
  <div class="course-list">
    <!-- 搜索栏 -->
    <el-card class="search-card neon-card">
      <el-form :inline="true" :model="searchForm" @submit.prevent="handleSearch">
        <el-form-item label="课程名称">
          <el-input v-model="searchForm.courseName" placeholder="请输入课程名称" clearable />
        </el-form-item>
        <el-form-item v-if="isTeacher || isAdmin" label="课程状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="草稿" :value="0" />
            <el-option label="已发布" :value="1" />
            <el-option label="已归档" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作栏 -->
    <el-card v-if="isTeacher || isAdmin" class="action-card neon-card">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增课程
      </el-button>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="neon-card">
      <el-table v-loading="loading" :data="tableData" border stripe class="neon-table">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="courseName" label="课程名称" min-width="180" />
        <el-table-column prop="teacherName" label="授课教师" width="120" />
        <el-table-column prop="credit" label="学分" width="80" />
        <el-table-column prop="enrolledCount" label="已报名" width="100">
          <template #default="{ row }">
            <el-tag type="success">
              {{ row.enrolledCount || 0 }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 0" type="info">草稿</el-tag>
            <el-tag v-else-if="row.status === 1" type="success">已发布</el-tag>
            <el-tag v-else type="warning">已归档</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="开课时间" width="120" />
        <el-table-column prop="endTime" label="结课时间" width="120" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleView(row)">查看</el-button>
            <template v-if="isStudent">
              <el-button
                v-if="!row.isEnrolled"
                type="success"
                size="small"
                :disabled="row.status !== 1"
                @click="handleEnroll(row)"
              >
                报名
              </el-button>
              <el-button v-else type="info" size="small" disabled>已报名</el-button>
            </template>
            <template v-if="isTeacher || isAdmin">
              <el-button type="warning" size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
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
          @size-change="loadCourseList"
          @current-change="loadCourseList"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getCoursePage, deleteCourse, enrollCourse } from '@/api/course'

const router = useRouter()
const userStore = useUserStore()

const isAdmin = computed(() => userStore.isAdmin)
const isTeacher = computed(() => userStore.isTeacher)
const isStudent = computed(() => userStore.isStudent)

const loading = ref(false)

const searchForm = reactive({
  courseName: '',
  status: isStudent.value ? 1 : null, // 学生默认只显示已发布的课程
})

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0,
})

const tableData = ref([])

onMounted(() => {
  loadCourseList()
})

const loadCourseList = async () => {
  try {
    loading.value = true
    const params = {
      ...searchForm,
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
    }
    // 如果是教师角色，只查询自己的课程
    if (isTeacher.value) {
      params.teacherId = userStore.userInfo.id
    }
    const res = await getCoursePage(params)
    const data = res?.data
    tableData.value = data?.list || []
    pagination.total = data?.total || 0
  } catch (error) {
    console.error('Load course list failed:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.pageNum = 1
  loadCourseList()
}

const handleReset = () => {
  Object.assign(searchForm, {
    courseName: '',
    status: isStudent.value ? 1 : null, // 学生重置时仍然只显示已发布的课程
  })
  handleSearch()
}

const handleAdd = () => {
  router.push('/courses/create')
}

const handleView = (row) => {
  router.push(`/courses/${row.id}`)
}

const handleEdit = (row) => {
  router.push(`/courses/${row.id}/edit`)
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除课程"${row.courseName}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await deleteCourse(row.id)
    ElMessage.success('删除成功')
    loadCourseList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete course failed:', error)
    }
  }
}

const handleEnroll = async (row) => {
  try {
    await ElMessageBox.confirm(`确定报名课程"${row.courseName}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
    })

    await enrollCourse(row.id)
    ElMessage.success('报名成功')
    loadCourseList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Enroll course failed:', error)
    }
  }
}
</script>

<style scoped>
.course-list {
  padding: 20px;
}

.search-card,
.action-card {
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
:deep(.el-select__placeholder) {
  color: #e9fbff;
}

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

:deep(.el-table--striped .el-table__body tr.el-table__row--striped) {
  background-color: rgba(10, 26, 48, 0.85) !important;
}

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
  color: #b9dcff;
  border: 1px solid rgba(0, 229, 255, 0.2);
}

:deep(.el-pager li.is-active) {
  background: rgba(0, 229, 255, 0.2);
  color: #8fefff;
  border-color: rgba(0, 229, 255, 0.6);
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.35);
}
</style>
