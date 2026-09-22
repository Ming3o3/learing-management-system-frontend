<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <!-- 统计卡片 -->
      <el-col :span="6">
        <el-card class="stat-card neon-card">
          <div class="stat-content">
            <el-icon class="stat-icon courses"><Reading /></el-icon>
            <div class="stat-info">
              <h3 class="stat-value">{{ stats.courses }}</h3>
              <p class="stat-label">{{ isAdmin ? '课程总数' : '我的课程' }}</p>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card neon-card">
          <div class="stat-content">
            <el-icon class="stat-icon homework"><Edit /></el-icon>
            <div class="stat-info">
              <h3 class="stat-value">{{ stats.homework }}</h3>
              <p class="stat-label">{{ isStudent ? '待提交作业' : '待处理作业' }}</p>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card neon-card">
          <div class="stat-content">
            <el-icon class="stat-icon exams"><Document /></el-icon>
            <div class="stat-info">
              <h3 class="stat-value">{{ stats.exams }}</h3>
              <p class="stat-label">{{ isStudent ? '待考试' : '考试安排' }}</p>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card neon-card">
          <div class="stat-content">
            <el-icon class="stat-icon progress"><TrendCharts /></el-icon>
            <div class="stat-info">
              <h3 class="stat-value">
                {{ stats.overviewValue
                }}<span v-if="stats.overviewSuffix">{{ stats.overviewSuffix }}</span>
              </h3>
              <p class="stat-label">{{ stats.overviewLabel }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt-20">
      <!-- 最近课程 -->
      <el-col :span="12">
        <el-card class="neon-card">
          <template #header>
            <div class="card-header">
              <span>{{ courseSectionTitle }}</span>
              <router-link to="/courses" class="more-link">查看更多 →</router-link>
            </div>
          </template>
          <el-empty v-if="!recentCourses.length" :description="courseEmptyDescription" />
          <div v-else class="course-list">
            <div
              v-for="course in recentCourses"
              :key="course.id"
              class="course-item"
              @click="$router.push(`/courses/${course.id}`)"
            >
              <div class="course-info">
                <h4>{{ course.courseName || '未命名课程' }}</h4>
                <p v-if="isStudent" class="teacher">教师：{{ course.teacherName || '暂未设置' }}</p>
                <p v-else class="teacher">
                  {{ formatCourseDateRange(course) }}
                </p>
              </div>
              <el-progress v-if="isStudent" :percentage="normalizeProgress(course.progress)" />
              <el-tag v-else :type="getCourseStatus(course.status).type" size="small">
                {{ getCourseStatus(course.status).text }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 待办事项 -->
      <el-col :span="12">
        <el-card class="neon-card">
          <template #header>
            <div class="card-header">
              <span>待办事项</span>
            </div>
          </template>
          <el-empty v-if="!todos.length" description="暂无待办事项" />
          <div v-else class="todo-list">
            <div
              v-for="todo in todos"
              :key="todo.id"
              class="todo-item"
              @click="todo.path && $router.push(todo.path)"
            >
              <el-tag :type="todo.type" size="small">{{ todo.label }}</el-tag>
              <span class="todo-title">{{ todo.title }}</span>
              <span class="todo-time">{{ todo.deadline }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { getAllCourses, getCoursesByTeacher, getMyEnrollments } from '@/api/course'
import { getHomeworkList } from '@/api/homework'
import { getPaperPage } from '@/api/exam'
import { getLearningStats } from '@/api/learning'
import { useUserStore } from '@/stores/user'

const stats = ref({
  courses: 0,
  homework: 0,
  exams: 0,
  overviewValue: 0,
  overviewLabel: '总体进度',
  overviewSuffix: '%',
})

const recentCourses = ref([])
const todos = ref([])
const userStore = useUserStore()

const isStudent = computed(() => userStore.isStudent)
const isAdmin = computed(() => userStore.isAdmin)
const overviewLabel = computed(() => {
  if (isStudent.value) return '总体进度'
  return isAdmin.value ? '已发布课程' : '进行中课程'
})
const courseSectionTitle = computed(() => {
  if (isStudent.value) return '最近学习'
  return isAdmin.value ? '课程总览' : '我的课程'
})
const courseEmptyDescription = computed(() => (isStudent.value ? '暂无学习记录' : '暂无课程'))

const normalizeProgress = (value) => {
  const progress = Number(value)
  if (!Number.isFinite(progress)) return 0
  return Math.min(100, Math.max(0, Math.round(progress)))
}

const getCourseStatus = (status) => {
  const statusMap = {
    0: { text: '草稿', type: 'info' },
    1: { text: '进行中', type: 'success' },
    2: { text: '已结课', type: 'warning' },
  }
  return statusMap[status] || { text: '状态未知', type: 'info' }
}

const formatCourseDateRange = (course) => {
  const start = course.startTime || '开课时间待定'
  const end = course.endTime || '结课时间待定'
  return `${start} ~ ${end}`
}

onMounted(() => {
  loadDashboardData()
})

const loadDashboardData = async () => {
  try {
    const student = userStore.isStudent
    const coursePromise = student
      ? getMyEnrollments()
      : userStore.isAdmin
        ? getAllCourses()
        : getCoursesByTeacher(userStore.userId)
    const requests = [
      coursePromise,
      getHomeworkList({ pageNum: 1, pageSize: 100 }),
      getPaperPage({
        status: student ? 1 : undefined,
        teacherId: !student && !userStore.isAdmin ? userStore.userId : undefined,
        pageNum: 1,
        pageSize: 100,
      }),
    ]
    if (student) requests.push(getLearningStats())
    const [courseRes, homeworkRes, examRes, learningRes] = await Promise.all(requests)
    const courses = courseRes.data || []
    const homework = homeworkRes.data?.list || []
    const exams = examRes.data?.list || []
    const pendingHomework = student
      ? homework.filter((item) => item.submitStatus === 0)
      : homework.filter((item) => (item.pendingCount || 0) > 0)

    stats.value = {
      courses: courses.length,
      homework: pendingHomework.length,
      exams: exams.length,
      overviewValue: student
        ? normalizeProgress(learningRes?.data?.averageProgress)
        : courses.filter((course) => course.status === 1).length,
      overviewLabel: overviewLabel.value,
      overviewSuffix: student ? '%' : '',
    }
    recentCourses.value = courses.slice(0, 4).map((course) => ({
      ...course,
      progress: student ? normalizeProgress(course.progress) : null,
    }))
    todos.value = [
      ...pendingHomework.slice(0, 5).map((item) => ({
        id: `homework-${item.id}`,
        type: 'warning',
        label: '作业',
        title: item.title || '未命名作业',
        deadline: item.deadline || '未设置截止时间',
        path: `/homework/${item.id}`,
      })),
      ...exams.slice(0, 5).map((item) => ({
        id: `exam-${item.id}`,
        type: 'danger',
        label: '考试',
        title: item.paperName || '未命名考试',
        deadline: item.startTime || '待安排',
        path: student ? `/exam/take/${item.id}` : `/exam/paper/detail/${item.id}`,
      })),
    ]
  } catch (error) {
    console.error('Load dashboard data failed:', error)
    stats.value = {
      courses: 0,
      homework: 0,
      exams: 0,
      overviewValue: 0,
      overviewLabel: overviewLabel.value,
      overviewSuffix: isStudent.value ? '%' : '',
    }
    recentCourses.value = []
    todos.value = []
  }
}
</script>

<style scoped>
.dashboard {
  padding: 20px;
  min-height: calc(100vh - 60px);
  background:
    radial-gradient(1200px 800px at 15% 10%, rgba(0, 200, 255, 0.12), transparent 60%),
    radial-gradient(1000px 700px at 85% 15%, rgba(130, 0, 255, 0.12), transparent 60%),
    linear-gradient(180deg, #060b1a 0%, #0b1230 100%);
  position: relative;
  overflow: hidden;
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 36px 36px;
  mask-image: radial-gradient(circle at center, rgba(0, 0, 0, 0.85), transparent 70%);
  pointer-events: none;
}

.bg-glow {
  position: absolute;
  width: 560px;
  height: 560px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 255, 255, 0.18), transparent 70%);
  filter: blur(30px);
  top: -160px;
  right: -160px;
  pointer-events: none;
}

.neon-card {
  background: rgba(20, 35, 70, 0.75); /* 提亮 */
  border: 1px solid rgba(0, 229, 255, 0.4); /* 增加亮度 */
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.35),
    0 0 15px rgba(0, 255, 255, 0.2); /* 增强光晕 */
  backdrop-filter: blur(12px);
  position: relative;
  overflow: visible;
}

/* 科技感装饰角 */
.neon-card::before {
  content: '';
  position: absolute;
  top: -1px;
  right: -1px;
  width: 15px;
  height: 15px;
  border-top: 2px solid #00e5ff;
  border-right: 2px solid #00e5ff;
  border-top-right-radius: 4px;
  box-shadow: 2px -2px 8px rgba(0, 229, 255, 0.5);
}

.neon-card::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: -1px;
  width: 15px;
  height: 15px;
  border-bottom: 2px solid #00e5ff;
  border-left: 2px solid #00e5ff;
  border-bottom-left-radius: 4px;
  box-shadow: -2px 2px 8px rgba(0, 229, 255, 0.5);
}

