<template>
  <div class="sidebar-container">
    <!-- Logo -->
    <div class="logo-container">
      <img v-if="!appStore.sidebarCollapsed" src="@/assets/logo.svg" class="logo" />
      <h1 v-if="!appStore.sidebarCollapsed" class="title">学习管理系统</h1>
      <h1 v-else class="title-mini">LMS</h1>
    </div>

    <!-- 菜单 -->
    <el-scrollbar class="menu-scrollbar">
      <el-menu
        :default-active="activeMenu"
        :collapse="appStore.sidebarCollapsed"
        :unique-opened="true"
        background-color="transparent"
        text-color="#a0cfff"
        active-text-color="#00e5ff"
        router
        class="custom-menu"
      >
        <!-- 工作台 -->
        <el-menu-item index="/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <template #title>工作台</template>
        </el-menu-item>

        <!-- 用户管理 - 仅管理员 -->
        <el-menu-item v-if="userStore.isAdmin" index="/users">
          <el-icon><User /></el-icon>
          <template #title>用户管理</template>
        </el-menu-item>

        <!-- 课程 -->
        <el-sub-menu index="courses">
          <template #title>
            <el-icon><Reading /></el-icon>
            <span>课程管理</span>
          </template>
          <el-menu-item index="/courses">课程列表</el-menu-item>
          <el-menu-item v-if="userStore.isStudent" index="/my-courses">我的课程</el-menu-item>
          <el-menu-item v-if="!userStore.isStudent" index="/courses/create">创建课程</el-menu-item>
        </el-sub-menu>

        <!-- 作业 -->
        <el-sub-menu index="homework">
          <template #title>
            <el-icon><Edit /></el-icon>
            <span>作业管理</span>
          </template>
          <el-menu-item index="/homework">作业列表</el-menu-item>
          <el-menu-item v-if="!userStore.isStudent" index="/homework/create">发布作业</el-menu-item>
        </el-sub-menu>

        <!-- 考试 -->
        <el-sub-menu index="exams">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>考试管理</span>
          </template>
          <el-menu-item index="/exam/papers">试卷列表</el-menu-item>
          <el-menu-item v-if="!userStore.isStudent" index="/exam/questions">题库管理</el-menu-item>
          <el-menu-item index="/exam/records">考试记录</el-menu-item>
          <el-menu-item index="/exam/violations">违规记录</el-menu-item>
        </el-sub-menu>

        <!-- 成绩 -->
        <el-sub-menu index="scores">
          <template #title>
            <el-icon><TrendCharts /></el-icon>
            <span>成绩管理</span>
          </template>
          <el-menu-item v-if="userStore.isStudent" index="/my-scores">我的成绩</el-menu-item>
          <el-menu-item v-if="!userStore.isStudent" index="/scores">成绩管理</el-menu-item>
          <el-menu-item index="/score/verify">成绩验真</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const appStore = useAppStore()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)
</script>

<style scoped>
.sidebar-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  border-bottom: 1px solid rgba(0, 255, 255, 0.1);
}

.logo {
  width: 32px;
  height: 32px;
  margin-right: 10px;
  filter: drop-shadow(0 0 5px rgba(0, 229, 255, 0.5));
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #e7f6ff;
  white-space: nowrap;
  text-shadow: 0 0 10px rgba(0, 229, 255, 0.3);
}

.title-mini {
  font-size: 20px;
  font-weight: 700;
  color: #00e5ff;
}

.menu-scrollbar {
  flex: 1;
  overflow-y: auto;
}

.custom-menu {
  border-right: none;
  background-color: transparent !important;
}

:deep(.el-menu) {
  border-right: none;
  background-color: transparent !important;
}

:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  background-color: transparent !important;
}

:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  background-color: rgba(0, 229, 255, 0.15) !important;
  color: #00e5ff !important;
}

:deep(.el-menu-item.is-active) {
  background: linear-gradient(90deg, rgba(0, 229, 255, 0.25), transparent) !important;
  border-left: 2px solid #00e5ff;
}

:deep(.el-sub-menu__title) {
  color: #a0cfff;
}
</style>
