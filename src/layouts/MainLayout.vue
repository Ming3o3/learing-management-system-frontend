<template>
  <div class="main-layout">
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>
    <el-container class="layout-container">
      <!-- 侧边栏 -->
      <el-aside :width="appStore.sidebarWidth + 'px'" class="sidebar">
        <Sidebar />
      </el-aside>
      <el-container class="main-container">
        <!-- 顶部导航栏 -->
        <el-header height="60px" class="header">
          <Navbar />
        </el-header>

        <!-- 内容区域 -->
        <el-main class="content">
          <router-view v-slot="{ Component }">
            <transition name="fade-transform" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { useAppStore } from '@/stores/app'
import Sidebar from './components/Sidebar.vue'
import Navbar from './components/Navbar.vue'

const appStore = useAppStore()
</script>

<style scoped>
.main-layout {
  height: 100%;
  position: relative;
  background: linear-gradient(180deg, #101935 0%, #162450 100%);
  overflow: hidden;
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(circle at center, rgba(0, 0, 0, 0.9), transparent 70%);
  pointer-events: none;
  z-index: 0;
}

.bg-glow {
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 255, 255, 0.25), transparent 70%);
  filter: blur(50px);
  top: -200px;
  right: -200px;
  pointer-events: none;
  z-index: 0;
}

.layout-container {
  height: 100%;
  position: relative;
  z-index: 1;
}

.sidebar {
  background-color: rgba(17, 32, 69, 0.85);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(0, 255, 255, 0.2);
  transition: width 0.3s;
  overflow-x: hidden;
}

.main-container {
  background-color: transparent;
}

.header {
  background-color: rgba(17, 32, 69, 0.5);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 255, 255, 0.2);
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.content {
  padding: 20px;
  min-height: calc(100vh - 60px);
}

/* 页面切换动画 */
.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all 0.2s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