.stat-card {
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.stat-card:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow:
    0 15px 35px rgba(0, 0, 0, 0.5),
    0 0 25px rgba(0, 255, 255, 0.3);
  border-color: #00e5ff;
  z-index: 10;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  font-size: 48px;
  border-radius: 4px; /* 更锐利 */
  padding: 12px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
}

/* 图标光束特效 */
.stat-icon::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transform: rotate(45deg) translateX(-100%);
  animation: shimmer 3s infinite;
}

@keyframes shimmer {
  0% {
    transform: rotate(45deg) translateX(-100%);
  }
  20% {
    transform: rotate(45deg) translateX(100%);
  }
  100% {
    transform: rotate(45deg) translateX(100%);
  }
}

.stat-icon.courses {
  background-color: rgba(0, 200, 255, 0.2); /* 提亮 */
  color: #5ce7ff;
  border: 1px solid rgba(92, 231, 255, 0.3);
}

.stat-icon.homework {
  background-color: rgba(255, 160, 0, 0.2); /* 提亮 */
  color: #ffd37a;
  border: 1px solid rgba(255, 211, 122, 0.3);
}

.stat-icon.exams {
  background-color: rgba(0, 255, 178, 0.2); /* 提亮 */
  color: #7dffcf;
  border: 1px solid rgba(125, 255, 207, 0.3);
}

