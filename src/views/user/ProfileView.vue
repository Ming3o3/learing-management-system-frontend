<template>
  <div class="profile">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>个人信息</span>
        </div>
      </template>

      <el-descriptions :column="2" border>
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
  email: ''
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const editRules = {
  realName: [required],
  gender: [required],
  phone: [phoneRule],
  email: [emailRule]
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
  confirmPassword: [required, { validator: validateConfirmPassword, trigger: 'blur' }]
}

const showEditDialog = () => {
  Object.assign(editForm, {
    realName: userInfo.value.realName,
    gender: userInfo.value.gender,
    phone: userInfo.value.phone,
    email: userInfo.value.email
  })
  editDialogVisible.value = true
}

const showPasswordDialog = () => {
  Object.assign(passwordForm, {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
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
      newPassword: passwordForm.newPassword
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
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.actions {
  margin-top: 30px;
  text-align: center;
}
</style>
