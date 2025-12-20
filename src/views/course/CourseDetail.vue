<template>
  <div class="course-detail">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>{{ course.courseName }}</span>
          <div class="header-actions">
            <el-button v-if="isTeacher || isAdmin" type="primary" @click="handleEdit">
              编辑课程
            </el-button>
            <el-button @click="handleBack">返回</el-button>
          </div>
        </div>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="授课教师">{{ course.teacherName }}</el-descriptions-item>
        <el-descriptions-item label="学分">{{ course.credit }}</el-descriptions-item>
        <el-descriptions-item label="已报名人数">
          <el-tag type="success">
            {{ course.enrolledCount || 0 }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="开课时间">{{ course.startDate }}</el-descriptions-item>
        <el-descriptions-item label="结课时间">{{ course.endDate }}</el-descriptions-item>
        <el-descriptions-item label="课程状态">
          <el-tag v-if="course.status === 0" type="info">草稿</el-tag>
          <el-tag v-else-if="course.status === 1" type="success">已发布</el-tag>
          <el-tag v-else type="warning">已归档</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ course.createTime }}</el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">课程简介</el-divider>
      <div class="description">{{ course.description }}</div>

      <el-divider content-position="left">课程内容</el-divider>
      <div class="content" v-html="renderContent"></div>
    </el-card>

    <!-- 课程资源 -->
    <el-card v-if="isTeacher || isAdmin" class="mt-20">
      <template #header>
        <div class="card-header">
          <span>课程资源</span>
          <el-button type="primary" size="small" @click="handleUploadResource">
            上传资源
          </el-button>
        </div>
      </template>

      <el-empty v-if="!resources.length" description="暂无课程资源" />
      <el-table v-else :data="resources" border>
        <el-table-column prop="fileName" label="文件名" min-width="180" />
        <el-table-column prop="fileSize" label="文件大小" width="120">
          <template #default="{ row }">{{ formatFileSize(row.fileSize) }}</template>
        </el-table-column>
        <el-table-column prop="uploadTime" label="上传时间" width="180" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleDownload(row)">下载</el-button>
            <el-button type="danger" size="small" @click="handleDeleteResource(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 学生列表 -->
    <el-card v-if="isTeacher || isAdmin" class="mt-20">
      <template #header>
        <div class="card-header">
          <span>学生列表（{{ students.length }}人）</span>
        </div>
      </template>

      <el-empty v-if="!students.length" description="暂无学生" />
      <el-table v-else :data="students" border>
        <el-table-column prop="studentName" label="学生姓名" width="120" />
        <el-table-column prop="studentNumber" label="学号" width="120" />
        <el-table-column prop="enrollTime" label="报名时间" width="180" />
        <el-table-column prop="progress" label="学习进度" width="150">
          <template #default="{ row }">
            <el-progress :percentage="row.progress || 0" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="danger" size="small" @click="handleRemoveStudent(row)">
              移除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getCourseById, getCourseStudents, removeStudentFromCourse } from '@/api/course'
import { formatFileSize } from '@/utils'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const isAdmin = computed(() => userStore.isAdmin)
const isTeacher = computed(() => userStore.isTeacher)

const loading = ref(false)
const course = ref({})
const resources = ref([])
const students = ref([])

const renderContent = computed(() => {
  // TODO: 可以使用markdown-it或其他库渲染Markdown
  return course.value.content?.replace(/\n/g, '<br>')
})

onMounted(() => {
  loadCourseDetail()
})

const loadCourseDetail = async () => {
  try {
    loading.value = true
    const res = await getCourseById(route.params.id)
    course.value = res.data

    // TODO: 加载课程资源和学生列表
    loadResources()
    loadStudents()
  } catch (error) {
    console.error('Load course detail failed:', error)
    ElMessage.error('加载课程详情失败')
  } finally {
    loading.value = false
  }
}

const loadResources = async () => {
  // TODO: 调用API加载课程资源
  resources.value = []
}

const loadStudents = async () => {
  try {
    const res = await getCourseStudents(route.params.id)
    students.value = res.data || []
  } catch (error) {
    console.error('Load students failed:', error)
  }
}

const handleEdit = () => {
  router.push(`/courses/${route.params.id}/edit`)
}

const handleBack = () => {
  router.back()
}

const handleUploadResource = () => {
  ElMessage.info('上传功能待实现')
}

const handleDownload = (row) => {
  ElMessage.info('下载功能待实现')
}

const handleDeleteResource = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除资源"${row.fileName}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    ElMessage.success('删除成功')
    loadResources()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete resource failed:', error)
    }
  }
}

const handleRemoveStudent = async (row) => {
  try {
    await ElMessageBox.confirm(`确定移除学生"${row.studentName}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await removeStudentFromCourse(route.params.id, row.studentId)
    ElMessage.success('移除成功')
    loadStudents()
    loadCourseDetail() // 重新加载课程详情以更新报名人数
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Remove student failed:', error)
      ElMessage.error('移除失败')
    }
  }
}
</script>

<style scoped>
.course-detail {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.description,
.content {
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  line-height: 1.8;
  color: #606266;
}

.mt-20 {
  margin-top: 20px;
}
</style>
