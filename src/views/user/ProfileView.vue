<template>
  <div class="profile">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>个人信息</span>
        </div>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="用户ID">
          <span class="user-id">{{ userInfo.id }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="用户名">{{ userInfo.username }}</el-descriptions-item>
        <el-descriptions-item label="真实姓名">{{ userInfo.realName }}</el-descriptions-item>
        <el-descriptions-item label="性别">
          {{ userInfo.gender === 1 ? '男' : '女' }}
        </el-descriptions-item>
        <el-descriptions-item label="手机号">{{ userInfo.phone }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ userInfo.email }}</el-descriptions-item>
        <el-descriptions-item label="角色">
          <el-tag v-if="userInfo.roles?.includes('ADMIN')" type="danger">管理员</el-tag>
          <el-tag v-else-if="userInfo.roles?.includes('TEACHER')" type="warning">教师</el-tag>
          <el-tag v-else type="info">学生</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="userInfo.status === 1 ? 'success' : 'danger'">
            {{ userInfo.status === 1 ? '正常' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ userInfo.createTime }}</el-descriptions-item>
      </el-descriptions>

      <div class="actions">
        <el-button type="primary" @click="showEditDialog">编辑资料</el-button>
        <el-button @click="showPasswordDialog">修改密码</el-button>
      </div>
    </el-card>

    <!-- 编辑资料对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑资料" width="500px">
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="80px">
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="editForm.realName" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="editForm.gender">
            <el-radio :label="1">男</el-radio>
            <el-radio :label="0">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="editForm.phone" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="editForm.email" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleEditSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 修改密码对话框 -->
    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="500px">
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="100px"
      >
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handlePasswordSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { updateUser, changePassword } from '@/api/user'
import { required, phoneRule, emailRule, passwordRule } from '@/utils/validate'

const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)

const editDialogVisible = ref(false)
const passwordDialogVisible = ref(false)
const submitLoading = ref(false)
const editFormRef = ref(null)
const passwordFormRef = ref(null)

