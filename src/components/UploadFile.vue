<!-- 文件上传组件 -->
<template>
  <div class="upload-container">
    <el-upload
      ref="uploadRef"
      :action="uploadUrl"
      :headers="headers"
      :data="uploadData"
      :multiple="multiple"
      :limit="limit"
      :file-list="fileList"
      :accept="accept"
      :auto-upload="autoUpload"
      :on-preview="handlePreview"
      :on-remove="handleRemove"
      :on-success="handleSuccess"
      :on-error="handleError"
      :on-exceed="handleExceed"
      :before-upload="beforeUpload"
    >
      <template #trigger>
        <el-button type="primary">
          <el-icon><Upload /></el-icon>
          选择文件
        </el-button>
      </template>
      <template v-if="!autoUpload" #tip>
        <el-button style="margin-left: 10px" type="success" @click="submitUpload">
          上传到服务器
        </el-button>
      </template>
      <template #tip>
        <div class="el-upload__tip">
          {{ tip || `支持上传 ${accept} 格式，单个文件不超过 ${maxSize}MB` }}
        </div>
      </template>
    </el-upload>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { getToken } from '@/utils/storage'

const props = defineProps({
  // 上传地址
  action: {
    type: String,
    default: '/api/upload'
  },
  // 附加数据
  data: {
    type: Object,
    default: () => ({})
  },
  // 是否支持多选
  multiple: {
    type: Boolean,
    default: false
  },
  // 最大上传数量
  limit: {
    type: Number,
    default: 5
  },
  // 文件列表
  modelValue: {
    type: Array,
    default: () => []
  },
  // 接受的文件类型
  accept: {
    type: String,
    default: '*'
  },
  // 是否自动上传
  autoUpload: {
    type: Boolean,
    default: true
  },
  // 文件大小限制(MB)
  maxSize: {
    type: Number,
    default: 10
  },
  // 提示文本
  tip: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'success', 'error'])

const uploadRef = ref(null)

const uploadUrl = computed(() => {
  return import.meta.env.VITE_APP_BASE_API + props.action
})

const headers = computed(() => {
  return {
    Authorization: `Bearer ${getToken()}`
  }
})

const uploadData = computed(() => props.data)

const fileList = computed({
  get() {
    return props.modelValue
  },
  set(val) {
    emit('update:modelValue', val)
  }
})

const handlePreview = (file) => {
  console.log('Preview file:', file)
  // 可以实现文件预览功能
}

const handleRemove = (file, files) => {
  fileList.value = files
}

const handleSuccess = (response, file, files) => {
  ElMessage.success('上传成功')
  fileList.value = files
  emit('success', response, file, files)
}

const handleError = (error, file, files) => {
  ElMessage.error('上传失败')
  emit('error', error, file, files)
}

const handleExceed = () => {
  ElMessage.warning(`最多只能上传 ${props.limit} 个文件`)
}

const beforeUpload = (file) => {
  const isLt = file.size / 1024 / 1024 < props.maxSize
  if (!isLt) {
    ElMessage.error(`文件大小不能超过 ${props.maxSize}MB`)
    return false
  }
  return true
}

const submitUpload = () => {
  uploadRef.value.submit()
}
</script>

<style scoped>
.upload-container {
  width: 100%;
}
</style>
