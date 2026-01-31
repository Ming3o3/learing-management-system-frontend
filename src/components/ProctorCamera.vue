<template>
  <div class="proctor-camera">
    <!-- 摄像头视频预览 -->
    <div class="camera-container" :class="{ 'camera-error': hasCameraError }">
      <video
        ref="videoElement"
        autoplay
        playsinline
        muted
        class="camera-video"
        :class="{ 'camera-hidden': !showPreview }"
      ></video>

      <!-- 隐藏的canvas用于捕获帧 -->
      <canvas ref="canvasElement" style="display: none"></canvas>

      <!-- 摄像头状态指示器 -->
      <div class="camera-status">
        <el-tag :type="statusTagType" size="small" effect="dark">
          <el-icon><component :is="statusIcon" /></el-icon>
          {{ statusText }}
        </el-tag>
      </div>

      <!-- 连接状态 -->
      <div v-if="showConnectionStatus" class="connection-status">
        <el-tag :type="connectionTagType" size="small" effect="plain">
          {{ connectionText }}
        </el-tag>
      </div>

      <!-- 错误提示 -->
      <div v-if="errorMessage" class="error-overlay">
        <el-alert :title="errorMessage" type="error" :closable="false" show-icon />
      </div>
    </div>

    <!-- 统计信息（开发模式） -->
    <div v-if="showStats" class="proctor-stats">
      <el-descriptions :column="2" size="small" border>
        <el-descriptions-item label="已发送帧数">
          {{ proctorStore.framesSent }}
        </el-descriptions-item>
        <el-descriptions-item label="违规次数">
          <el-tag :type="violationTagType" size="small">
            {{ proctorStore.violationCount }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="最后发送">
          {{ lastFrameTimeText }}
        </el-descriptions-item>
        <el-descriptions-item label="监控状态">
          <el-tag :type="proctorStore.isMonitoring ? 'success' : 'info'" size="small">
            {{ proctorStore.isMonitoring ? '监控中' : '未启动' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useProctorStore } from '@/stores/proctor'
import { VideoCamera, VideoCameraFilled, Warning, CircleCheck } from '@element-plus/icons-vue'

// ========== Props ==========
const props = defineProps({
  examId: {
    type: Number,
    required: true,
  },
  studentId: {
    type: Number,
    required: true,
  },
  showPreview: {
    type: Boolean,
    default: false,
  },
  showStats: {
    type: Boolean,
    default: false,
  },
  showConnectionStatus: {
    type: Boolean,
    default: true,
  },
  autoStart: {
    type: Boolean,
    default: true,
  },
})

// ========== Emits ==========
const emit = defineEmits([
  'ready',
  'error',
  'violation',
  'connected',
  'disconnected',
  'camera-ready',
  'camera-error',
])

// ========== Store ==========
const proctorStore = useProctorStore()

// ========== Refs ==========
const videoElement = ref(null)
const canvasElement = ref(null)
const errorMessage = ref('')
const frameIntervalId = ref(null)
const heartbeatIntervalId = ref(null)

// ========== Computed ==========
const hasCameraError = computed(() => !!proctorStore.cameraError || !!errorMessage.value)

const statusTagType = computed(() => {
  if (hasCameraError.value) return 'danger'
  if (proctorStore.isCameraReady) return 'success'
  return 'info'
})

const statusIcon = computed(() => {
  if (hasCameraError.value) return Warning
  if (proctorStore.isCameraReady) return VideoCameraFilled
  return VideoCamera
})

const statusText = computed(() => {
  if (hasCameraError.value) return '摄像头异常'
  if (proctorStore.isCameraReady) return '监控中'
  return '准备中...'
})

const connectionTagType = computed(() => {
  if (proctorStore.connectionError) return 'danger'
  if (proctorStore.isConnected) return 'success'
  return 'warning'
})

const connectionText = computed(() => {
  if (proctorStore.connectionError) return `连接错误: ${proctorStore.connectionError}`
  if (proctorStore.isConnected) return 'AI监考已连接'
  return '正在连接...'
})

const violationTagType = computed(() => {
  const count = proctorStore.violationCount
  if (count === 0) return 'success'
  if (count < 5) return 'warning'
  return 'danger'
})

const lastFrameTimeText = computed(() => {
  if (!proctorStore.lastFrameTime) return '无'
  const diff = Math.floor((new Date() - proctorStore.lastFrameTime) / 1000)
  return `${diff}秒前`
})

// ========== WebSocket相关 ==========

/**
 * 初始化WebSocket连接
 */
function initWebSocket() {
  try {
    const wsUrl = `${proctorStore.proctorConfig.websocketUrl}?exam_id=${props.examId}&student_id=${props.studentId}`
    const ws = new WebSocket(wsUrl)

    ws.onopen = handleWebSocketOpen
    ws.onmessage = handleWebSocketMessage
    ws.onerror = handleWebSocketError
    ws.onclose = handleWebSocketClose

    proctorStore.setWebSocket(ws)
  } catch (error) {
    console.error('WebSocket初始化失败:', error)
    errorMessage.value = 'AI监考服务连接失败'
    proctorStore.updateConnectionStatus(false, error.message)
    emit('error', { type: 'websocket', error })
  }
}

function handleWebSocketOpen() {
  console.log('WebSocket连接已建立')
  proctorStore.updateConnectionStatus(true)
  emit('connected')

  // 开始发送视频帧
  startFrameCapture()

  // 开始心跳检测
  startHeartbeat()
}

function handleWebSocketMessage(event) {
  try {
    const data = JSON.parse(event.data)

    // 处理不同类型的消息
    switch (data.type) {
      case 'violation':
        handleViolationAlert(data)
        break
      case 'heartbeat':
        // 心跳响应
        console.log('收到心跳响应')
        break
      case 'error':
        handleServerError(data)
        break
      default:
        console.warn('未知的消息类型:', data.type)
    }
  } catch (error) {
    console.error('解析WebSocket消息失败:', error)
  }
}

function handleWebSocketError(error) {
  console.error('WebSocket错误:', error)
  proctorStore.updateConnectionStatus(false, '连接异常')
  emit('error', { type: 'websocket', error })
}

function handleWebSocketClose(event) {
  console.log('WebSocket连接已关闭:', event.code, event.reason)
  proctorStore.updateConnectionStatus(false)
  emit('disconnected', { code: event.code, reason: event.reason })

  // 停止帧捕获
  stopFrameCapture()

  // 停止心跳
  stopHeartbeat()

  // 如果不是正常关闭，尝试重连（可选）
  if (event.code !== 1000 && proctorStore.isMonitoring) {
    setTimeout(() => {
      console.log('尝试重新连接WebSocket...')
      initWebSocket()
    }, 3000)
  }
}

/**
 * 处理违规告警
 */
function handleViolationAlert(data) {
  const violation = {
    violationType: data.violation_type,
    description: proctorStore.proctorConfig.violationTypes[data.violation_type] || '未知违规',
    severity: data.severity || 'medium',
    confidence: data.confidence,
    details: data.details,
  }

  // 添加到store
  const result = proctorStore.addViolation(violation)

  // 显示通知
  ElMessage.warning({
    message: `检测到违规行为：${violation.description}`,
    duration: 3000,
    showClose: true,
  })

  // 触发事件
  emit('violation', { ...violation, shouldForceSubmit: result.shouldForceSubmit })
}

/**
 * 处理服务器错误
 */
function handleServerError(data) {
  console.error('服务器错误:', data.message)
  errorMessage.value = data.message || 'AI监考服务异常'
}

// ========== 摄像头相关 ==========

/**
 * 初始化摄像头
 */
async function initCamera() {
  try {
    // 请求摄像头权限
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user',
      },
      audio: false,
    })

    // 设置视频源
    if (videoElement.value) {
      videoElement.value.srcObject = stream
    }

    // 更新状态
    proctorStore.updateCameraStatus(stream)
    emit('camera-ready', stream)

    console.log('摄像头初始化成功')
  } catch (error) {
    console.error('摄像头初始化失败:', error)

    let message = '无法访问摄像头'
    if (error.name === 'NotAllowedError') {
      message = '摄像头权限被拒绝，请允许访问摄像头'
    } else if (error.name === 'NotFoundError') {
      message = '未检测到摄像头设备'
    } else if (error.name === 'NotReadableError') {
      message = '摄像头正在被其他应用使用'
    }

    errorMessage.value = message
    proctorStore.updateCameraStatus(null, message)
    emit('camera-error', error)

    ElMessage.error({
      message,
      duration: 5000,
      showClose: true,
    })
  }
}

