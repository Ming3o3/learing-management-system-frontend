<template>
  <div class="homework-detail">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>{{ homework.title }}</span>
          <el-tag v-if="homework.submitStatus === 0" type="warning">未提交</el-tag>
          <el-tag v-else-if="homework.submitStatus === 1" type="info">已提交</el-tag>
          <el-tag v-else type="success">已批改</el-tag>
        </div>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="所属课程">{{ homework.courseName }}</el-descriptions-item>
        <el-descriptions-item label="截止时间">
          <span :class="{ 'text-danger': isOverdue }">{{ homework.deadline }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="发布时间">{{ homework.createTime }}</el-descriptions-item>
        <el-descriptions-item label="提交时间">
          {{ homework.submitTime || '未提交' }}
        </el-descriptions-item>
        <el-descriptions-item v-if="homework.submitStatus === 2" label="批改时间">
          {{ homework.gradeTime }}
        </el-descriptions-item>
        <el-descriptions-item v-if="homework.submitStatus === 2" label="成绩">
          <span class="score">{{ homework.score }}</span>
        </el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">作业要求</el-divider>
      <div class="content" v-html="renderContent(homework.content)"></div>

      <el-divider v-if="homework.attachments?.length" content-position="left">附件</el-divider>
      <div v-if="homework.attachments?.length" class="attachments">
        <div v-for="file in homework.attachments" :key="file.id" class="attachment-item">
          <el-icon><Document /></el-icon>
          <span class="filename">{{ file.name }}</span>
          <el-button type="primary" size="small" text @click="handleDownload(file)">
            下载
          </el-button>
        </div>
      </div>

      <el-divider v-if="homework.submitContent" content-position="left">提交内容</el-divider>
      <div v-if="homework.submitContent" class="content" v-html="renderContent(homework.submitContent)"></div>

      <el-divider v-if="homework.comment" content-position="left">教师评语</el-divider>
      <div v-if="homework.comment" class="comment">{{ homework.comment }}</div>

      <div class="actions">
        <el-button v-if="homework.submitStatus === 0" type="primary" @click="handleSubmit">
          提交作业
        </el-button>
        <el-button @click="handleBack">返回</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getHomeworkById } from '@/api/homework'
import { formatDate } from '@/utils/date'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const homework = ref({})

const isOverdue = computed(() => {
  if (!homework.value.deadline) return false
  return new Date(homework.value.deadline) < new Date()
})

onMounted(() => {
  loadHomeworkDetail()
})

const loadHomeworkDetail = async () => {
  try {
    loading.value = true
    const res = await getHomeworkById(route.params.id)
    homework.value = res.data
  } catch (error) {
    console.error('Load homework detail failed:', error)
    ElMessage.error('加载作业详情失败')
  } finally {
    loading.value = false
  }
}

const renderContent = (content) => {
  return content?.replace(/\n/g, '<br>')
}

const handleDownload = (file) => {
  // TODO: 实现文件下载
  ElMessage.info('下载功能待实现')
}

const handleSubmit = () => {
  router.push(`/homework/${route.params.id}/submit`)
}

const handleBack = () => {
  router.back()
}
</script>

<style scoped>
.homework-detail {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
}

.text-danger {
  color: #f56c6c;
}

.score {
  font-size: 24px;
  font-weight: 600;
  color: #67c23a;
}

.content,
.comment {
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  line-height: 1.8;
  color: #606266;
}

.attachments {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.filename {
  flex: 1;
  color: #606266;
}

.actions {
  margin-top: 30px;
  text-align: center;
}
</style>
