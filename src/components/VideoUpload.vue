<template>
  <div class="video-upload-component">
    <el-upload
      ref="uploadRef"
      class="video-uploader"
      :action="uploadAction"
      :auto-upload="false"
      :show-file-list="true"
      :on-change="handleFileChange"
      :before-upload="beforeUpload"
      :http-request="customUpload"
      :accept="acceptTypes"
      drag
    >
      <div class="upload-area">
        <el-icon class="upload-icon"><VideoCamera /></el-icon>
        <div class="upload-text">
          <p class="title">拖拽视频文件到这里或点击上传</p>
          <p class="hint">支持 MP4, AVI, MOV 等常见视频格式，文件大小不超过 2GB</p>
        </div>
      </div>
    </el-upload>

    <!-- 上传进度 -->
    <div v-if="uploading" class="upload-progress">
      <el-progress :percentage="uploadProgress" :status="uploadStatus" :stroke-width="12">
        <template #default="{ percentage }">
          <span class="progress-text">{{ percentage }}%</span>
        </template>
      </el-progress>
      <p class="progress-hint">{{ progressHint }}</p>
    </div>

    <!-- 视频信息表单 -->
    <el-form
      v-if="selectedFile"
      :model="videoForm"
      :rules="rules"
      ref="formRef"
      label-width="100px"
      class="video-form"
    >
      <el-form-item label="视频标题" prop="title">
        <el-input
          v-model="videoForm.title"
          placeholder="请输入视频标题"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="视频描述" prop="description">
        <el-input
          v-model="videoForm.description"
          type="textarea"
          :rows="4"
          placeholder="请输入视频描述"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="排序号" prop="sortOrder">
        <el-input-number v-model="videoForm.sortOrder" :min="0" :max="9999" placeholder="排序号" />
      </el-form-item>

      <el-form-item label="发布状态" prop="status">
        <el-radio-group v-model="videoForm.status">
          <el-radio :label="0">保存为草稿</el-radio>
          <el-radio :label="1">立即发布</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" :loading="uploading" @click="handleSubmit">
          <el-icon><Upload /></el-icon>
          {{ uploading ? '上传中...' : '开始上传' }}
        </el-button>
        <el-button @click="handleCancel">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { VideoCamera, Upload } from '@element-plus/icons-vue'
import { uploadVideo, confirmVideoUpload } from '@/api/content'
import axios from 'axios'

const props = defineProps({
  courseId: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['success', 'cancel'])

const uploadRef = ref(null)
const formRef = ref(null)
const selectedFile = ref(null)
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadStatus = ref('success')
const progressHint = ref('')

const videoForm = reactive({
  title: '',
  description: '',
  sortOrder: 0,
  status: 0,
})

const rules = {
  title: [{ required: true, message: '请输入视频标题', trigger: 'blur' }],
}

const uploadAction = computed(() => '')
const acceptTypes = 'video/*'

/**
 * 文件选择变化
 */
const handleFileChange = (file) => {
  selectedFile.value = file
  // 自动填充标题（去除扩展名）
  if (!videoForm.title) {
    const fileName = file.name
    const lastDot = fileName.lastIndexOf('.')
    videoForm.title = lastDot > 0 ? fileName.substring(0, lastDot) : fileName
  }
}

/**
 * 上传前校验
 */
const beforeUpload = (file) => {
  const isVideo = file.type.startsWith('video/')
  if (!isVideo) {
    ElMessage.error('只能上传视频文件！')
    return false
  }

  const maxSize = 2 * 1024 * 1024 * 1024 // 2GB
  if (file.size > maxSize) {
    ElMessage.error('视频文件大小不能超过 2GB！')
    return false
  }

  return true
}

/**
 * 自定义上传逻辑
 */
const customUpload = async (options) => {
  const { file } = options

  try {
    uploading.value = true
    uploadProgress.value = 0
    uploadStatus.value = 'success'
    progressHint.value = '正在上传视频文件...'

    // 创建 FormData
    const formData = new FormData()
    formData.append('file', file)
    formData.append('courseId', props.courseId)
    formData.append('title', videoForm.title)
    formData.append('description', videoForm.description || '')
    formData.append('sortOrder', videoForm.sortOrder)
    formData.append('status', videoForm.status)

    // 上传文件
    const res = await uploadVideo(formData, (progressEvent) => {
      uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
    })

    if (res.code === 200) {
      uploadStatus.value = 'success'
      progressHint.value = '视频上传成功！'

      const contentId = res.data

      ElMessage.success({
        message: '视频上传成功！',
        duration: 2000,
      })

      // 自动触发HLS转换
      try {
        progressHint.value = '正在转换为HLS格式，请稍后...'
        await confirmVideoUpload(contentId)

        ElMessage.success({
          message: '视频正在转换中，转换完成后即可播放',
          duration: 3000,
        })
      } catch (error) {
        console.warn('触发HLS转换失败:', error)
        ElMessage.warning('视频已上传，但转换启动失败，请手动刷新页面后重试')
      }

      // 通知父组件
      emit('success', contentId)

      // 重置表单
      setTimeout(() => {
        resetForm()
      }, 2000)
    } else {
      throw new Error(res.message || '上传失败')
    }
  } catch (error) {
    console.error('视频上传失败:', error)
    uploadStatus.value = 'exception'
    progressHint.value = '上传失败: ' + (error.message || '未知错误')
    ElMessage.error('视频上传失败: ' + (error.message || '未知错误'))
  } finally {
    uploading.value = false
  }
}

/**
 * 提交上传
 */
const handleSubmit = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择视频文件')
    return
  }

  // 验证表单
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) {
    return
  }

  // 触发上传
  uploadRef.value.submit()
}

