<template>
  <div class="course-detail">
    <el-card v-loading="loading" class="neon-card">
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
        <el-descriptions-item label="开课时间">{{ course.startTime }}</el-descriptions-item>
        <el-descriptions-item label="结课时间">{{ course.endTime }}</el-descriptions-item>
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
    <el-card v-if="isTeacher || isAdmin" class="mt-20 neon-card">
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
    <el-card v-if="isTeacher || isAdmin" class="mt-20 neon-card">
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
  --el-text-color-primary: #e9fbff;
  --el-text-color-regular: #e9fbff;
  --el-text-color-secondary: rgba(233, 251, 255, 0.78);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
  color: #e7f6ff;
  letter-spacing: 0.6px;
  text-shadow: 0 0 8px rgba(0, 229, 255, 0.35);
}

.header-actions {
  display: flex;
  gap: 10px;
}

.description,
.content {
  padding: 15px;
  background: rgba(6, 16, 34, 0.85);
  border: 1px solid rgba(0, 229, 255, 0.25);
  border-radius: 4px;
  line-height: 1.8;
  color: #e9fbff;
  box-shadow: inset 0 0 12px rgba(0, 229, 255, 0.08);
}

.mt-20 {
  margin-top: 20px;
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
  background: linear-gradient(90deg, rgba(0, 229, 255, 0.1), transparent);
}

:deep(.el-descriptions) {
  --el-descriptions-table-border: 1px solid rgba(0, 229, 255, 0.2);
  --el-descriptions-item-bordered-label-background: rgba(8, 20, 40, 0.9);
  --el-descriptions-item-bordered-content-background: rgba(10, 26, 48, 0.8);
}

:deep(.el-descriptions__label) {
  color: #e9fbff;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-shadow: 0 0 8px rgba(0, 229, 255, 0.25);
}

:deep(.el-descriptions__content) {
  color: #f5fbff;
  text-shadow: 0 0 6px rgba(0, 229, 255, 0.2);
}

:deep(.el-descriptions__cell.el-descriptions__content.is-bordered-content) {
  color: #f5fbff;
}

:deep(.el-descriptions__cell) {
  background-color: rgba(6, 16, 34, 0.95);
}

:deep(.el-descriptions__label.is-bordered-label) {
  background-color: rgba(6, 16, 34, 0.98);
}

:deep(.el-descriptions__content.is-bordered-content) {
  background-color: rgba(9, 24, 44, 0.9);
}

:deep(.el-divider__text) {
  background: rgba(6, 16, 34, 0.95);
  padding: 0 10px;
  border-radius: 4px;
  border: 1px solid rgba(0, 229, 255, 0.2);
}

:deep(.el-divider__text) {
  color: #7de7ff;
  text-shadow: 0 0 8px rgba(0, 229, 255, 0.35);
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

:deep(.el-table__inner-wrapper),
:deep(.el-table__body-wrapper),
:deep(.el-table__header-wrapper) {
  background: rgba(8, 20, 40, 0.75);
}

:deep(.el-table th.el-table__cell) {
  color: #bfefff;
  font-weight: 600;
  background: rgba(8, 20, 40, 0.9);
}

:deep(.el-table__cell) {
  border-bottom: 1px solid rgba(0, 229, 255, 0.12);
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

:deep(.el-progress-bar__inner) {
  background: linear-gradient(90deg, #00e5ff, #bd00ff);
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.5);
}

:deep(.el-progress-bar__outer) {
  background-color: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

:deep(.el-empty__description) {
  color: rgba(231, 246, 255, 0.55);
}
</style>
