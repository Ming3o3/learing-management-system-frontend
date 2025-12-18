<template>
  <div class="course-list">
    <!-- 搜索栏 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" @submit.prevent="handleSearch">
        <el-form-item label="课程名称">
          <el-input v-model="searchForm.courseName" placeholder="请输入课程名称" clearable />
        </el-form-item>
        <el-form-item label="课程状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
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
    <el-card v-if="isTeacher || isAdmin" class="action-card">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增课程
      </el-button>
    </el-card>

    <!-- 数据表格 -->
    <el-card>
      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="courseName" label="课程名称" min-width="180" />
        <el-table-column prop="teacherName" label="授课教师" width="120" />
        <el-table-column prop="credit" label="学分" width="80" />
        <el-table-column prop="maxStudents" label="人数上限" width="100" />
        <el-table-column prop="enrolledCount" label="已报名" width="100">
          <template #default="{ row }">
            <el-tag :type="row.enrolledCount >= row.maxStudents ? 'danger' : 'success'">
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
        <el-table-column prop="startDate" label="开课时间" width="120" />
        <el-table-column prop="endDate" label="结课时间" width="120" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleView(row)">查看</el-button>
            <template v-if="isStudent">
              <el-button
                v-if="!row.isEnrolled"
                type="success"
                size="small"
                :disabled="row.enrolledCount >= row.maxStudents || row.status !== 1"
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
import { getCourseList, deleteCourse, enrollCourse } from '@/api/course'

const router = useRouter()
const userStore = useUserStore()

const isAdmin = computed(() => userStore.isAdmin)
const isTeacher = computed(() => userStore.isTeacher)
const isStudent = computed(() => userStore.isStudent)

const loading = ref(false)

const searchForm = reactive({
  courseName: '',
  status: null
})

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
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
      pageSize: pagination.pageSize
    }
    const res = await getCourseList(params)
    tableData.value = res.data.list
    pagination.total = res.data.total
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
    status: null
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
      type: 'warning'
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
      type: 'info'
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

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
