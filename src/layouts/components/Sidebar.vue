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
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        router
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
          <el-menu-item v-if="!userStore.isStudent" index="/courses/create"
            >创建课程</el-menu-item
          >
        </el-sub-menu>

        <!-- 作业 -->
        <el-sub-menu index="homework">
          <template #title>
            <el-icon><Edit /></el-icon>
            <span>作业管理</span>
          </template>
          <el-menu-item index="/homework">作业列表</el-menu-item>
          <el-menu-item v-if="!userStore.isStudent" index="/homework/create"
            >发布作业</el-menu-item
          >
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
        </el-sub-menu>

        <!-- 成绩 -->
        <el-sub-menu index="scores">
          <template #title>
            <el-icon><TrendCharts /></el-icon>
            <span>成绩管理</span>
          </template>
          <el-menu-item v-if="userStore.isStudent" index="/my-scores">我的成绩</el-menu-item>
          <el-menu-item v-if="!userStore.isStudent" index="/scores">成绩管理</el-menu-item>
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
  background-color: #2b2f3a;
  border-bottom: 1px solid #1f2d3d;
}

.logo {
  width: 32px;
  height: 32px;
  margin-right: 10px;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
}

.title-mini {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
}

.menu-scrollbar {
  flex: 1;
  overflow-y: auto;
}

:deep(.el-menu) {
  border-right: none;
}

:deep(.el-sub-menu__title) {
  color: #bfcbd9;
}

:deep(.el-sub-menu__title:hover) {
  background-color: #263445 !important;
}
</style>
