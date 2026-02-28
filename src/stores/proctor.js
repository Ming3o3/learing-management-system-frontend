/**
 * 考试监考状态管理
 * @description 管理监考会话、违规记录、连接状态等
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as proctorApi from '@/api/proctor'
import { PROCTOR_CONFIG_DEFAULTS } from '@/constants/proctor'

export const useProctorStore = defineStore('proctor', () => {
  // ========== 状态定义 ==========

  // WebSocket连接状态
  const isConnected = ref(false)
  const connectionError = ref(null)
  const wsInstance = ref(null)

  // 摄像头状态
  const cameraStream = ref(null)
  const cameraError = ref(null)
  const isCameraReady = ref(false)

  // 监考会话信息
  const sessionInfo = ref({
    examId: null,
    studentId: null,
    startTime: null,
    duration: 0,
  })

  // 违规记录
  const violations = ref([])
  const violationCount = computed(() => violations.value.length)
  const latestViolation = computed(() => (violations.value.length > 0 ? violations.value[0] : null))

  // 监控状态
  const isMonitoring = ref(false)
  const framesSent = ref(0)
  const lastFrameTime = ref(null)

  // 监考配置
  const proctorConfig = ref({
    enabled: false,
    websocketUrl: PROCTOR_CONFIG_DEFAULTS.websocketUrl,
    frameInterval: 1000,
    maxViolations: 10, // 最大违规次数（超过则强制交卷）
    autoSubmitOnMaxViolations: true,
    violationTypes: {
      multiple_people: '检测到多人',
      phone_detected: '检测到手机',
      book_detected: '检测到书籍',
      cheat_sheet_detected: '检测到小抄',
      headphone_detected: '检测到耳机',
      gaze_deviation: '视线偏离',
      student_absent: '考生离开',
    },
  })

  // ========== Actions ==========

  /**
   * 初始化监考配置
   */
  async function initProctorConfig(examId) {
    try {
      const response = await proctorApi.getProctorConfig(examId)
      if (response.data) {
        proctorConfig.value = { ...proctorConfig.value, ...response.data }
      }
    } catch (error) {
      console.error('获取监考配置失败:', error)
    }
  }

  /**
   * 开始监考会话
   */
  async function startSession(examId, studentId) {
    try {
      const response = await proctorApi.startProctorSession({ examId, studentId })

      sessionInfo.value = {
        examId,
        studentId,
        startTime: new Date(),
        duration: 0,
      }

      isMonitoring.value = true
      violations.value = []
      framesSent.value = 0

      return response.data
    } catch (error) {
      console.error('启动监考会话失败:', error)
      throw error
    }
  }

  /**
   * 结束监考会话
   */
  async function endSession() {
    try {
      const duration = sessionInfo.value.startTime
        ? Math.floor((new Date() - sessionInfo.value.startTime) / 1000)
        : 0

      await proctorApi.endProctorSession({
        examId: sessionInfo.value.examId,
        studentId: sessionInfo.value.studentId,
        duration,
        violationCount: violationCount.value,
      })

      // 清理状态
      cleanup()
    } catch (error) {
      console.error('结束监考会话失败:', error)
      throw error
    }
  }

  /**
   * 记录违规
   */
  function addViolation(violation) {
    const record = {
      id: Date.now(),
      timestamp: Date.now(),
      examId: sessionInfo.value.examId,
      studentId: sessionInfo.value.studentId,
      ...violation,
    }

    // 添加到列表开头
    violations.value.unshift(record)

    // 异步提交到后端
    submitViolationToBackend(record)

    // 检查是否超过最大违规次数
    if (
      proctorConfig.value.autoSubmitOnMaxViolations &&
      violationCount.value >= proctorConfig.value.maxViolations
    ) {
      return { shouldForceSubmit: true, reason: '违规次数过多' }
    }

    return { shouldForceSubmit: false }
  }

  /**
   * 提交违规记录到后端
   */
  async function submitViolationToBackend(violation) {
    try {
      await proctorApi.submitViolation(violation)
    } catch (error) {
      console.error('提交违规记录失败:', error)
      // 失败不影响前端记录
    }
  }

  /**
   * 批量提交违规记录
   */
  async function submitAllViolations() {
    if (violations.value.length === 0) return

    try {
      await proctorApi.submitViolationBatch(violations.value)
    } catch (error) {
      console.error('批量提交违规记录失败:', error)
    }
  }

  /**
   * 更新WebSocket连接状态
   */
  function updateConnectionStatus(connected, error = null) {
    isConnected.value = connected
    connectionError.value = error
  }

  /**
   * 设置WebSocket实例
   */
  function setWebSocket(ws) {
    wsInstance.value = ws
  }

  /**
   * 更新摄像头状态
   */
  function updateCameraStatus(stream, error = null) {
    cameraStream.value = stream
    cameraError.value = error
    isCameraReady.value = !!stream && !error
  }

  /**
   * 记录发送帧
   */
  function recordFrameSent() {
    framesSent.value++
    lastFrameTime.value = new Date()
  }

  /**
   * 清理所有状态
   */
  function cleanup() {
    // 关闭WebSocket
    if (wsInstance.value) {
      try {
        wsInstance.value.close()
      } catch (error) {
        console.error('关闭WebSocket失败:', error)
      }
      wsInstance.value = null
    }

    // 关闭摄像头
    if (cameraStream.value) {
      try {
        cameraStream.value.getTracks().forEach((track) => track.stop())
      } catch (error) {
        console.error('关闭摄像头失败:', error)
      }
      cameraStream.value = null
    }

    // 重置状态
    isConnected.value = false
    connectionError.value = null
    isCameraReady.value = false
    cameraError.value = null
    isMonitoring.value = false
    framesSent.value = 0
    lastFrameTime.value = null

    // 不清空violations，保留记录供查看
  }

  /**
   * 获取违规记录
   */
  async function fetchViolations(examId, studentId) {
    try {
      const response = await proctorApi.getViolationList({ examId, studentId })
      if (response.data) {
        violations.value = response.data
      }
    } catch (error) {
      console.error('获取违规记录失败:', error)
    }
  }

  // ========== 考生身份照片管理 ==========

  // 身份照片状态
  const identityPhoto = ref(null) // File对象
  const identityPhotoUrl = ref('') // 预览URL
  const isIdentityRegistered = ref(false) // 是否已注册
  const identityRegistering = ref(false) // 是否正在注册

  /**
   * 设置身份照片
   * @param {File} file - 照片文件
   */
  function setIdentityPhoto(file) {
    identityPhoto.value = file
    if (file) {
      // 创建预览URL
      if (identityPhotoUrl.value) {
        URL.revokeObjectURL(identityPhotoUrl.value)
      }
      identityPhotoUrl.value = URL.createObjectURL(file)
    } else {
      identityPhotoUrl.value = ''
    }
  }

  /**
   * 注册考生身份（上传照片）
   * @param {number} examId - 考试ID
   * @param {number} studentId - 学生ID
   * @returns {Promise<boolean>} 是否成功
   */
  async function registerIdentity(examId, studentId) {
    if (!identityPhoto.value) {
      throw new Error('请先选择身份照片')
    }

    identityRegistering.value = true
    try {
      const response = await proctorApi.registerStudentIdentity({
        examId,
        studentId,
        identityPhoto: identityPhoto.value,
      })

      if (response.status === 'success' || response.code === 200) {
        isIdentityRegistered.value = true
        console.log('✅ 考生身份注册成功')
        return true
      }
      return false
    } catch (error) {
      console.error('❌ 考生身份注册失败:', error)
      throw error
    } finally {
      identityRegistering.value = false
    }
  }

  /**
   * 获取考生身份信息
   */
  async function fetchIdentityInfo(examId, studentId) {
    try {
      const response = await proctorApi.getStudentIdentity({ examId, studentId })
      if (response.data && response.data.hasIdentity) {
        isIdentityRegistered.value = true
        identityPhotoUrl.value = response.data.photoUrl || ''
      }
    } catch (error) {
      console.error('获取身份信息失败:', error)
    }
  }

  /**
   * 删除身份照片
   */
  async function deleteIdentity(examId, studentId) {
    try {
      await proctorApi.deleteStudentIdentity({ examId, studentId })
      isIdentityRegistered.value = false
      identityPhoto.value = null
      if (identityPhotoUrl.value) {
        URL.revokeObjectURL(identityPhotoUrl.value)
      }
      identityPhotoUrl.value = ''
    } catch (error) {
      console.error('删除身份照片失败:', error)
      throw error
    }
  }

  /**
   * 重置身份照片状态
   */
  function resetIdentityPhoto() {
    if (identityPhotoUrl.value) {
      URL.revokeObjectURL(identityPhotoUrl.value)
    }
    identityPhoto.value = null
    identityPhotoUrl.value = ''
    isIdentityRegistered.value = false
    identityRegistering.value = false
  }

  return {
    // 状态
    isConnected,
    connectionError,
    wsInstance,
    cameraStream,
    cameraError,
    isCameraReady,
    sessionInfo,
    violations,
    violationCount,
    latestViolation,
    isMonitoring,
    framesSent,
    lastFrameTime,
    proctorConfig,

    // 身份照片状态
    identityPhoto,
    identityPhotoUrl,
    isIdentityRegistered,
    identityRegistering,

    // 方法
    initProctorConfig,
    startSession,
    endSession,
    addViolation,
    submitAllViolations,
    updateConnectionStatus,
    setWebSocket,
    updateCameraStatus,
    recordFrameSent,
    cleanup,
    fetchViolations,

    // 身份照片方法
    setIdentityPhoto,
    registerIdentity,
    fetchIdentityInfo,
    deleteIdentity,
    resetIdentityPhoto,
  }
})
