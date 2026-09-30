<template>
  <div class="verify-grade neon-module">
    <el-card class="verify-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">成绩链上验真</span>
          <span class="card-desc"
            >选择一条考试成绩，系统会自动使用对应的用户和考试记录进行验真</span
          >
        </div>
      </template>

      <el-alert
        v-if="userStore.isStudent"
        class="account-alert"
        type="info"
        :closable="false"
        show-icon
      >
        当前登录账号：{{ userStore.realName || userStore.username || '学生' }}（用户 ID 已自动获取）
      </el-alert>

      <el-form label-position="top" class="verify-form">
        <el-form-item label="要验真的考试成绩">
          <el-select
            v-model="selectedKey"
            class="score-select"
            popper-class="score-select-popper"
            filterable
            clearable
            :loading="loadingScores"
            :placeholder="loadingScores ? '正在加载考试成绩…' : '请选择考试成绩'"
            no-data-text="暂无可验真的考试成绩"
            @change="clearResult"
          >
            <el-option
              v-for="score in examScores"
              :key="scoreKey(score)"
              :label="scoreLabel(score)"
              :value="scoreKey(score)"
            >
              <div class="score-option">
                <div class="score-option__details">
                  <span class="score-option__title">{{ score.examTitle || '未命名考试' }}</span>
                  <small class="score-option__meta">
                    {{ score.courseName || '未命名课程' }}
                    <template v-if="!userStore.isStudent">
                      · {{ score.studentName || `用户 ${score.studentId}` }}
                    </template>
                  </small>
                </div>
                <span class="score-option__score">{{ score.score ?? '-' }} 分</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-descriptions
          v-if="selectedScore"
          :column="1"
          border
          size="small"
          class="selected-identifiers"
        >
          <el-descriptions-item label="用户 ID">
            {{ selectedScore.studentId }}
            <span class="identifier-hint">（系统自动带入）</span>
          </el-descriptions-item>
          <el-descriptions-item label="考试记录 ID">
            {{ selectedScore.relatedId }}
            <span class="identifier-hint">（系统自动带入）</span>
          </el-descriptions-item>
        </el-descriptions>

        <el-form-item class="verify-action">
          <el-button
            type="primary"
            :loading="verifying"
            :disabled="!selectedScore || loadingScores"
            @click="handleVerify"
          >
            <el-icon><CircleCheck /></el-icon>
            验真
          </el-button>
          <el-button v-if="userStore.isStudent" @click="goToMyScores">查看我的成绩</el-button>
        </el-form-item>
      </el-form>

      <el-empty
        v-if="!loadingScores && examScores.length === 0"
        description="暂时没有可验真的考试成绩"
        :image-size="90"
      >
        <el-button v-if="userStore.isStudent" type="primary" @click="goToMyScores">
          查看我的成绩
        </el-button>
      </el-empty>

      <div v-if="result !== null" class="result-panel" :class="result.found ? 'success' : 'fail'">
        <div class="result-icon">
          <el-icon v-if="result.found" color="#00ffaa"><CircleCheckFilled /></el-icon>
          <el-icon v-else color="#ff6b6b"><CircleCloseFilled /></el-icon>
        </div>
        <div class="result-text">{{ result.message }}</div>
        <div v-if="result.found && result.score !== null" class="result-score">
          链上成绩：<strong>{{ result.score }}</strong> 分
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { CircleCheck, CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import { getMyScores, getScoreList, verifyGradeOnChain } from '@/api/score'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loadingScores = ref(false)
const verifying = ref(false)
const examScores = ref([])
const selectedKey = ref('')
const result = ref(null)

const selectedScore = computed(() => {
  if (!selectedKey.value) return null
  return examScores.value.find((score) => scoreKey(score) === selectedKey.value) || null
})

const scoreKey = (score) => `${score.studentId}:${score.relatedId}`

const scoreLabel = (score) => {
  const title = score.examTitle || '未命名考试'
  const course = score.courseName || '未命名课程'
  const student = userStore.isStudent ? '' : ` · ${score.studentName || `用户 ${score.studentId}`}`
  return `${title} · ${course}${student} · 成绩 ${score.score ?? '-'}`
}

const loadScores = async () => {
  loadingScores.value = true
  try {
    let scores = []
    if (userStore.isStudent) {
      const response = await getMyScores()
      scores = response.data || []
    } else if (userStore.isTeacher || userStore.isAdmin) {
      // 教师接口只返回本人课程的成绩，管理员接口返回其有权限查看的成绩。
      const response = await getScoreList({ scoreType: 2, pageNum: 1, pageSize: 100 })
      scores = response.data?.list || []
    }

    examScores.value = scores.filter(
      (score) =>
        Number(score.scoreType) === 2 && score.studentId != null && score.relatedId != null,
    )

    const queryKey = route.query.relatedId
      ? `${route.query.userId || userStore.userId}:${route.query.relatedId}`
      : ''
    const initial = examScores.value.find((score) => scoreKey(score) === queryKey)
    if (initial) selectedKey.value = scoreKey(initial)
  } catch (error) {
    console.error('Load scores for verification failed:', error)
    ElMessage.error(error.response?.data?.message || '考试成绩加载失败')
  } finally {
    loadingScores.value = false
  }
}

const clearResult = () => {
  result.value = null
}

const handleVerify = async () => {
  if (!selectedScore.value) {
    ElMessage.warning('请先选择一条考试成绩')
    return
  }

  try {
    verifying.value = true
    result.value = null
    const response = await verifyGradeOnChain(
      String(selectedScore.value.studentId),
      String(selectedScore.value.relatedId),
    )
    result.value = response.data
  } catch (error) {
    console.error('Verify failed:', error)
    ElMessage.error(error.response?.data?.message || '验真请求失败')
    result.value = { found: false, score: null, message: '验真请求失败' }
  } finally {
    verifying.value = false
  }
}

const goToMyScores = () => router.push({ name: 'MyScores' })

onMounted(loadScores)
</script>

<style scoped lang="scss">
.verify-grade {
  padding: 20px;
}

.verify-card {
  max-width: 620px;
  margin: 0 auto;
  background: rgba(20, 35, 70, 0.75);
  border: 1px solid rgba(0, 229, 255, 0.4);
  box-shadow: 0 0 15px rgba(0, 229, 255, 0.15);
  backdrop-filter: blur(12px);
}

.card-title {
  color: #00e5ff;
  font-weight: 600;
  text-shadow: 0 0 8px rgba(0, 229, 255, 0.4);
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-desc,
.identifier-hint {
  font-size: 13px;
  color: #d4f7ff;
  font-weight: 500;
  line-height: 1.55;
}

.account-alert {
  margin-bottom: 20px;

  :deep(.el-alert__title),
  :deep(.el-alert__description) {
    color: #d9f7ff;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.5;
  }

  :deep(.el-alert__icon) {
    color: #9cecff;
  }
}

.verify-form {
  :deep(.el-form-item__label) {
    color: #00e5ff;
  }

  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper) {
    background: rgba(13, 28, 56, 0.6);
    border: 1px solid rgba(0, 229, 255, 0.3);
    box-shadow: inset 0 0 10px rgba(0, 229, 255, 0.05);
  }

  :deep(.el-select__selected-item),
  :deep(.el-select__placeholder),
  :deep(.el-input__inner) {
    color: #f7feff !important;
    font-weight: 500;
  }

  :deep(.el-select__placeholder) {
    color: #a9c9d5;
  }
}

.score-select {
  width: 100%;
}

.score-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  min-height: 50px;
  line-height: 1.4;
}