.stat-icon.progress {
  background-color: rgba(255, 0, 85, 0.2); /* 提亮 */
  color: #ff7aa2;
  border: 1px solid rgba(255, 122, 162, 0.3);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 36px;
  font-weight: 700;
  margin: 0;
  color: #ffffff;
  text-shadow: 0 0 15px rgba(0, 255, 255, 0.4);
  font-family: 'Segoe UI', sans-serif;
  letter-spacing: 1px;
}

.stat-label {
  font-size: 14px;
  color: #b9dcff;
  margin: 5px 0 0 0;
  font-weight: 500;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  opacity: 0.9;
}

.mt-20 {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header span {
  color: #e7f6ff;
  font-weight: 600;
  letter-spacing: 1px;
  text-shadow: 0 0 8px rgba(0, 229, 255, 0.35);
}

.more-link {
  color: #74f0ff;
  text-decoration: none;
  font-size: 14px;
  letter-spacing: 0.6px;
}

.more-link:hover {
  color: #b2f7ff;
}

.course-list,
.todo-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.course-item {
  padding: 15px;
  border: 1px solid rgba(0, 255, 255, 0.25);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  background: rgba(13, 28, 56, 0.6); /* 稍微提亮 */
  position: relative;
  overflow: hidden;
}

/* 课程卡片悬停效果 */
.course-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: #00e5ff;
  opacity: 0;
  transition: opacity 0.3s;
}

.course-item:hover {
  border-color: #00e5ff;
  background-color: rgba(13, 28, 56, 0.8);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  transform: translateX(5px);
}

.course-item:hover::before {
  opacity: 1;
}

.course-info h4 {
  margin: 0 0 5px 0;
  font-size: 16px;
  color: #e9fbff;
  text-shadow: 0 0 8px rgba(0, 229, 255, 0.3);
  letter-spacing: 0.4px;
}

.course-info .teacher {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #b9dcff;
  letter-spacing: 0.3px;
}

.todo-title {
  flex: 1;
  font-size: 14px;
  color: #e9fbff;
  letter-spacing: 0.4px;
}

.todo-time {
  font-size: 12px;
  color: #b9dcff;
  letter-spacing: 0.3px;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px;
  border-bottom: 1px solid rgba(0, 255, 255, 0.15);
  transition: background-color 0.2s;
}

/* 待办事项标签：科技风格（对齐用户管理标签风格） */
.todo-item :deep(.el-tag) {
  border-radius: 6px;
  padding: 0 8px;
  height: 22px;
  line-height: 20px;
  font-weight: 600;
  letter-spacing: 0.6px;
  border: 1px solid rgba(0, 229, 255, 0.45);
  background: rgba(0, 229, 255, 0.12);
  color: #8fefff;
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.25);
}

.todo-item :deep(.el-tag--warning) {
  border-color: rgba(255, 204, 102, 0.65);
  background: rgba(255, 204, 102, 0.12);
  color: #ffd37a;
  box-shadow: 0 0 10px rgba(255, 204, 102, 0.35);
}

.todo-item :deep(.el-tag--danger) {
  border-color: rgba(255, 90, 120, 0.65);
  background: rgba(255, 90, 120, 0.12);
  color: #ff9ab5;
  box-shadow: 0 0 10px rgba(255, 90, 120, 0.35);
}

.todo-item:hover {
  background-color: rgba(0, 229, 255, 0.05);
}

.todo-item:last-child {
  border-bottom: none;
}

:deep(.el-card__header) {
  border-bottom: 1px solid rgba(0, 255, 255, 0.2);
  color: #00e5ff;
  font-weight: 600;
  background: linear-gradient(90deg, rgba(0, 229, 255, 0.1), transparent);
}

:deep(.el-progress-bar__inner) {
  background: linear-gradient(90deg, #00e5ff, #bd00ff);
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.5);
}

:deep(.el-progress-bar__outer) {
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

:deep(.el-empty__description) {
  color: rgba(231, 246, 255, 0.55);
}
</style>
