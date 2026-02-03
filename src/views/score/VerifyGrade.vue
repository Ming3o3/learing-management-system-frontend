<template>
  <div class="verify-grade neon-module">
    <el-card class="verify-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">成绩链上验真</span>
          <span class="card-desc">按用户ID + 考试记录ID 查询链上存证</span>
        </div>
      </template>
      <el-form :model="form" label-width="120px" class="verify-form">
        <el-form-item label="用户ID">
          <el-input v-model="form.userId" placeholder="请输入学生/用户ID" clearable />
        </el-form-item>
        <el-form-item label="考试记录ID">
          <el-input v-model="form.relatedId" placeholder="请输入考试记录ID" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleVerify">
            <el-icon><CircleCheck /></el-icon>
            验真
          </el-button>
        </el-form-item>
      </el-form>
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
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheck, CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import { verifyGradeOnChain } from '@/api/score'

const loading = ref(false)
const form = reactive({ userId: '', relatedId: '' })
const result = ref(null)

const handleVerify = async () => {
  if (!form.userId?.trim() || !form.relatedId?.trim()) {
    ElMessage.warning('请输入用户ID和考试记录ID')
    return
  }
  try {
    loading.value = true
    result.value = null
    const res = await verifyGradeOnChain(form.userId.trim(), form.relatedId.trim())
    result.value = res.data
  } catch (error) {
    console.error('Verify failed:', error)
    ElMessage.error(error.response?.data?.message || '验真请求失败')
    result.value = { found: false, score: null, message: '验真请求失败' }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.verify-grade {
  padding: 20px;
}

.verify-card {
  max-width: 520px;
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
.card-desc {
  font-size: 12px;
  color: rgba(0, 229, 255, 0.75);
  font-weight: 400;
}

.verify-form {
  :deep(.el-form-item__label) {
    color: #00e5ff;
  }
  :deep(.el-input__wrapper) {
    background: rgba(13, 28, 56, 0.6);
    border: 1px solid rgba(0, 229, 255, 0.3);
    box-shadow: inset 0 0 10px rgba(0, 229, 255, 0.05);
  }
  :deep(.el-input__inner) {
    color: #e7f6ff;
  }
  :deep(.el-input__inner::placeholder) {
    color: rgba(255, 255, 255, 0.6);
  }
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
  font-size: 48px;
  margin-bottom: 12px;
}

.result-text {
  color: #e7f6ff;
  font-size: 16px;
  margin-bottom: 8px;
}

.result-score {
  color: #00e5ff;
  font-size: 18px;
  strong {
    color: #00ffaa;
    margin-left: 4px;
  }
}
</style>