// ========== 帧捕获相关 ==========

/**
 * 开始捕获视频帧
 */
function startFrameCapture() {
  if (frameIntervalId.value) return

  const interval = proctorStore.proctorConfig.frameInterval || 1000

  frameIntervalId.value = setInterval(() => {
    captureAndSendFrame()
  }, interval)

  console.log(`开始帧捕获，间隔：${interval}ms`)
}

/**
 * 停止捕获视频帧
 */
function stopFrameCapture() {
  if (frameIntervalId.value) {
    clearInterval(frameIntervalId.value)
    frameIntervalId.value = null
    console.log('停止帧捕获')
  }
}

/**
 * 捕获并发送单帧
 */
function captureAndSendFrame() {
  if (!videoElement.value || !canvasElement.value || !proctorStore.isConnected) {
    return
  }

  try {
    const video = videoElement.value
    const canvas = canvasElement.value

    // 设置canvas尺寸
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // 绘制当前视频帧
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // 转换为Base64
    const frameData = canvas.toDataURL('image/jpeg', 0.8)

    // 发送到WebSocket
    if (proctorStore.wsInstance && proctorStore.wsInstance.readyState === WebSocket.OPEN) {
      proctorStore.wsInstance.send(
        JSON.stringify({
          type: 'frame',
          data: frameData,
          timestamp: new Date().toISOString(),
        }),
      )

      proctorStore.recordFrameSent()
    }
  } catch (error) {
    console.error('捕获帧失败:', error)
  }
}

