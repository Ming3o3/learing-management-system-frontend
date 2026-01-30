/**
 * 监考系统配置常量
 */

/**
 * 违规类型定义
 */
export const VIOLATION_TYPES = {
  MULTIPLE_PEOPLE: {
    key: 'multiple_people',
    label: '检测到多人',
    severity: 'critical',
    description: '考试区域内检测到多人出现',
  },
  PHONE_DETECTED: {
    key: 'phone_detected',
    label: '检测到手机',
    severity: 'high',
    description: '检测到手机等电子设备',
  },
  BOOK_DETECTED: {
    key: 'book_detected',
    label: '检测到书籍',
    severity: 'high',
    description: '检测到书籍或参考资料',
  },
  CHEAT_SHEET_DETECTED: {
    key: 'cheat_sheet_detected',
    label: '检测到小抄',
    severity: 'critical',
    description: '检测到疑似小抄或作弊材料',
  },
  HEADPHONE_DETECTED: {
    key: 'headphone_detected',
    label: '检测到耳机',
    severity: 'high',
    description: '检测到耳机或耳塞',
  },
  GAZE_DEVIATION: {
    key: 'gaze_deviation',
    label: '视线偏离',
    severity: 'medium',
    description: '视线长时间偏离屏幕',
  },
  STUDENT_ABSENT: {
    key: 'student_absent',
    label: '考生离开',
    severity: 'critical',
    description: '考生离开摄像头视野',
  },
}

/**
 * 严重程度等级
 */
export const SEVERITY_LEVELS = {
  CRITICAL: {
    value: 'critical',
    label: '严重',
    color: '#F56C6C',
    weight: 3,
  },
  HIGH: {
    value: 'high',
    label: '高',
    color: '#E6A23C',
    weight: 2,
  },
  MEDIUM: {
    value: 'medium',
    label: '中',
    color: '#E6A23C',
    weight: 1,
  },
  LOW: {
    value: 'low',
    label: '低',
    color: '#909399',
    weight: 0,
  },
}

/**
 * 监考配置默认值
 */
export const PROCTOR_CONFIG_DEFAULTS = {
  // 是否启用监考
  enabled: true,

  // WebSocket服务器地址
  websocketUrl: import.meta.env.VITE_PROCTOR_WS_URL || 'ws://localhost:8000/ws/monitor',

  // 帧发送间隔（毫秒）
  frameInterval: 1000,

  // 最大违规次数（超过则强制交卷）
  maxViolations: 10,

  // 超过最大违规次数时自动提交
  autoSubmitOnMaxViolations: true,

  // 是否显示摄像头预览
  showPreview: true,

  // 是否显示统计信息
  showStats: false,

  // 心跳间隔（毫秒）
  heartbeatInterval: 30000,

  // 摄像头配置
  camera: {
    width: 1280,
    height: 720,
    facingMode: 'user', // 'user' 或 'environment'
    frameRate: 30,
  },

  // 截图质量（0-1）
  screenshotQuality: 0.8,

  // 是否在违规时自动截图
  autoScreenshotOnViolation: true,

  // WebSocket重连配置
  reconnect: {
    enabled: true,
    maxAttempts: 5,
    interval: 3000,
  },
}

/**
 * 监考系统状态
 */
export const PROCTOR_STATUS = {
  IDLE: 'idle', // 空闲
  INITIALIZING: 'initializing', // 初始化中
  READY: 'ready', // 就绪
  MONITORING: 'monitoring', // 监控中
  ERROR: 'error', // 错误
  STOPPED: 'stopped', // 已停止
}

/**
 * 连接状态
 */
export const CONNECTION_STATUS = {
  DISCONNECTED: 'disconnected', // 未连接
  CONNECTING: 'connecting', // 连接中
  CONNECTED: 'connected', // 已连接
  RECONNECTING: 'reconnecting', // 重连中
  FAILED: 'failed', // 连接失败
}

/**
 * 摄像头状态
 */
export const CAMERA_STATUS = {
  IDLE: 'idle', // 未启动
  REQUESTING: 'requesting', // 请求权限中
  READY: 'ready', // 就绪
  ERROR: 'error', // 错误
  DENIED: 'denied', // 权限被拒绝
}

/**
 * 消息类型
 */
export const MESSAGE_TYPES = {
  FRAME: 'frame', // 视频帧
  VIOLATION: 'violation', // 违规告警
  HEARTBEAT: 'heartbeat', // 心跳
  ERROR: 'error', // 错误
  SESSION_START: 'session_start', // 会话开始
  SESSION_END: 'session_end', // 会话结束
}
