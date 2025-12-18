<template>
  <div class="homework-form">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ isEdit ? '编辑作业' : '发布作业' }}</span>
        </div>
      </template>

      <el-form ref="homeworkFormRef" :model="homeworkForm" :rules="formRules" label-width="120px">
        <el-form-item label="所属课程" prop="courseId">
          <el-select v-model="homeworkForm.courseId" placeholder="请选择课程" filterable>
            <el-option
              v-for="course in courses"
              :key="course.id"
              :label="course.courseName"
              :value="course.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="作业标题" prop="title">
          <el-input v-model="homeworkForm.title" placeholder="请输入作业标题" />
        </el-form-item>

        <el-form-item label="作业内容" prop="content">
          <el-input
            v-model="homeworkForm.content"
            type="textarea"
            :rows="8"
            placeholder="请输入作业内容和要求"
          />
        </el-form-item>

        <el-form-item label="截止时间" prop="deadline">
          <el-date-picker
            v-model="homeworkForm.deadline"
            type="datetime"
            placeholder="选择截止时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>

        <el-form-item label="附件">
          <UploadFile
            v-model="homeworkForm.attachments"
            :limit="5"
            accept=".doc,.docx,.pdf,.txt,.zip"
            :max-size="20"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
            {{ submitLoading ? '提交中...' : '发布' }}
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
import { getHomeworkById, createHomework, updateHomework } from '@/api/homework'
import { getMyCourses } from '@/api/course'
import { required } from '@/utils/validate'
import UploadFile from '@/components/UploadFile.vue'

const router = useRouter()
const route = useRoute()

const homeworkFormRef = ref(null)
const submitLoading = ref(false)
const courses = ref([])

const isEdit = computed(() => !!route.params.id)

const homeworkForm = reactive({
  courseId: null,
  title: '',
  content: '',
  deadline: '',
  attachments: []
})

const formRules = {
  courseId: [required],
  title: [required],
  content: [required],
  deadline: [required]
}

onMounted(async () => {
  await loadCourses()
  if (isEdit.value) {
    await loadHomeworkDetail()
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

const loadHomeworkDetail = async () => {
  try {
    const res = await getHomeworkById(route.params.id)
    Object.assign(homeworkForm, res.data)
  } catch (error) {
    console.error('Load homework detail failed:', error)
    ElMessage.error('加载作业详情失败')
    router.back()
  }
}

const handleSubmit = async () => {
  try {
    await homeworkFormRef.value.validate()
    submitLoading.value = true

    const formData = {
      ...homeworkForm,
      fileIds: homeworkForm.attachments.map(f => f.id)
    }

    if (isEdit.value) {
      await updateHomework(route.params.id, formData)
      ElMessage.success('更新成功')
    } else {
      await createHomework(formData)
      ElMessage.success('发布成功')
    }

    router.push('/homework')
  } catch (error) {
    console.error('Submit homework failed:', error)
  } finally {
    submitLoading.value = false
  }
}

const handleCancel = () => {
  router.back()
}
</script>

<style scoped>
.homework-form {
  padding: 20px;
}

.card-header {
  font-size: 18px;
  font-weight: 600;
}
</style>