.score-option__details {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.score-option__title {
  color: #f7feff;
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.score-option__meta {
  overflow: hidden;
  color: #c6dce8;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.score-option__score {
  flex: none;
  padding: 4px 9px;
  border: 1px solid rgba(0, 229, 255, 0.3);
  border-radius: 12px;
  background: rgba(0, 229, 255, 0.1);
  color: #b9f6ff;
  font-size: 12px;
  font-weight: 600;
}

:global(.score-select-popper.el-select__popper) {
  border: 1px solid rgba(0, 229, 255, 0.45) !important;
  background: #102346 !important;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.4) !important;
}

:global(.score-select-popper .el-select-dropdown__list) {
  padding: 5px !important;
}

:global(.score-select-popper .el-select-dropdown__item) {
  height: auto !important;
  min-height: 62px;
  padding: 6px 10px !important;
  border-radius: 5px;
  color: #f7feff !important;
  line-height: normal !important;
}

:global(.score-select-popper .el-select-dropdown__item.hover),
:global(.score-select-popper .el-select-dropdown__item:hover) {
  background: #17405d !important;
}

:global(.score-select-popper .el-select-dropdown__item.selected) {
  background: #12374f !important;
}

.selected-identifiers {
  margin: 4px 0 22px;

  :deep(.el-descriptions__body),
  :deep(.el-descriptions__table),
  :deep(.el-descriptions__cell) {
    background: transparent !important;
  }

  :deep(.el-descriptions__label) {
    width: 110px;
    color: #effcff !important;
    background: transparent !important;
    font-weight: 600;
  }

  :deep(.el-descriptions__content) {
    color: #ffffff !important;
    background: transparent !important;
    font-size: 14px;
    font-weight: 600;
  }

  :deep(.identifier-hint) {
    color: #d8fbff !important;
    font-weight: 500;
  }
}

.verify-action {
  margin-bottom: 0;
}

.result-panel {
  margin-top: 24px;
  padding: 20px;
  border-radius: 4px;
  border: 1px solid;
  text-align: center;

  &.success {
    border-color: rgba(0, 255, 170, 0.5);
    background: rgba(0, 255, 170, 0.08);
    box-shadow: 0 0 12px rgba(0, 255, 170, 0.2);
  }

  &.fail {
    border-color: rgba(255, 107, 107, 0.5);
    background: rgba(255, 107, 107, 0.06);
  }
}

.result-icon {
  margin-bottom: 8px;
  font-size: 28px;
}

.result-text {
  color: #f1fcff;
  font-size: 16px;
  font-weight: 600;
}

.result-score {
  margin-top: 10px;
  color: #7dffd3;
  font-size: 17px;

  strong {
    color: #b8ffe6;
  }
}
</style>
