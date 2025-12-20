<template>
  <div class="paper-detail">
    <el-card v-loading="loading">
      <template #header>
        <div class="header">
          <span>试卷详情</span>
          <div>
            <el-button @click="handleBack">返回</el-button>
          </div>
        </div>
      </template>

      <!-- 基本信息 -->
      <el-descriptions :column="2" border>
        <el-descriptions-item label="试卷名称">{{ paperDetail.paperName }}</el-descriptions-item>
        <el-descriptions-item label="课程名称">{{ paperDetail.courseName }}</el-descriptions-item>
        <el-descriptions-item label="创建教师">{{ paperDetail.teacherName }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag v-if="paperDetail.status === 0" type="info">未发布</el-tag>
          <el-tag v-else-if="paperDetail.status === 1" type="success">已发布</el-tag>
          <el-tag v-else type="warning">已结束</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="总分">{{ paperDetail.totalScore }}</el-descriptions-item>
        <el-descriptions-item label="及格分">{{ paperDetail.passScore }}</el-descriptions-item>
        <el-descriptions-item label="考试时长">
          {{ paperDetail.duration }} 分钟
        </el-descriptions-item>
        <el-descriptions-item label="题目数量">
          {{ paperDetail.questionCount || 0 }}
        </el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ paperDetail.startTime }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ paperDetail.endTime }}</el-descriptions-item>
        <el-descriptions-item label="允许查看答案">
          {{ paperDetail.allowViewAnswer === 1 ? '是' : '否' }}
        </el-descriptions-item>
        <el-descriptions-item label="试卷描述" :span="2">
          {{ paperDetail.description || '无' }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 试题列表 - 仅教师和管理员可见 -->
      <template v-if="isTeacher || isAdmin">
        <el-divider content-position="left">试题列表</el-divider>

        <el-table :data="questionList" border style="margin-top: 20px">
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="title" label="题目" min-width="300" show-overflow-tooltip />
          <el-table-column prop="questionTypeDesc" label="题型" width="100" />
          <el-table-column prop="difficultyDesc" label="难度" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.difficulty === 1" type="success">简单</el-tag>
              <el-tag v-else-if="row.difficulty === 2" type="warning">中等</el-tag>
              <el-tag v-else type="danger">困难</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="score" label="分值" width="80" />
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button
                type="danger"
                size="small"
                @click="handleRemoveQuestion(row)"
                :disabled="paperDetail.status !== 0"
              >
                移除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPaperById, getQuestionByPaper, removeQuestionFromPaper } from '@/api/exam'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const isTeacher = computed(() => userStore.userInfo?.roleId === 2)
const isAdmin = computed(() => userStore.userInfo?.roleId === 1)

const loading = ref(false)
const paperDetail = reactive({
  id: null,
  paperName: '',
  courseName: '',
  teacherName: '',
  status: 0,
  totalScore: 0,
  passScore: 0,
  duration: 0,
  questionCount: 0,
  startTime: '',
  endTime: '',
  allowViewAnswer: 0,
  description: ''
})

const questionList = ref([])

onMounted(() => {
  const id = route.params.id
  if (id) {
    loadPaperDetail(id)
    loadQuestionList(id)
  }
})

/**
 * 加载试卷详情
 */
const loadPaperDetail = async (id) => {
  loading.value = true
  try {
    const res = await getPaperById(id)
    if (res.code === 200) {
      Object.assign(paperDetail, res.data)
    }
  } catch (error) {
    ElMessage.error('加载试卷详情失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

/**
 * 加载试题列表
 */
const loadQuestionList = async (paperId) => {
  try {
    const res = await getQuestionByPaper(paperId)
    if (res.code === 200) {
      questionList.value = res.data || []
    }
  } catch (error) {
    ElMessage.error('加载试题列表失败')
    console.error(error)
  }
}

/**
 * 移除试题
 */
const handleRemoveQuestion = async (row) => {
  try {
    await ElMessageBox.confirm('确定要从试卷中移除该试题吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const res = await removeQuestionFromPaper(paperDetail.id, row.id)
    if (res.code === 200) {
      ElMessage.success('移除成功')
      await loadPaperDetail(paperDetail.id)
      await loadQuestionList(paperDetail.id)
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('移除失败')
      console.error(error)
    }
  }
}

/**
 * 返回
 */
const handleBack = () => {
  router.back()
}
</script>

<style scoped>
.paper-detail {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
