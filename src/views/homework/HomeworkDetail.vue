<template>
  <div class="homework-detail">
    <el-card v-loading="loading" class="neon-card">
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
      <div
        v-if="homework.submitContent"
        class="content"
        v-html="renderContent(homework.submitContent)"
      ></div>

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
  color: #e7f6ff;
  letter-spacing: 0.6px;
  text-shadow: 0 0 8px rgba(0, 229, 255, 0.35);
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
  background: rgba(6, 16, 34, 0.85);
  border: 1px solid rgba(0, 229, 255, 0.25);
  border-radius: 4px;
  line-height: 1.8;
  color: #e9fbff;
  box-shadow: inset 0 0 12px rgba(0, 229, 255, 0.08);
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
  border: 1px solid rgba(0, 229, 255, 0.25);
  border-radius: 4px;
  background: rgba(8, 20, 40, 0.7);
}

.filename {
  flex: 1;
  color: #cfe9ff;
}

.actions {
  margin-top: 30px;
  text-align: center;
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
  color: #7de7ff;
  text-shadow: 0 0 8px rgba(0, 229, 255, 0.35);
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
</style>