// ========== 心跳检测 ==========

/**
 * 开始心跳检测
 */
function startHeartbeat() {
  if (heartbeatIntervalId.value) return

  heartbeatIntervalId.value = setInterval(() => {
    sendHeartbeat()
  }, 30000) // 每30秒发送一次心跳
}

/**
 * 停止心跳检测
 */
function stopHeartbeat() {
  if (heartbeatIntervalId.value) {
    clearInterval(heartbeatIntervalId.value)
    heartbeatIntervalId.value = null
  }
}

/**
 * 发送心跳
 */
function sendHeartbeat() {
  if (proctorStore.wsInstance && proctorStore.wsInstance.readyState === WebSocket.OPEN) {
    proctorStore.wsInstance.send(
      JSON.stringify({
        type: 'heartbeat',
        timestamp: new Date().toISOString(),
      }),
    )
  }
}

// ========== 公共方法（暴露给父组件） ==========

/**
 * 启动监考
 */
async function start() {
  try {
    // 初始化配置
    await proctorStore.initProctorConfig(props.examId)

    // 检查是否启用监考
    if (!proctorStore.proctorConfig.enabled) {
      console.warn('监考功能未启用')
      return
    }

    // 启动会话
    await proctorStore.startSession(props.examId, props.studentId)

    // 初始化摄像头
    await initCamera()

    // 初始化WebSocket
    initWebSocket()

    emit('ready')
  } catch (error) {
    console.error('启动监考失败:', error)
    errorMessage.value = '监考系统启动失败'
    emit('error', { type: 'startup', error })
    throw error
  }
}

/**
 * 停止监考
 */
async function stop() {
  try {
    // 停止捕获
    stopFrameCapture()
    stopHeartbeat()

    // 结束会话
    await proctorStore.endSession()

    // 清理资源
    proctorStore.cleanup()

    errorMessage.value = ''
  } catch (error) {
    console.error('停止监考失败:', error)
  }
}

// 暴露方法给父组件
defineExpose({
  start,
  stop,
})

// ========== 生命周期 ==========

onMounted(() => {
  if (props.autoStart) {
    start()
  }
})

onBeforeUnmount(() => {
  stop()
})

// ========== 监听 ==========

// 监听考试ID变化
watch(
  () => props.examId,
  (newVal, oldVal) => {
    if (newVal !== oldVal && proctorStore.isMonitoring) {
      console.log('考试ID变化，重新启动监考')
      stop().then(() => start())
    }
  },
)
</script>

<style scoped lang="scss">
.proctor-camera {
  width: 100%;
}

.camera-container {
  position: relative;
  background: #000;
  border-radius: 8px;
  overflow: hidden;

  &.camera-error {
    border: 2px solid var(--el-color-danger);
  }
}

.camera-video {
  width: 100%;
  height: auto;
  display: block;

  &.camera-hidden {
    display: none;
  }
}

.camera-status {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
}

.connection-status {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10;
}

:deep(.camera-status .el-tag),
:deep(.connection-status .el-tag) {
  font-size: 14px;
  padding: 15px;
  border-radius: 12px;
  border-width: 3px;
  color: #eaf4ff;
  box-shadow: 0 0 10px rgba(64, 158, 255, 0.35);
}

:deep(.camera-status .el-tag .el-icon),
:deep(.connection-status .el-tag .el-icon) {
  margin-right: 4px;
  font-size: 14px;
}

.error-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  z-index: 20;
}

.proctor-stats {
  margin-top: 16px;
}

:deep(.proctor-stats),
:deep(.proctor-stats .el-descriptions__label),
:deep(.proctor-stats .el-descriptions__content) {
  color: #ffffff;
}
</style>
