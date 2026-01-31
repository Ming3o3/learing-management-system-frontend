<template>
  <div class="hls-video-player">
    <div class="player-container" :class="{ fullscreen: isFullscreen }">
      <video
        ref="videoElement"
        class="video-element"
        :poster="poster"
        controls
        @loadedmetadata="handleLoadedMetadata"
        @timeupdate="handleTimeUpdate"
        @ended="handleEnded"
        @error="handleError"
      ></video>

      <!-- 加载提示 -->
      <div v-if="loading" class="loading-overlay">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <p>正在加载视频...</p>
      </div>

      <!-- 错误提示 -->
      <div v-if="error" class="error-overlay">
        <el-icon class="error-icon"><Warning /></el-icon>
        <p>{{ error }}</p>
        <el-button @click="retry">重试</el-button>
      </div>

      <!-- 控制栏 -->
      <div class="player-controls">
        <el-button
          circle
          :icon="isFullscreen ? 'close-full-screen' : 'full-screen'"
          @click="toggleFullscreen"
          class="fullscreen-btn"
        />
      </div>
    </div>

    <!-- 播放信息 -->
    <div v-if="false" class="video-info" style="display: none">
      <div class="info-item">
        <span class="label">时长:</span>
        <span class="value">{{ formatDuration(videoInfo.duration) }}</span>
      </div>
      <div class="info-item">
        <span class="label">当前进度:</span>
        <span class="value"
          >{{ formatDuration(currentTime) }} / {{ formatDuration(videoInfo.duration) }}</span
        >
      </div>
      <div v-if="videoInfo.resolution" class="info-item">
        <span class="label">分辨率:</span>
        <span class="value">{{ videoInfo.resolution }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading, Warning } from '@element-plus/icons-vue'
import Hls from 'hls.js'

const props = defineProps({
  src: {
    type: String,
    required: true,
  },
  poster: {
    type: String,
    default: '',
  },
  autoplay: {
    type: Boolean,
    default: false,
  },
  videoInfo: {
    type: Object,
    default: () => null,
  },
})

const emit = defineEmits(['timeUpdate', 'ended', 'error'])

const videoElement = ref(null)
const loading = ref(true)
const error = ref('')
const currentTime = ref(0)
const isFullscreen = ref(false)
let hls = null

onMounted(() => {
  initPlayer()
})

onBeforeUnmount(() => {
  destroyPlayer()
})

watch(
  () => props.src,
  () => {
    destroyPlayer()
    initPlayer()
  },
)

/**
 * 初始化播放器
 */
const initPlayer = () => {
  if (!props.src) {
    error.value = '视频地址不能为空'
    loading.value = false
    return
  }

  const video = videoElement.value

  if (Hls.isSupported()) {
    // 使用 hls.js 播放
    hls = new Hls({
      enableWorker: true,
      lowLatencyMode: false,
      backBufferLength: 90,
    })

    hls.loadSource(props.src)
    hls.attachMedia(video)

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      loading.value = false
      if (props.autoplay) {
        video.play().catch((err) => {
          console.warn('自动播放失败:', err)
        })
      }
    })

    hls.on(Hls.Events.ERROR, (event, data) => {
      console.error('HLS Error:', data)
      if (data.fatal) {
        handleHlsError(data)
      }
    })
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    // iOS Safari 原生支持 HLS
    video.src = props.src
    video.addEventListener('loadedmetadata', () => {
      loading.value = false
      if (props.autoplay) {
        video.play().catch((err) => {
          console.warn('自动播放失败:', err)
        })
      }
    })
  } else {
    error.value = '您的浏览器不支持HLS视频播放'
    loading.value = false
  }
}

/**
 * 销毁播放器
 */
const destroyPlayer = () => {
  if (hls) {
    hls.destroy()
    hls = null
  }
}

/**
 * 处理HLS错误
 */
const handleHlsError = (data) => {
  switch (data.type) {
    case Hls.ErrorTypes.NETWORK_ERROR:
      error.value = '网络错误，请检查网络连接'
      hls.startLoad()
      break
    case Hls.ErrorTypes.MEDIA_ERROR:
      error.value = '媒体错误，正在尝试恢复...'
      hls.recoverMediaError()
      break
    default:
      error.value = '播放器错误，无法播放视频'
      loading.value = false
      break
  }
}

/**
 * 元数据加载完成
 */
const handleLoadedMetadata = () => {
  loading.value = false
}

/**
 * 时间更新
 */
const handleTimeUpdate = (e) => {
  currentTime.value = e.target.currentTime
  emit('timeUpdate', currentTime.value)
}

/**
 * 播放结束
 */
const handleEnded = () => {
  emit('ended')
  ElMessage.success('视频播放完成')
}

/**
 * 播放错误
 */
const handleError = (e) => {
  console.error('Video Error:', e)
  error.value = '视频加载失败，请稍后重试'
  loading.value = false
  emit('error', e)
}

/**
 * 重试
 */
const retry = () => {
  error.value = ''
  loading.value = true
  initPlayer()
}

/**
 * 切换全屏
 */
const toggleFullscreen = () => {
  const container = videoElement.value.parentElement

  if (!isFullscreen.value) {
    if (container.requestFullscreen) {
      container.requestFullscreen()
    } else if (container.webkitRequestFullscreen) {
      container.webkitRequestFullscreen()
    } else if (container.mozRequestFullScreen) {
      container.mozRequestFullScreen()
    } else if (container.msRequestFullscreen) {
      container.msRequestFullscreen()
    }
    isFullscreen.value = true
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen()
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen()
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen()
    }
    isFullscreen.value = false
  }
}

/**
 * 格式化时长
 */
const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return '00:00'

  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)

  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

defineExpose({
  play: () => videoElement.value?.play(),
  pause: () => videoElement.value?.pause(),
  seek: (time) => {
    if (videoElement.value) {
      videoElement.value.currentTime = time
    }
  },
})
</script>

<style scoped lang="scss">
.hls-video-player {
  width: 100%;
}

.player-container {
  position: relative;
  width: 100%;
  background: #000;
  border-radius: 8px;
  overflow: hidden;

  &.fullscreen {
    border-radius: 0;
  }
}

.video-element {
  width: 100%;
  height: auto;
  display: block;
}

.loading-overlay,
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  z-index: 10;
}

.loading-icon,
.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.loading-icon {
  color: #409eff;
  animation: rotate 1.5s linear infinite;
}

.error-icon {
  color: #f56c6c;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.player-controls {
  position: absolute;
  bottom: 16px;
  right: 16px;
  z-index: 20;
}

.fullscreen-btn {
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;

  &:hover {
    background: rgba(64, 158, 255, 0.8);
  }
}

.video-info {
  display: flex;
  gap: 30px;
  margin-top: 16px;
  padding: 16px;
  background: rgba(10, 24, 52, 0.5);
  border-radius: 8px;
  border: 1px solid rgba(72, 156, 255, 0.3);
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;

  .label {
    font-size: 13px;
    color: #96c2f5;
  }

  .value {
    font-size: 14px;
    color: #e7f6ff;
    font-weight: 500;
  }
}
</style>
