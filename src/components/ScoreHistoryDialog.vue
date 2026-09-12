<template>
  <el-dialog
    v-model="visible"
    title="成绩变更记录"
    width="min(680px, calc(100vw - 32px))"
    class="score-history-dialog"
    append-to-body
    destroy-on-close
  >
    <div v-if="scoreTitle" class="score-context">
      <span class="context-title">{{ scoreTitle }}</span>
      <el-tag size="small" effect="plain">{{ scoreTypeName }}</el-tag>
    </div>

    <div v-loading="loading" class="history-content">
      <el-empty v-if="loadError" description="记录加载失败">
        <el-button type="primary" :icon="Refresh" @click="loadHistory">重新加载</el-button>
      </el-empty>
      <el-empty v-else-if="!loading && history.length === 0" description="暂无人工批改记录" />
      <el-timeline v-else-if="history.length > 0">
        <el-timeline-item
          v-for="item in history"
          :key="item.id"
          :timestamp="formatDateTime(item.createTime)"
          placement="top"
        >
          <div class="history-item">
            <div class="item-heading">
              <strong>{{ item.itemLabel || '成绩调整' }}</strong>
              <span>操作人：{{ item.operatorName || '-' }}</span>
            </div>

            <div class="score-change">
              <span class="change-label">分数</span>
              <span class="old-value">{{ formatScore(item.oldScore, '未评分') }}</span>
              <el-icon><Right /></el-icon>
              <strong class="new-value">{{ formatScore(item.newScore, '-') }}</strong>
            </div>

            <div v-if="hasRemarkChange(item)" class="remark-change">
              <div>
                <span class="change-label">原评语</span>
                <p>{{ item.oldRemark || '无' }}</p>
              </div>
              <div>
                <span class="change-label">新评语</span>
                <p>{{ item.newRemark || '无' }}</p>
              </div>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
    </div>
  </el-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Refresh, Right } from '@element-plus/icons-vue'
import { getScoreHistory } from '@/api/score'

const visible = ref(false)
const loading = ref(false)
const loadError = ref(false)
const history = ref([])
const selectedScore = ref({})

const scoreTitle = computed(() => selectedScore.value.examTitle || '')
const scoreTypeName = computed(() => {
  if (selectedScore.value.scoreTypeName) return selectedScore.value.scoreTypeName
  return selectedScore.value.scoreType === 2 ? '考试' : '作业'
})

const open = (score) => {
  if (!score?.id) return
  selectedScore.value = score
  visible.value = true
  loadHistory()
}

const loadHistory = async () => {
  if (!selectedScore.value.id) return
  loading.value = true
  loadError.value = false
  try {
    const res = await getScoreHistory(selectedScore.value.id)
    history.value = Array.isArray(res.data) ? res.data : []
  } catch (error) {
    console.error('Load score history failed:', error)
    history.value = []
    loadError.value = true
  } finally {
    loading.value = false
  }
}

const formatScore = (value, emptyText) => {
  if (value === null || value === undefined || value === '') return emptyText
  const number = Number(value)
  return Number.isFinite(number) ? number.toFixed(2).replace(/\.?0+$/, '') : String(value)
}

const formatDateTime = (value) => {
  if (!value) return '-'
  return typeof value === 'string' ? value.replace('T', ' ').split('.')[0] : value
}

const hasRemarkChange = (item) => item.oldRemark !== item.newRemark

defineExpose({ open })
</script>

<style scoped>
.score-context {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(191, 239, 255, 0.3);
}

.context-title {
  min-width: 0;
  overflow: hidden;
  color: #e9fbff;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-content {
  min-height: 220px;
  max-height: min(58vh, 560px);
  overflow-y: auto;
  padding: 4px 8px 0 2px;
}

.history-item {
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
}

.item-heading,
.score-change {
  display: flex;
  align-items: center;
  gap: 10px;
}

.item-heading {
  justify-content: space-between;
  margin-bottom: 12px;
}

.item-heading strong {
  min-width: 0;
  overflow-wrap: anywhere;
}

.item-heading span {
  flex: none;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.score-change {
  min-height: 32px;
}

.change-label {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.old-value {
  color: var(--el-text-color-regular);
  text-decoration: line-through;
}

.new-value {
  color: var(--el-color-primary);
  font-size: 16px;
}

.remark-change {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.remark-change > div {
  min-width: 0;
  padding: 10px;
  border-left: 3px solid var(--el-border-color);
  background: var(--el-bg-color);
}

.remark-change > div:last-child {
  border-left-color: var(--el-color-primary-light-3);
}

.remark-change p {
  margin: 5px 0 0;
  color: var(--el-text-color-regular);
  line-height: 1.6;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

@media (max-width: 640px) {
  .item-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }

  .remark-change {
    grid-template-columns: 1fr;
  }
}
</style>
