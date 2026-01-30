<template>
  <div class="violation-panel">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>
            <el-icon><WarningFilled /></el-icon>
            违规记录
          </span>
          <el-badge :value="violationCount" :max="99" type="danger" />
        </div>
      </template>

      <!-- 统计信息 -->
      <div class="violation-summary">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-statistic title="违规次数" :value="violationCount">
              <template #prefix>
                <el-icon :color="summaryColor"><Warning /></el-icon>
              </template>
            </el-statistic>
          </el-col>
          <el-col :span="12">
            <el-statistic title="剩余警告次数" :value="remainingWarnings">
              <template #prefix>
                <el-icon color="var(--el-color-warning)"><InfoFilled /></el-icon>
              </template>
            </el-statistic>
          </el-col>
        </el-row>
      </div>

      <el-divider />

      <!-- 违规记录列表 -->
      <div class="violation-list">
        <el-empty v-if="violations.length === 0" description="暂无违规记录">
          <template #image>
            <el-icon :size="60" color="var(--el-color-success)">
              <CircleCheck />
            </el-icon>
          </template>
        </el-empty>

        <el-timeline v-else>
          <el-timeline-item
            v-for="violation in displayViolations"
            :key="violation.id"
            :timestamp="formatTimestamp(violation.timestamp)"
            :type="getViolationType(violation)"
            :color="getViolationColor(violation)"
            placement="top"
          >
            <el-card class="violation-item">
              <div class="violation-content">
                <div class="violation-header">
                  <el-tag :type="getSeverityTagType(violation.severity)" size="small" effect="dark">
                    {{ violation.description }}
                  </el-tag>

                  <el-tag v-if="violation.confidence" type="info" size="small" effect="plain">
                    置信度: {{ (violation.confidence * 100).toFixed(0) }}%
                  </el-tag>
                </div>

                <div v-if="violation.details" class="violation-details">
                  {{ violation.details }}
                </div>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>

        <!-- 加载更多 -->
        <div v-if="hasMore" class="load-more">
          <el-button type="primary" link @click="loadMore"> 查看更多 </el-button>
        </div>
      </div>

      <!-- 警告提示 -->
      <el-alert
        v-if="showMaxWarning"
        title="违规警告"
        type="warning"
        :description="`您已违规 ${violationCount} 次，超过 ${maxViolations} 次将自动提交试卷！`"
        show-icon
        :closable="false"
        class="warning-alert"
      />
    </el-card>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useProctorStore } from '@/stores/proctor'
import { WarningFilled, Warning, InfoFilled, CircleCheck } from '@element-plus/icons-vue'

// ========== Props ==========
const props = defineProps({
  maxDisplay: {
    type: Number,
    default: 5,
  },
})

// ========== Store ==========
const proctorStore = useProctorStore()

// ========== Data ==========
const displayCount = ref(props.maxDisplay)

// ========== Computed ==========
const violations = computed(() => proctorStore.violations)
const violationCount = computed(() => proctorStore.violationCount)
const maxViolations = computed(() => proctorStore.proctorConfig.maxViolations)

const remainingWarnings = computed(() => {
  const remaining = maxViolations.value - violationCount.value
  return remaining > 0 ? remaining : 0
})

const displayViolations = computed(() => {
  return violations.value.slice(0, displayCount.value)
})

const hasMore = computed(() => {
  return violations.value.length > displayCount.value
})

const showMaxWarning = computed(() => {
  return violationCount.value >= maxViolations.value * 0.7
})

const summaryColor = computed(() => {
  const count = violationCount.value
  if (count === 0) return 'var(--el-color-success)'
  if (count < 5) return 'var(--el-color-warning)'
  return 'var(--el-color-danger)'
})

// ========== Methods ==========

/**
 * 格式化时间戳
 */
function formatTimestamp(timestamp) {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = Math.floor((now - date) / 1000)

  if (diff < 60) return `${diff}秒前`
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`

  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * 获取违规类型样式
 */
function getViolationType(violation) {
  const severity = violation.severity || 'medium'
  if (severity === 'high' || severity === 'critical') return 'danger'
  if (severity === 'medium') return 'warning'
  return 'info'
}

/**
 * 获取违规颜色
 */
function getViolationColor(violation) {
  const severity = violation.severity || 'medium'
  if (severity === 'high' || severity === 'critical') return '#F56C6C'
  if (severity === 'medium') return '#E6A23C'
  return '#909399'
}

/**
 * 获取严重程度标签类型
 */
function getSeverityTagType(severity) {
  if (!severity) return 'warning'
  if (severity === 'high' || severity === 'critical') return 'danger'
  if (severity === 'medium') return 'warning'
  return 'info'
}

/**
 * 加载更多记录
 */
function loadMore() {
  displayCount.value += props.maxDisplay
}
</script>

<style scoped lang="scss">
.violation-panel {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  span {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
  }
}

.violation-summary {
  margin-bottom: 16px;
}

.violation-list {
  max-height: 500px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--el-border-color);
    border-radius: 3px;
  }
}

.violation-item {
  margin-bottom: 8px;
}

.violation-content {
  .violation-header {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 8px;
  }

  .violation-details {
    color: var(--el-text-color-secondary);
    font-size: 13px;
    line-height: 1.5;
  }
}

.load-more {
  text-align: center;
  margin-top: 16px;
}

.warning-alert {
  margin-top: 16px;
}
</style>
