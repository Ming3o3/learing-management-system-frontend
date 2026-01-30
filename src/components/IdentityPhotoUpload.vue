<template>
  <div class="identity-photo-upload">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><User /></el-icon>
          <span>考生身份验证</span>
        </div>
      </template>

      <!-- 说明信息 -->
      <el-alert
        title="身份验证说明"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      >
        <div class="alert-content">
          <p>为确保考试公平，请上传本人清晰的正面照片用于AI人脸识别：</p>
          <ul>
            <li>✅ 照片必须为本人正面免冠照</li>
            <li>✅ 光线充足，五官清晰可见</li>
            <li>✅ 不佩戴口罩、墨镜等遮挡物</li>
            <li>✅ 支持 JPG、PNG 格式，建议不超过 5MB</li>
            <li>⚠️ 考试过程中将实时验证您的身份</li>
          </ul>
        </div>
      </el-alert>

      <!-- 已注册状态 -->
      <div v-if="proctorStore.isIdentityRegistered" class="registered-status">
        <el-result icon="success" title="身份验证已完成" sub-title="您已成功上传身份照片">
          <template #extra>
            <div class="photo-preview">
              <img v-if="proctorStore.identityPhotoUrl" :src="proctorStore.identityPhotoUrl" alt="身份照片" />
            </div>
            <el-button type="primary" @click="handleStartExam">开始考试</el-button>
            <el-button @click="handleReupload">重新上传</el-button>
          </template>
        </el-result>
      </div>

      <!-- 未注册状态 -->
      <div v-else class="upload-area">
        <!-- 照片预览 -->
        <div v-if="photoPreview" class="photo-preview-container">
          <div class="photo-preview">
            <img :src="photoPreview" alt="照片预览" />
            <div class="preview-mask">
              <el-button type="danger" circle @click="handleRemovePhoto">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
          <p class="preview-tip">照片预览</p>
        </div>

        <!-- 上传区域 -->
        <el-upload
          v-else
          ref="uploadRef"
          class="upload-component"
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handleFileChange"
          accept="image/jpeg,image/jpg,image/png"
          drag
        >
          <el-icon class="upload-icon"><Upload /></el-icon>
          <div class="upload-text">
            <p>将照片拖到此处，或<em>点击上传</em></p>
            <p class="upload-tip">支持 JPG、PNG 格式，建议不超过 5MB</p>
          </div>
        </el-upload>

        <!-- 拍照选项 -->
        <div class="camera-option">
          <el-divider>或</el-divider>
          <el-button type="primary" plain @click="handleOpenCamera">
            <el-icon><Camera /></el-icon>
            使用摄像头拍照
          </el-button>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons" v-if="photoPreview">
          <el-button
            type="primary"
            size="large"
            :loading="proctorStore.identityRegistering"
            @click="handleSubmit"
          >
            <el-icon v-if="!proctorStore.identityRegistering"><Check /></el-icon>
            {{ proctorStore.identityRegistering ? '验证中...' : '确认并开始考试' }}
          </el-button>
          <el-button size="large" @click="handleCancel">取消</el-button>
        </div>
      </div>
    </el-card>

    <!-- 摄像头拍照对话框 -->
    <el-dialog
      v-model="cameraDialogVisible"
      title="拍摄身份照片"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="camera-container">
        <video
          v-if="!capturedPhoto"
          ref="videoRef"
          class="camera-video"
          autoplay
          playsinline
        ></video>
        <img v-else :src="capturedPhoto" class="captured-photo" alt="拍摄照片" />

        <div class="camera-controls">
          <el-button v-if="!capturedPhoto" type="primary" @click="handleCapture">
            <el-icon><Camera /></el-icon>
            拍照
          </el-button>
          <template v-else>
            <el-button type="success" @click="handleConfirmPhoto">
              <el-icon><Check /></el-icon>
              使用此照片
            </el-button>
            <el-button @click="handleRetakePhoto">
              <el-icon><RefreshRight /></el-icon>
              重新拍摄
            </el-button>
          </template>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  User,
  Upload,
  Camera,
  Delete,
  Check,
  RefreshRight,
} from '@element-plus/icons-vue'
import { useProctorStore } from '@/stores/proctor'

// ========== Props & Emits ==========
const props = defineProps({
  examId: {
    type: Number,
    required: true,
  },
  studentId: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['success', 'cancel'])

// ========== Store ==========
const proctorStore = useProctorStore()

// ========== State ==========
const uploadRef = ref(null)
const photoPreview = ref('')
const selectedFile = ref(null)

// 摄像头相关
const cameraDialogVisible = ref(false)
const videoRef = ref(null)
const capturedPhoto = ref('')
const cameraStream = ref(null)

// ========== Computed ==========

// ========== Methods ==========

/**
 * 处理文件选择
 */
function handleFileChange(file) {
  const isImage = /^image\/(jpeg|jpg|png)$/.test(file.raw.type)
  const isLt5M = file.raw.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传 JPG/PNG 格式的图片!')
    return
  }

  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB!')
    return
  }

  // 验证图片尺寸
  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      if (img.width < 200 || img.height < 200) {
        ElMessage.error('图片尺寸过小，请上传至少 200x200 像素的照片')
        return
      }

      // 验证通过，显示预览
      photoPreview.value = e.target.result
      selectedFile.value = file.raw
      proctorStore.setIdentityPhoto(file.raw)
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file.raw)
}

/**
 * 移除照片
 */
