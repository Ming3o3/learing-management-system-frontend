<template>
  <div class="exam-form">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ isEdit ? '编辑试卷' : '创建试卷' }}</span>
        </div>
      </template>

      <el-form ref="examFormRef" :model="examForm" :rules="formRules" label-width="120px">
        <el-form-item label="试卷标题" prop="title">
          <el-input v-model="examForm.title" placeholder="请输入试卷标题" />
        </el-form-item>

        <el-form-item label="所属课程" prop="courseId">
          <el-select v-model="examForm.courseId" placeholder="请选择课程" filterable>
            <el-option
              v-for="course in courses"
              :key="course.id"
              :label="course.courseName"
              :value="course.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="考试时长" prop="duration">
          <el-input-number v-model="examForm.duration" :min="10" :max="180" />
          <span class="tip">分钟</span>
        </el-form-item>

        <el-form-item label="总分" prop="totalScore">
          <el-input-number v-model="examForm.totalScore" :min="10" :max="200" />
          <span class="tip">分</span>
        </el-form-item>

        <el-form-item label="及格分数" prop="passingScore">
          <el-input-number v-model="examForm.passingScore" :min="0" :max="examForm.totalScore" />
          <span class="tip">分</span>
        </el-form-item>

        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker
            v-model="examForm.startTime"
            type="datetime"
            placeholder="选择开始时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>

        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker
            v-model="examForm.endTime"
            type="datetime"
            placeholder="选择结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>

        <el-form-item label="试卷说明">
          <el-input
            v-model="examForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入试卷说明（可选）"
          />
        </el-form-item>

        <el-divider content-position="left">试题设置</el-divider>

        <el-button type="primary" @click="handleAddQuestion">
          <el-icon><Plus /></el-icon>
          添加试题
        </el-button>

        <div v-if="examForm.questions.length" class="questions-list">
          <div v-for="(question, index) in examForm.questions" :key="index" class="question-item">
            <div class="question-header">
              <span class="question-number">第 {{ index + 1 }} 题</span>
              <el-button type="danger" size="small" text @click="handleRemoveQuestion(index)">
                删除
              </el-button>
            </div>
            <el-form-item label="题目类型">
              <el-select v-model="question.type" placeholder="请选择题目类型">
                <el-option label="单选题" value="SINGLE_CHOICE" />
                <el-option label="多选题" value="MULTIPLE_CHOICE" />
                <el-option label="判断题" value="TRUE_FALSE" />
                <el-option label="填空题" value="FILL_BLANK" />
                <el-option label="简答题" value="SHORT_ANSWER" />
              </el-select>
            </el-form-item>
            <el-form-item label="题目内容">
              <el-input v-model="question.content" type="textarea" :rows="2" />
            </el-form-item>
            <el-form-item label="分值">
              <el-input-number v-model="question.score" :min="1" :max="50" />
            </el-form-item>
            <el-form-item v-if="question.type !== 'SHORT_ANSWER' && question.type !== 'FILL_BLANK'" label="选项">
              <div class="options">
                <div v-for="(option, optIndex) in question.options" :key="optIndex" class="option-item">
                  <el-input v-model="option.content" placeholder="选项内容" />
                  <el-checkbox v-model="option.isCorrect">正确答案</el-checkbox>
                  <el-button type="danger" size="small" text @click="removeOption(question, optIndex)">
                    删除
                  </el-button>
                </div>
                <el-button size="small" @click="addOption(question)">添加选项</el-button>
              </div>
            </el-form-item>
            <el-form-item v-if="question.type === 'FILL_BLANK' || question.type === 'SHORT_ANSWER'" label="参考答案">
              <el-input v-model="question.answer" type="textarea" :rows="2" />
            </el-form-item>
          </div>
        </div>

        <el-form-item>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
            {{ submitLoading ? '提交中...' : '提交' }}
          </el-button>
          <el-button @click="handleCancel">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getExamById, createExam, updateExam } from '@/api/exam'
import { getMyCourses } from '@/api/course'
import { required } from '@/utils/validate'

const router = useRouter()
const route = useRoute()

const examFormRef = ref(null)
const submitLoading = ref(false)
const courses = ref([])

const isEdit = computed(() => !!route.params.id)

const examForm = reactive({
  title: '',
  courseId: null,
  duration: 60,
  totalScore: 100,
  passingScore: 60,
  startTime: '',
  endTime: '',
  description: '',
  questions: []
})

const formRules = {
  title: [required],
  courseId: [required],
  duration: [required],
  totalScore: [required],
  passingScore: [required],
  startTime: [required],
  endTime: [required]
}

onMounted(async () => {
  await loadCourses()
  if (isEdit.value) {
    await loadExamDetail()
  }
})

const loadCourses = async () => {
  try {
    const res = await getMyCourses()
    courses.value = res.data
  } catch (error) {
    console.error('Load courses failed:', error)
  }
}

const loadExamDetail = async () => {
  try {
    const res = await getExamById(route.params.id)
    Object.assign(examForm, res.data)
  } catch (error) {
    console.error('Load exam detail failed:', error)
  }
}

const handleAddQuestion = () => {
  examForm.questions.push({
    type: 'SINGLE_CHOICE',
    content: '',
    score: 5,
    options: [
      { content: '', isCorrect: false },
      { content: '', isCorrect: false }
    ],
    answer: ''
  })
}

const handleRemoveQuestion = (index) => {
  examForm.questions.splice(index, 1)
}

const addOption = (question) => {
  question.options.push({ content: '', isCorrect: false })
}

const removeOption = (question, index) => {
  if (question.options.length > 2) {
    question.options.splice(index, 1)
  } else {
    ElMessage.warning('至少保留两个选项')
  }
}

const handleSubmit = async () => {
  try {
    await examFormRef.value.validate()

    if (!examForm.questions.length) {
      ElMessage.warning('请至少添加一道试题')
      return
    }

    submitLoading.value = true

    if (isEdit.value) {
      await updateExam(route.params.id, examForm)
      ElMessage.success('更新成功')
    } else {
      await createExam(examForm)
      ElMessage.success('创建成功')
    }

    router.push('/exams')
  } catch (error) {
    console.error('Submit exam failed:', error)
  } finally {
    submitLoading.value = false
  }
}

const handleCancel = () => {
  router.back()
}
</script>

<style scoped>
.exam-form {
  padding: 20px;
}

.card-header {
  font-size: 18px;
  font-weight: 600;
}

.tip {
  margin-left: 10px;
  color: #909399;
}

.questions-list {
  margin: 20px 0;
}

.question-item {
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #f5f7fa;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.question-number {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.options {
  width: 100%;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.option-item .el-input {
  flex: 1;
}
</style>
