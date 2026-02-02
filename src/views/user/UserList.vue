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
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
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
            <div class="op-buttons">
              <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button type="warning" size="small" @click="handleResetPassword(row)">
                重置密码
              </el-button>
              <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
            </div>
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
  status: null,
})

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0,
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
  status: 1,
})

const formRules = {
  username: [required, usernameRule],
  password: [required, passwordRule],
  realName: [required],
  gender: [required],
  phone: [phoneRule],
  email: [emailRule],
  roleCode: [required],
  status: [required],
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
      pageSize: pagination.pageSize,
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
    status: null,
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
  Object.assign(userForm, {
    id: row.id,
    username: row.username,
    realName: row.realName,
    gender: row.gender,
    phone: row.phone,
    email: row.email,
    avatar: row.avatar,
    status: row.status,
    // 从 roles 数组中提取角色代码
    roleCode: row.roles && row.roles.length > 0 ? row.roles[0] : 'STUDENT',
  })
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除用户"${row.username}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
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
      type: 'warning',
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
      type: 'warning',
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
      // 编辑用户：传递完整信息包括角色
      await updateUser({
        id: userForm.id,
        realName: userForm.realName,
        gender: userForm.gender,
        phone: userForm.phone,
        email: userForm.email,
        avatar: userForm.avatar,
        status: userForm.status,
        roleCode: userForm.roleCode, // 添加角色信息
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
        userType: userForm.roleCode === 'ADMIN' ? 1 : userForm.roleCode === 'TEACHER' ? 2 : 3,
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
    status: 1,
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

.op-buttons {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

/* 深色主题样式适配 */
:deep(.el-card) {
  background: rgba(20, 35, 70, 0.75); /* 提亮背景 */
  border: 1px solid rgba(0, 229, 255, 0.4); /* 增加边框亮度 */
  color: #e7f6ff;
  border-radius: 4px; /* 更锐利的圆角 */
  backdrop-filter: blur(12px);
  position: relative;
  overflow: visible; /* 允许装饰溢出 */
  box-shadow: 0 0 15px rgba(0, 229, 255, 0.15); /* 增加整体发光 */
}

/* 科技感边角装饰 */
:deep(.el-card)::before {
  content: '';
  position: absolute;
  top: -1px;
  left: -1px;
  width: 20px;
  height: 20px;
  border-top: 2px solid #00e5ff;
  border-left: 2px solid #00e5ff;
  border-top-left-radius: 4px;
  box-shadow: -2px -2px 8px rgba(0, 229, 255, 0.5);
  z-index: 10;
}

:deep(.el-card)::after {
  content: '';
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 20px;
  height: 20px;
  border-bottom: 2px solid #00e5ff;
  border-right: 2px solid #00e5ff;
  border-bottom-right-radius: 4px;
  box-shadow: 2px 2px 8px rgba(0, 229, 255, 0.5);
  z-index: 10;
}

:deep(.el-form-item__label) {
  color: #74f0ff; /* 标签文字更亮 */
  font-weight: 500;
  text-shadow: 0 0 5px rgba(0, 229, 255, 0.3);
}

:deep(.el-input__wrapper),
:deep(.el-select__wrapper) {
  background: rgba(13, 28, 56, 0.6); /* 稍微提亮输入框背景 */
  border: 1px solid rgba(0, 229, 255, 0.3);
  box-shadow: inset 0 0 10px rgba(0, 229, 255, 0.05); /* 内部光晕 */
  transition: all 0.3s;
}

:deep(.el-input__inner) {
  color: #ffffff;
  font-family: 'Segoe UI', sans-serif;
  letter-spacing: 0.5px;
}

:deep(.el-input__wrapper:hover),
:deep(.el-select__wrapper:hover) {
  border-color: #00e5ff;
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.2);
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-select__wrapper.is-focused) {
  border-color: #00e5ff !important;
  background: rgba(13, 28, 56, 0.8);
  box-shadow: 0 0 15px rgba(0, 229, 255, 0.3) !important;
}

/* 下拉框弹层样式 */
/* 下拉框弹层样式（teleport 到 body，需要全局选择器） */
:global(.el-select__popper),
:global(.el-popper.is-light) {
  background: rgba(12, 24, 52, 0.98);
  border: 1px solid rgba(0, 229, 255, 0.25);
  box-shadow: 0 0 16px rgba(0, 229, 255, 0.2);
}

:global(.el-popper.is-light .el-popper__arrow::before) {
  background: rgba(12, 24, 52, 0.98);
  border: 1px solid rgba(0, 229, 255, 0.25);
}

:global(.el-select-dropdown) {
  background: transparent;
}

:global(.el-select-dropdown__item) {
  color: #e7f6ff;
}

:global(.el-select-dropdown__item.is-selected) {
  color: #00e5ff;
  background: rgba(0, 229, 255, 0.12);
}

:global(.el-select-dropdown__item:hover) {
  background: rgba(0, 229, 255, 0.16);
}

/* 表格样式 */
:deep(.el-table) {
  background-color: transparent;
  color: #e7f6ff;
  --el-table-border-color: rgba(0, 229, 255, 0.2); /* 边框更亮 */
  --el-table-header-bg-color: rgba(0, 229, 255, 0.15); /* 表头更亮 */
  --el-table-tr-bg-color: transparent;
  --el-table-row-hover-bg-color: rgba(0, 229, 255, 0.15);
}

:deep(.el-table th.el-table__cell) {
  background-color: rgba(0, 229, 255, 0.15);
  color: #00e5ff;
  font-weight: 700;
  border-bottom: 2px solid rgba(0, 229, 255, 0.4); /* 增加表头底边强调 */
  text-transform: uppercase; /* 更有科技感 */
  letter-spacing: 1px;
}

:deep(.el-table tr) {
  background-color: transparent;
}

:deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid rgba(0, 255, 255, 0.1);
  background-color: transparent; /* 确保默认单元格透明 */
}

/* 空数据区域背景修复 */
:deep(.el-table__empty-block) {
  background: rgba(12, 24, 52, 0.8);
}

:deep(.el-table__empty-text) {
  color: #a0cfff;
}

/* 加载时遮罩改为深色，避免白色幕布 */
:deep(.el-loading-mask) {
  background-color: rgba(12, 24, 52, 0.65) !important;
}

:deep(.el-loading-spinner .path) {
  stroke: #00e5ff;
}

/* 修复斑马纹背景太白的问题 */
:deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) {
  background-color: rgba(0, 229, 255, 0.06); /* 稍微提亮 */
}

/* 修复鼠标悬停颜色 */
:deep(.el-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell) {
  background-color: rgba(0, 229, 255, 0.2); /* 悬停更明显 */
  box-shadow: inset 0 0 10px rgba(0, 229, 255, 0.1); /* 增加内发光 */
}

/* 标签样式增强 */
:deep(.el-tag) {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid currentColor;
  border-radius: 0; /* 科技感矩形 */
  font-weight: bold;
}

:deep(.el-tag--success) {
  color: #00ffaa;
  border-color: #00ffaa;
  background: rgba(0, 255, 170, 0.1);
  box-shadow: 0 0 5px rgba(0, 255, 170, 0.2);
}

:deep(.el-tag--danger) {
  color: #ff3366;
  border-color: #ff3366;
  background: rgba(255, 51, 102, 0.1);
  box-shadow: 0 0 5px rgba(255, 51, 102, 0.2);
}

:deep(.el-tag--warning) {
  color: #ffcc00;
  border-color: #ffcc00;
  background: rgba(255, 204, 0, 0.1);
  box-shadow: 0 0 5px rgba(255, 204, 0, 0.2);
}

:deep(.el-tag--info) {
  color: #00e5ff; /* 灰色改为青色系 */
  border-color: rgba(0, 229, 255, 0.5);
  background: rgba(0, 229, 255, 0.05);
}

/* 修复表格内部Checkbox样式 */
:deep(.el-checkbox__inner) {
  background-color: transparent;
  border-color: rgba(0, 255, 255, 0.5);
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #00e5ff;
  border-color: #00e5ff;
}

/* 分页样式 */
.pagination :deep(.el-pagination) {
  --el-pagination-bg-color: transparent;
  --el-pagination-text-color: #e7f6ff;
  --el-text-color-regular: #e7f6ff;
  --el-text-color-primary: #e7f6ff;
  --el-text-color-secondary: #e7f6ff;
  color: #e7f6ff !important;
}

.pagination :deep(.el-pagination *),
.pagination :deep(.el-pagination .el-pagination__total),
.pagination :deep(.el-pagination .el-pagination__jump),
.pagination :deep(.el-pagination .btn-prev),
.pagination :deep(.el-pagination .btn-next),
.pagination :deep(.el-pagination .el-pager li),
.pagination :deep(.el-pagination .el-select .el-input__inner),
.pagination :deep(.el-pagination .el-select .el-input__wrapper),
.pagination :deep(.el-pagination .el-select__wrapper .el-select__selected-item),
.pagination :deep(.el-pagination .el-select__placeholder) {
  color: #e7f6ff !important;
}

.pagination :deep(.el-pagination button:disabled) {
  background-color: transparent !important;
  color: rgba(231, 246, 255, 0.5) !important;
}

.pagination :deep(.el-pagination .btn-prev),
.pagination :deep(.el-pagination .btn-next) {
  background-color: transparent !important;
}

.pagination :deep(.el-pager li) {
  background-color: transparent !important;
}

.pagination :deep(.el-pager li.is-active) {
  color: #fff !important;
  font-weight: bold;
}

.pagination :deep(.el-pagination__editor.el-input .el-input__inner) {
  color: #e7f6ff !important;
}

/* 按钮样式增强 */
:deep(.el-button) {
  border-radius: 2px; /* 科技感矩形 */
  font-family: 'Segoe UI', sans-serif;
  letter-spacing: 1px;
  backdrop-filter: blur(4px);
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
}

:deep(.el-button::after) {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transform: rotate(45deg) translateX(-100%);
  transition: transform 0.5s;
}

:deep(.el-button:hover::after) {
  transform: rotate(45deg) translateX(100%);
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

:deep(.el-button--danger) {
  background: rgba(255, 51, 102, 0.2);
  border-color: #ff3366;
  color: #ff3366;
  box-shadow: 0 0 10px rgba(255, 51, 102, 0.2);
}

:deep(.el-button--danger:hover) {
  background: rgba(255, 51, 102, 0.4);
  box-shadow: 0 0 20px rgba(255, 51, 102, 0.4);
}

/* 默认按钮（如重置）透明化 */
:deep(.el-button):not(.el-button--primary):not(.el-button--success):not(.el-button--warning):not(
    .el-button--danger
  ):not(.el-button--info) {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(0, 255, 255, 0.2);
  color: #e7f6ff;
}

:deep(.el-button):not(.el-button--primary):not(.el-button--success):not(.el-button--warning):not(
    .el-button--danger
  ):not(.el-button--info):hover {
  background: rgba(0, 229, 255, 0.15);
  border-color: #00e5ff;
  color: #00e5ff;
}

/* 修复分页输入框背景 */
.pagination :deep(.el-pagination__editor.el-input .el-input__wrapper) {
  background: rgba(10, 25, 50, 0.4);
  box-shadow: none;
  border: 1px solid rgba(0, 255, 255, 0.2);
}

.pagination :deep(.el-pagination__editor.el-input .el-input__inner) {
  color: #e7f6ff !important;
}

/* 对话框样式 */
:deep(.el-dialog) {
  background: rgba(17, 32, 69, 0.95);
  border: 1px solid rgba(0, 255, 255, 0.3);
}

:deep(.el-dialog__title) {
  color: #00e5ff;
}

:deep(.el-dialog__headerbtn .el-dialog__close) {
  color: #a0cfff;
}

:deep(.el-radio) {
  color: #e7f6ff;
}

:deep(.el-tag) {
  border-radius: 4px;
}
</style>