function handleRemovePhoto() {
  ElMessageBox.confirm('确定要删除这张照片吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      photoPreview.value = ''
      selectedFile.value = null
      proctorStore.setIdentityPhoto(null)
      if (uploadRef.value) {
        uploadRef.value.clearFiles()
      }
    })
    .catch(() => {})
}

/**
 * 打开摄像头
 */
async function handleOpenCamera() {
  cameraDialogVisible.value = true
  capturedPhoto.value = ''

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user',
      },
    })

    cameraStream.value = stream

    // 等待 DOM 更新
    setTimeout(() => {
      if (videoRef.value) {
        videoRef.value.srcObject = stream
      }
    }, 100)
  } catch (error) {
    console.error('摄像头启动失败:', error)
    ElMessage.error('无法访问摄像头，请检查权限设置')
    cameraDialogVisible.value = false
  }
}

/**
 * 拍照
 */
function handleCapture() {
  if (!videoRef.value) return

  const canvas = document.createElement('canvas')
  canvas.width = videoRef.value.videoWidth
  canvas.height = videoRef.value.videoHeight

  const ctx = canvas.getContext('2d')
  ctx.drawImage(videoRef.value, 0, 0, canvas.width, canvas.height)

  capturedPhoto.value = canvas.toDataURL('image/jpeg', 0.9)
}

/**
 * 重新拍摄
 */
function handleRetakePhoto() {
  capturedPhoto.value = ''
}

/**
 * 确认使用拍摄的照片
 */
function handleConfirmPhoto() {
  // 将 base64 转换为 File 对象
  fetch(capturedPhoto.value)
    .then((res) => res.blob())
    .then((blob) => {
      const file = new File([blob], `identity_${Date.now()}.jpg`, {
        type: 'image/jpeg',
      })

      photoPreview.value = capturedPhoto.value
      selectedFile.value = file
      proctorStore.setIdentityPhoto(file)

      // 关闭摄像头
      stopCamera()
      cameraDialogVisible.value = false

      ElMessage.success('照片已选择')
    })
}

/**
 * 停止摄像头
 */
function stopCamera() {
  if (cameraStream.value) {
    cameraStream.value.getTracks().forEach((track) => track.stop())
    cameraStream.value = null
  }
}

/**
 * 提交身份验证
 */
async function handleSubmit() {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择照片')
    return
  }

  try {
    const success = await proctorStore.registerIdentity(props.examId, props.studentId)
    if (success) {
      ElMessage.success('身份验证成功！')
      emit('success')
    } else {
      ElMessage.error('身份验证失败，请重试')
    }
  } catch (error) {
    console.error('身份验证失败:', error)
    ElMessage.error(error.message || '身份验证失败，请重试')
  }
}

/**
 * 开始考试
 */
function handleStartExam() {
  emit('success')
}

/**
 * 重新上传
 */
async function handleReupload() {
  try {
    await ElMessageBox.confirm(
      '重新上传将删除之前的身份照片，确定要继续吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await proctorStore.deleteIdentity(props.examId, props.studentId)
    ElMessage.success('已清除旧照片，请重新上传')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

/**
 * 取消
 */
function handleCancel() {
  emit('cancel')
}

// ========== Lifecycle ==========

onMounted(async () => {
  // 检查是否已注册身份
  await proctorStore.fetchIdentityInfo(props.examId, props.studentId)
})

onUnmounted(() => {
  stopCamera()
  // 清理预览 URL
  if (photoPreview.value && photoPreview.value.startsWith('blob:')) {
    URL.revokeObjectURL(photoPreview.value)
  }
})
</script>

<style scoped lang="scss">
.identity-photo-upload {
  max-width: 800px;
  margin: 0 auto;

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 600;
  }

  .alert-content {
    p {
      margin: 0 0 8px 0;
      font-weight: 500;
    }

    ul {
      margin: 8px 0 0 0;
      padding-left: 20px;

      li {
        margin: 4px 0;
        color: #606266;
      }
    }
  }

  .registered-status {
    .photo-preview {
      width: 200px;
      height: 200px;
      margin: 0 auto 20px;
      border-radius: 8px;
      overflow: hidden;
      border: 2px solid #67c23a;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
  }

  .upload-area {
    .photo-preview-container {
      text-align: center;
      margin-bottom: 20px;

      .photo-preview {
        position: relative;
        width: 300px;
        height: 300px;
        margin: 0 auto 12px;
        border-radius: 8px;
        overflow: hidden;
        border: 2px dashed #dcdfe6;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .preview-mask {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s;

          &:hover {
            opacity: 1;
          }
        }
      }

      .preview-tip {
        color: #909399;
        font-size: 14px;
      }
    }

    .upload-component {
      :deep(.el-upload) {
        width: 100%;
      }

      :deep(.el-upload-dragger) {
        width: 100%;
        padding: 60px 20px;
      }

      .upload-icon {
        font-size: 67px;
        color: #409eff;
        margin-bottom: 16px;
      }

      .upload-text {
        p {
          margin: 8px 0;
          color: #606266;

          em {
            color: #409eff;
            font-style: normal;
          }
        }

        .upload-tip {
          font-size: 12px;
          color: #909399;
        }
      }
    }

    .camera-option {
      text-align: center;
      margin: 20px 0;
    }

    .action-buttons {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-top: 20px;
    }
  }

  .camera-container {
    .camera-video,
    .captured-photo {
      width: 100%;
      max-height: 400px;
      border-radius: 8px;
      background: #000;
    }

    .camera-controls {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-top: 20px;
    }
  }
}
</style>
