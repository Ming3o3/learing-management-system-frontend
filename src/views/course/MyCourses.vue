<template>
  <div class="my-courses">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的课程</span>
        </div>
      </template>

      <el-empty v-if="!courses.length" description="暂无课程" />

      <el-row v-else :gutter="20">
        <el-col v-for="course in courses" :key="course.id" :span="8">
          <el-card class="course-card" shadow="hover" @click="handleViewCourse(course)">
            <div class="course-header">
              <h3 class="course-title">{{ course.courseName }}</h3>
              <el-tag v-if="course.status === 0" type="info">草稿</el-tag>
              <el-tag v-else-if="course.status === 1" type="success">进行中</el-tag>
              <el-tag v-else type="warning">已结课</el-tag>
            </div>

            <div class="course-info">
              <p>
                <el-icon><User /></el-icon>
                授课教师：{{ course.teacherName }}
              </p>
              <p>
                <el-icon><Calendar /></el-icon>
                {{ course.startTime }} ~ {{ course.endTime }}
              </p>
              <p>
                <el-icon><TrophyBase /></el-icon>
                学分：{{ course.credit }}
              </p>
            </div>

            <el-divider />

            <div class="course-progress">
              <div class="progress-label">
                <span>学习进度</span>
                <span>{{ course.progress || 0 }}%</span>
              </div>
              <el-progress :percentage="course.progress || 0" :stroke-width="8" />
            </div>

            <div class="course-actions">
              <el-button type="primary" size="small" @click.stop="handleContinueLearn(course)">
                继续学习
              </el-button>
              <el-button size="small" @click.stop="handleViewHomework(course)">作业</el-button>
              <el-button size="small" @click.stop="handleViewExam(course)">考试</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMyCourses } from '@/api/course'

const router = useRouter()
const courses = ref([])

onMounted(() => {
  loadMyCourses()
})

const loadMyCourses = async () => {
  try {
    const res = await getMyCourses()
    courses.value = res.data
  } catch (error) {
    console.error('Load my courses failed:', error)
  }
}

const handleViewCourse = (course) => {
  router.push(`/courses/${course.id}`)
}

const handleContinueLearn = (course) => {
  router.push(`/courses/${course.id}/learn`)
}

const handleViewHomework = (course) => {
  router.push(`/homework?courseId=${course.id}`)
}

const handleViewExam = (course) => {
  router.push(`/exams?courseId=${course.id}`)
}
</script>

<style scoped>
.my-courses {
  padding: 20px;
}

.card-header {
  font-size: 18px;
  font-weight: 600;
}

.course-card {
  margin-bottom: 20px;
  cursor: pointer;
  transition: transform 0.3s;
}

.course-card:hover {
  transform: translateY(-5px);
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.course-title {
  margin: 0;
  font-size: 18px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 10px;
}

.course-info {
  font-size: 14px;
  color: #606266;
}

.course-info p {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 8px 0;
}

.course-progress {
  margin: 15px 0;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
}

.course-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}
</style>