const editForm = reactive({
  realName: '',
  gender: 1,
  phone: '',
  email: '',
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const editRules = {
  realName: [required],
  gender: [required],
  phone: [phoneRule],
  email: [emailRule],
}

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const passwordRules = {
  oldPassword: [required],
  newPassword: [required, passwordRule],
  confirmPassword: [required, { validator: validateConfirmPassword, trigger: 'blur' }],
}

const showEditDialog = () => {
  Object.assign(editForm, {
    realName: userInfo.value.realName,
    gender: userInfo.value.gender,
    phone: userInfo.value.phone,
    email: userInfo.value.email,
  })
  editDialogVisible.value = true
}

const showPasswordDialog = () => {
  Object.assign(passwordForm, {
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  passwordDialogVisible.value = true
}

const handleEditSubmit = async () => {
  try {
    await editFormRef.value.validate()
    submitLoading.value = true

    await updateUser(userInfo.value.id, editForm)
    await userStore.getUserInfo()

    ElMessage.success('更新成功')
    editDialogVisible.value = false
  } catch (error) {
    console.error('Update profile failed:', error)
  } finally {
    submitLoading.value = false
  }
}

const handlePasswordSubmit = async () => {
  try {
    await passwordFormRef.value.validate()
    submitLoading.value = true

    await changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    })

    ElMessage.success('密码修改成功，请重新登录')
    passwordDialogVisible.value = false

    // 退出登录
    setTimeout(() => {
      userStore.logout()
    }, 1500)
  } catch (error) {
    console.error('Change password failed:', error)
  } finally {
    submitLoading.value = false
  }
}
</script>

<style scoped>
.profile {
  padding: 20px;
  --el-text-color-primary: #ffffff;
  --el-text-color-regular: #e9f6ff;
  --el-text-color-secondary: #cfe6ff;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-id {
  font-variant-numeric: tabular-nums;
  letter-spacing: 1px;
  text-shadow: 0 0 8px rgba(0, 229, 255, 0.35);
}

.actions {
  margin-top: 30px;
  text-align: center;
}

/* 主题化卡片 */
:deep(.el-card) {
  background: rgba(20, 35, 70, 0.75);
  border: 1px solid rgba(0, 229, 255, 0.35);
  color: #e7f6ff;
  border-radius: 6px;
  backdrop-filter: blur(12px);
  box-shadow: 0 0 18px rgba(0, 229, 255, 0.18);
}

.card-header span {
  color: #e9fbff;
  font-weight: 600;
  letter-spacing: 1px;
  text-shadow: 0 0 8px rgba(0, 229, 255, 0.35);
}

/* 描述列表 */
:deep(.el-descriptions) {
  --el-descriptions-border-color: rgba(0, 229, 255, 0.2);
  background: transparent;
}

:deep(.el-descriptions__body) {
  background: transparent;
}

:deep(.el-descriptions__label) {
  color: #e9f6ff;
  font-weight: 600;
  background: rgba(10, 24, 48, 0.9);
  text-shadow: 0 0 6px rgba(0, 229, 255, 0.25);
}

:deep(.el-descriptions__content) {
  color: #ffffff;
  background: rgba(10, 24, 48, 0.65);
  text-shadow: 0 0 8px rgba(0, 229, 255, 0.2);
}

/* 覆盖 bordered 模式下的默认白色背景 */
:deep(.el-descriptions__label.el-descriptions__item-bordered-label) {
  background: rgba(10, 24, 48, 0.9);
  color: #e9f6ff;
}

:deep(.el-descriptions__content.el-descriptions__item-bordered-content) {
  background: rgba(10, 24, 48, 0.65);
  color: #ffffff;
}

:deep(.el-descriptions__content span),
:deep(.el-descriptions__content div) {
  color: #ffffff;
}

/* 强制覆盖 Element Plus 默认文本色 */
:deep(.el-descriptions__cell.el-descriptions__label.is-bordered-label) {
  color: #e9f6ff !important;
  background: rgba(10, 24, 48, 0.9) !important;
}

:deep(.el-descriptions__cell.el-descriptions__content.is-bordered-content) {
  color: #ffffff !important;
  background: rgba(10, 24, 48, 0.65) !important;
}

:deep(.el-descriptions__cell) {
  border-color: rgba(0, 229, 255, 0.18) !important;
}

/* 按钮风格统一 */
:deep(.el-button) {
  border-radius: 2px;
  letter-spacing: 1px;
}

:deep(.el-button--primary) {
  background: rgba(0, 229, 255, 0.2);
  border-color: #00e5ff;
  color: #00e5ff;
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.2);
}

:deep(.el-button--primary:hover) {
  background: rgba(0, 229, 255, 0.4);
  box-shadow: 0 0 20px rgba(0, 229, 255, 0.4);
}

/*
:deep(.el-button--default) {
  background: rgba(0, 229, 255, 0.12);
  border-color: rgba(0, 229, 255, 0.6);
  color: #d9f6ff;
  --el-button-bg-color: rgba(0, 229, 255, 0.12);
  --el-button-border-color: rgba(0, 229, 255, 0.6);
  --el-button-text-color: #d9f6ff;
  --el-button-text-color-regular: #d9f6ff;
  --el-text-color-regular: #d9f6ff;
  --el-button-hover-bg-color: rgba(0, 229, 255, 0.22);
  --el-button-hover-border-color: rgba(0, 229, 255, 0.9);
  --el-button-hover-text-color: #ffffff;
}

:deep(.el-button--default:hover) {
  background: rgba(0, 229, 255, 0.22);
  border-color: rgba(0, 229, 255, 0.9);
  color: #ffffff;
  box-shadow: 0 0 12px rgba(0, 229, 255, 0.25);
}
*/

/* 标签可读性 */
:deep(.el-tag) {
  color: #eaffff;
  background: rgba(0, 229, 255, 0.15);
  border-color: rgba(0, 229, 255, 0.4);
}

:deep(.el-tag__content) {
  color: inherit;
}

:deep(.el-tag--success) {
  color: #c8f7db;
  background: rgba(33, 197, 93, 0.2);
  border-color: rgba(33, 197, 93, 0.6);
}

:deep(.el-tag--danger) {
  color: #ffd6d6;
  background: rgba(255, 77, 79, 0.2);
  border-color: rgba(255, 77, 79, 0.6);
}

:deep(.el-tag--warning) {
  color: #ffe7ba;
  background: rgba(250, 173, 20, 0.2);
  border-color: rgba(250, 173, 20, 0.6);
}

:deep(.el-tag--info) {
  color: #d6e4ff;
  background: rgba(80, 140, 255, 0.2);
  border-color: rgba(80, 140, 255, 0.6);
}

/* 对话框 */
:deep(.el-dialog) {
  background: rgba(17, 32, 69, 0.95);
  border: 1px solid rgba(0, 255, 255, 0.3);
}

/* 对话框表单输入框主题化 */
:deep(.el-dialog .el-form-item__label) {
  color: #d6f3ff;
}

:deep(.el-dialog .el-input__wrapper) {
  background: rgba(10, 24, 48, 0.75);
  border: 1px solid rgba(0, 229, 255, 0.35);
  box-shadow: inset 0 0 0 1px rgba(0, 229, 255, 0.12);
}

:deep(.el-dialog .el-input__inner) {
  color: #e9f6ff;
}

:deep(.el-dialog .el-input__inner::placeholder) {
  color: rgba(233, 246, 255, 0.5);
}

:deep(.el-dialog .el-input__wrapper.is-focus) {
  border-color: rgba(0, 229, 255, 0.7);
  box-shadow: 0 0 0 2px rgba(0, 229, 255, 0.15);
}

:deep(.el-dialog__title) {
  color: #00e5ff;
}

:deep(.el-dialog__headerbtn .el-dialog__close) {
  color: #a0cfff;
}
</style>
