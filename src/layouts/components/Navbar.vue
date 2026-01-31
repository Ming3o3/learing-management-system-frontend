<template>
  <div class="navbar">
    <div class="left">
      <el-icon class="toggle-btn" @click="appStore.toggleSidebar">
        <Fold v-if="!appStore.sidebarCollapsed" />
        <Expand v-else />
      </el-icon>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path" :to="item.path">
          {{ item.meta.title }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="right">
      <!-- 用户信息 -->
      <el-dropdown @command="handleCommand">
        <div class="user-info">
          <el-avatar :size="32" :src="userStore.avatar">
            {{ userStore.username.charAt(0).toUpperCase() }}
          </el-avatar>
          <span class="username">{{ userStore.realName || userStore.username }}</span>
          <el-icon><CaretBottom /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>
              个人中心
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()

// 面包屑
const breadcrumbs = computed(() => {
  return route.matched.filter((item) => item.meta && item.meta.title)
})

// 下拉菜单命令处理
const handleCommand = (command) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'logout':
      handleLogout()
      break
  }
}

// 退出登录
const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      userStore.logout()
    })
    .catch(() => {})
}
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.toggle-btn {
  font-size: 20px;
  cursor: pointer;
  color: #a0cfff;
}

.toggle-btn:hover {
  color: #00e5ff;
  text-shadow: 0 0 8px rgba(0, 229, 255, 0.5);
}

.right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 4px;
  color: #a0cfff;
}

.user-info:hover {
  background-color: rgba(0, 229, 255, 0.1);
  color: #00e5ff;
}

.username {
  font-size: 14px;
  color: inherit;
}

/* 头像下拉菜单主题化（teleport） */
:global(.el-dropdown__popper),
:global(.el-popper.is-light) {
  background: rgba(12, 24, 52, 0.98);
  border: 1px solid rgba(0, 229, 255, 0.25);
  box-shadow: 0 0 16px rgba(0, 229, 255, 0.2);
}

:global(.el-dropdown-menu) {
  background: transparent;
}

:global(.el-dropdown-menu__item) {
  color: #e7f6ff;
}

:global(.el-dropdown-menu__item:hover) {
  background: rgba(0, 229, 255, 0.08);
  color: #b9dcff;
}

:global(.el-popper.is-light .el-popper__arrow::before) {
  background: rgba(12, 24, 52, 0.98);
  border: 1px solid rgba(0, 229, 255, 0.25);
}

:deep(.el-breadcrumb__inner) {
  color: #607d9c !important;
}

:deep(.el-breadcrumb__inner.is-link) {
  color: #a0cfff !important;
}

:deep(.el-breadcrumb__inner.is-link:hover) {
  color: #00e5ff !important;
  text-shadow: 0 0 5px rgba(0, 229, 255, 0.5);
}

:deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: #00e5ff !important;
}
</style>