/**
 * 取消上传
 */
const handleCancel = () => {
  resetForm()
  emit('cancel')
}

/**
 * 重置表单
 */
const resetForm = () => {
  selectedFile.value = null
  uploadProgress.value = 0
  uploading.value = false
  videoForm.title = ''
  videoForm.description = ''
  videoForm.sortOrder = 0
  videoForm.status = 0
  uploadRef.value?.clearFiles()
}

defineExpose({
  resetForm,
})
</script>

<style scoped lang="scss">
.video-upload-component {
  padding: 20px;
}

.video-uploader {
  :deep(.el-upload) {
    width: 100%;
  }

  :deep(.el-upload-dragger) {
    width: 100%;
    height: 200px;
    background: rgba(10, 24, 52, 0.6);
    border: 2px dashed rgba(72, 156, 255, 0.5);
    border-radius: 12px;
    transition: all 0.3s;

    &:hover {
      border-color: #409eff;
      background: rgba(20, 40, 80, 0.7);
    }
  }

  :deep(.el-upload-list__item-name) {
    color: #e7f6ff !important;
  }

  :deep(.el-icon--close) {
    color: #96c2f5 !important;
  }
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
}

.upload-icon {
  font-size: 80px;
  color: #409eff;
  margin-bottom: 20px;
}

.upload-text {
  text-align: center;

  .title {
    font-size: 16px;
    color: #e7f6ff;
    margin-bottom: 10px;
  }

  .hint {
    font-size: 13px;
    color: #96c2f5;
  }
}

.upload-progress {
  margin: 30px 0;
  padding: 20px;
  background: rgba(10, 24, 52, 0.5);
  border-radius: 8px;
  border: 1px solid rgba(72, 156, 255, 0.3);
}

.progress-text {
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
}

.progress-hint {
  text-align: center;
  margin-top: 10px;
  font-size: 13px;
  color: #b9dcff;
}

.video-form {
  margin-top: 30px;
  padding: 20px;
  background: rgba(10, 24, 52, 0.4);
  border-radius: 8px;
  border: 1px solid rgba(72, 156, 255, 0.2);

  :deep(.el-form-item__label) {
    color: #cfe9ff;
  }

  :deep(.el-input__wrapper) {
    background: rgba(10, 24, 52, 0.7) !important;
    border-color: rgba(72, 156, 255, 0.35);
    box-shadow: 0 0 0 1px rgba(72, 156, 255, 0.35) inset;

    &:hover {
      box-shadow: 0 0 0 1px rgba(72, 156, 255, 0.5) inset;
    }
  }

  :deep(.el-input__inner) {
    background: transparent !important;
    color: #dbeaff;

    &::placeholder {
      color: rgba(191, 219, 255, 0.6);
    }
  }

  :deep(.el-textarea__inner) {
    background: rgba(10, 24, 52, 0.7) !important;
    border-color: rgba(72, 156, 255, 0.35);
    color: #dbeaff;

    &::placeholder {
      color: rgba(191, 219, 255, 0.6);
    }
  }

  :deep(.el-input-number) {
    .el-input__wrapper {
      background: rgba(10, 24, 52, 0.7) !important;
    }
  }

  :deep(.el-radio__label) {
    color: #cfe9ff;
  }

  :deep(.el-radio__input.is-checked .el-radio__inner) {
    background-color: #409eff;
    border-color: #409eff;
  }

  :deep(.el-input__count) {
    background: transparent !important;
    color: #96c2f5 !important;
  }

  :deep(.el-textarea__count) {
    background: transparent !important;
    color: #96c2f5 !important;
  }
}

:deep(.el-progress__text) {
  color: #409eff !important;
}
</style>
