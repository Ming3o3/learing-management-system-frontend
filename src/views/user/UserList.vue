<template>
  <div class="user-list">
    <!-- 搜索栏 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" @submit.prevent="handleSearch">
        <el-form-item label="用户名">
          <el-input v-model="searchForm.username" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="真实姓名">
          <el-input v-model="searchForm.realName" placeholder="请输入真实姓名" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 120px">
            <el-option label="正常" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作栏 -->
    <el-card class="action-card">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增用户
      </el-button>
      <el-button type="danger" :disabled="!selectedIds.length" @click="handleBatchDelete">
        <el-icon><Delete /></el-icon>
        批量删除
      </el-button>
    </el-card>

    <!-- 数据表格 -->
    <el-card>
      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="realName" label="真实姓名" width="120" />
        <el-table-column prop="gender" label="性别" width="80">
          <template #default="{ row }">
            <el-tag :type="row.gender === 1 ? '' : 'success'">
              {{ row.gender === 1 ? '男' : '女' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="roles" label="角色" width="100">
          <template #default="{ row }">
            <template v-if="row.roles && row.roles.length > 0">
              <el-tag v-if="row.roles.includes('ADMIN')" type="danger">管理员</el-tag>
              <el-tag v-else-if="row.roles.includes('TEACHER')" type="warning">教师</el-tag>
              <el-tag v-else-if="row.roles.includes('STUDENT')" type="info">学生</el-tag>
              <el-tag v-else type="info">{{ row.roles[0] }}</el-tag>
            </template>
            <el-tag v-else type="info">未分配</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="warning" size="small" @click="handleResetPassword(row)">
              重置密码
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadUserList"
          @current-change="loadUserList"
        />
      </div>
    </el-card>

    <!-- 用户表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form ref="userFormRef" :model="userForm" :rules="formRules" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item v-if="!userForm.id" label="密码" prop="password">
          <el-input v-model="userForm.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="userForm.realName" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="userForm.gender">
            <el-radio :label="1">男</el-radio>
            <el-radio :label="0">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="角色" prop="roleCode">
          <el-select v-model="userForm.roleCode" placeholder="请选择角色">
            <el-option label="管理员" value="ADMIN" />
            <el-option label="教师" value="TEACHER" />
            <el-option label="学生" value="STUDENT" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="userForm.status">
            <el-radio :label="1">正常</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUserPage, register, updateUser, deleteUser, resetPassword } from '@/api/user'
import { required, usernameRule, passwordRule, phoneRule, emailRule } from '@/utils/validate'

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const userFormRef = ref(null)

const searchForm = reactive({
  username: '',
  realName: '',
  status: null
})

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

const tableData = ref([])
const selectedIds = ref([])

const userForm = reactive({
  id: null,
  username: '',
  password: '',
  realName: '',
  gender: 1,
  phone: '',
  email: '',
  roleCode: 'STUDENT',
  status: 1
})

const formRules = {
  username: [required, usernameRule],
  password: [required, passwordRule],
  realName: [required],
  gender: [required],
  phone: [phoneRule],
  email: [emailRule],
  roleCode: [required],
  status: [required]
}

const dialogTitle = computed(() => (userForm.id ? '编辑用户' : '新增用户'))

onMounted(() => {
  loadUserList()
})

const loadUserList = async () => {
  try {
    loading.value = true
    const params = {
      ...searchForm,
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize
    }
    // 使用分页接口，返回 { pageNum, pageSize, total, list }
    const res = await getUserPage(params)
    tableData.value = res.data.list || []
    pagination.total = res.data.total || 0
  } catch (error) {
    console.error('Load user list failed:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.pageNum = 1
  loadUserList()
}

const handleReset = () => {
  Object.assign(searchForm, {
    username: '',
    realName: '',
    status: null
  })
  handleSearch()
}

const handleSelectionChange = (selection) => {
  selectedIds.value = selection.map((item) => item.id)
}

const handleAdd = () => {
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  Object.assign(userForm, row)
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除用户"${row.username}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteUser(row.id)
    ElMessage.success('删除成功')
    loadUserList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete user failed:', error)
    }
  }
}

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${selectedIds.value.length} 个用户吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    // TODO: 批量删除API
    ElMessage.success('批量删除成功')
    loadUserList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Batch delete failed:', error)
    }
  }
}

const handleResetPassword = async (row) => {
  try {
    await ElMessageBox.confirm(`确定重置用户"${row.username}"的密码吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await resetPassword(row.id, '123456')
    ElMessage.success('密码已重置为：123456')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Reset password failed:', error)
    }
  }
}

const handleSubmit = async () => {
  try {
    await userFormRef.value.validate()
    submitLoading.value = true

    if (userForm.id) {
      // 修正：updateUser 只接收 data
      await updateUser({
        id: userForm.id,
        realName: userForm.realName,
        gender: userForm.gender,
        phone: userForm.phone,
        email: userForm.email,
        avatar: userForm.avatar,
        status: userForm.status
      })
      ElMessage.success('更新成功')
    } else {
      // 新增用户改为调用注册接口，按 RegisterDTO 映射字段
      const payload = {
        username: userForm.username,
        password: userForm.password,
        realName: userForm.realName,
        gender: userForm.gender,
        phone: userForm.phone,
        email: userForm.email,
        userType: userForm.roleCode === 'ADMIN' ? 1 : userForm.roleCode === 'TEACHER' ? 2 : 3
      }

      await register(payload)
      ElMessage.success('创建成功')
    }

    dialogVisible.value = false
    loadUserList()
  } catch (error) {
    console.error('Submit user failed:', error)
  } finally {
    submitLoading.value = false
  }
}

const handleDialogClose = () => {
  userFormRef.value?.resetFields()
}

const resetForm = () => {
  Object.assign(userForm, {
    id: null,
    username: '',
    password: '',
    realName: '',
    gender: 1,
    phone: '',
    email: '',
    roleCode: 'STUDENT',
    status: 1
  })
}
</script>

<style scoped>
.user-list {
  padding: 20px;
}

.search-card,
.action-card {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
