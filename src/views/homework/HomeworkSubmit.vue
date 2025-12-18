<template>
  <div class="homework-submit">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>提交作业 - {{ homework.title }}</span>
        </div>
      </template>

      <el-alert
        v-if="isOverdue"
        title="作业已过截止时间"
        type="warning"
        :closable="false"
        show-icon
        class="alert"
      />

      <el-form ref="submitFormRef" :model="submitForm" :rules="formRules" label-width="100px">
        <el-form-item label="作业内容" prop="content">
          <el-input
            v-model="submitForm.content"
            type="textarea"
            :rows="10"
            placeholder="请输入作业内容"
          />
        </el-form-item>

        <el-form-item label="附件上传">
          <UploadFile
            v-model="submitForm.files"
            :limit="5"
            accept=".doc,.docx,.pdf,.txt,.zip"
            :max-size="20"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
            {{ submitLoading ? '提交中...' : '提交作业' }}
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { getHomeworkById, submitHomework } from '@/api/homework'
import { required } from '@/utils/validate'
import UploadFile from '@/components/UploadFile.vue'

const router = useRouter()
const route = useRoute()

const submitFormRef = ref(null)
const submitLoading = ref(false)
const homework = ref({})

const submitForm = reactive({
  content: '',
  files: []
})

const formRules = {
  content: [required]
}

const isOverdue = computed(() => {
  if (!homework.value.deadline) return false
  return new Date(homework.value.deadline) < new Date()
})

onMounted(async () => {
  await loadHomeworkDetail()
})

const loadHomeworkDetail = async () => {
  try {
    const res = await getHomeworkById(route.params.id)
    homework.value = res.data
  } catch (error) {
    console.error('Load homework detail failed:', error)
    ElMessage.error('加载作业详情失败')
    router.back()
  }
}

const handleSubmit = async () => {
  try {
    await submitFormRef.value.validate()

    if (isOverdue.value) {
      await ElMessageBox.confirm('作业已过截止时间，确定要提交吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
    }

    submitLoading.value = true

    const formData = {
      homeworkId: route.params.id,
      content: submitForm.content,
      fileIds: submitForm.files.map(f => f.id)
    }

    await submitHomework(formData)

    ElMessage.success('提交成功')
    router.push('/homework')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Submit homework failed:', error)
    }
  } finally {
    submitLoading.value = false
  }
}

const handleCancel = () => {
  router.back()
}
</script>

<style scoped>
.homework-submit {
  padding: 20px;
}

.card-header {
  font-size: 18px;
  font-weight: 600;
}

.alert {
  margin-bottom: 20px;
}
</style>
