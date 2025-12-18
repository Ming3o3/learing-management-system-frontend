<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <!-- 统计卡片 -->
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <el-icon class="stat-icon courses"><Reading /></el-icon>
            <div class="stat-info">
              <h3 class="stat-value">{{ stats.courses }}</h3>
              <p class="stat-label">我的课程</p>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <el-icon class="stat-icon homework"><Edit /></el-icon>
            <div class="stat-info">
              <h3 class="stat-value">{{ stats.homework }}</h3>
              <p class="stat-label">待提交作业</p>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <el-icon class="stat-icon exams"><Document /></el-icon>
            <div class="stat-info">
              <h3 class="stat-value">{{ stats.exams }}</h3>
              <p class="stat-label">待考试</p>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <el-icon class="stat-icon progress"><TrendCharts /></el-icon>
            <div class="stat-info">
              <h3 class="stat-value">{{ stats.progress }}%</h3>
              <p class="stat-label">总体进度</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt-20">
      <!-- 最近课程 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近学习</span>
              <router-link to="/courses" class="more-link">查看更多 →</router-link>
            </div>
          </template>
          <el-empty v-if="!recentCourses.length" description="暂无学习记录" />
          <div v-else class="course-list">
            <div
              v-for="course in recentCourses"
              :key="course.id"
              class="course-item"
              @click="$router.push(`/courses/${course.id}`)"
            >
              <div class="course-info">
                <h4>{{ course.courseName }}</h4>
                <p class="teacher">教师：{{ course.teacherName }}</p>
              </div>
              <el-progress :percentage="course.progress" />
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 待办事项 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>待办事项</span>
            </div>
          </template>
          <el-empty v-if="!todos.length" description="暂无待办事项" />
          <div v-else class="todo-list">
            <div v-for="todo in todos" :key="todo.id" class="todo-item">
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
import { ref, onMounted } from 'vue'

const stats = ref({
  courses: 0,
  homework: 0,
  exams: 0,
  progress: 0
})

const recentCourses = ref([])
const todos = ref([])

onMounted(() => {
  // TODO: 从API获取数据
  loadDashboardData()
})

const loadDashboardData = async () => {
  // 模拟数据
  stats.value = {
    courses: 6,
    homework: 3,
    exams: 2,
    progress: 68
  }

  recentCourses.value = [
    {
      id: 1,
      courseName: 'Web前端开发',
      teacherName: '张老师',
      progress: 75
    },
    {
      id: 2,
      courseName: 'Java程序设计',
      teacherName: '李老师',
      progress: 60
    }
  ]

  todos.value = [
    {
      id: 1,
      type: 'warning',
      label: '作业',
      title: '第三章作业',
      deadline: '2天后截止'
    },
    {
      id: 2,
      type: 'danger',
      label: '考试',
      title: '期中考试',
      deadline: '明天 14:00'
    }
  ]
}
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.stat-card {
  cursor: pointer;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  font-size: 48px;
  border-radius: 8px;
  padding: 10px;
}

.stat-icon.courses {
  background-color: #e6f7ff;
  color: #1890ff;
}

.stat-icon.homework {
  background-color: #fff7e6;
  color: #fa8c16;
}

.stat-icon.exams {
  background-color: #f6ffed;
  color: #52c41a;
}

.stat-icon.progress {
  background-color: #fff1f0;
  color: #f5222d;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  margin: 0;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin: 5px 0 0 0;
}

.mt-20 {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.more-link {
  color: #409eff;
  text-decoration: none;
  font-size: 14px;
}

.course-list,
.todo-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.course-item {
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.course-item:hover {
  border-color: #409eff;
  background-color: #f5f7fa;
}

.course-info h4 {
  margin: 0 0 5px 0;
  font-size: 16px;
  color: #303133;
}

.course-info .teacher {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #909399;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-bottom: 1px solid #ebeef5;
}

.todo-item:last-child {
  border-bottom: none;
}

.todo-title {
  flex: 1;
  font-size: 14px;
  color: #606266;
}

.todo-time {
  font-size: 12px;
  color: #909399;
}
</style>
