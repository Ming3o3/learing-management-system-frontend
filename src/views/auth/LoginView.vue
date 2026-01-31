<template>
  <div class="login-container">
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>
    <div class="particles">
      <div v-for="i in 15" :key="i" class="particle" :style="getParticleStyle(i)"></div>
    </div>
    <div class="login-box">
      <div class="login-header">
        <h1 class="title" data-text="学习管理系统">学习管理系统</h1>
        <p class="subtitle">Learning Management System</p>
      </div>

      <el-form ref="loginFormRef" :model="loginForm" :rules="rules" class="login-form">
        <el-form-item prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" size="large" clearable>
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            show-password
            @keyup.enter="handleLogin"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="login-btn"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>

        <div class="links">
          <router-link to="/register" class="link">还没有账号？立即注册</router-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { required } from '@/utils/validate'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: '',
})

const rules = {
  username: [required],
  password: [required],
}

const getParticleStyle = (i) => {
  const size = Math.random() * 3 + 1 + 'px'
  return {
    width: size,
    height: size,
    left: Math.random() * 100 + '%',
    top: Math.random() * 100 + '%',
    animationDelay: Math.random() * 5 + 's',
    animationDuration: Math.random() * 10 + 10 + 's',
    opacity: Math.random() * 0.5 + 0.3,
  }
}

const handleLogin = async () => {
  try {
    await loginFormRef.value.validate()
    loading.value = true

    await userStore.login(loginForm)

    ElMessage.success('登录成功')

    // 跳转到原来要访问的页面或首页
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (error) {
    console.error('Login failed:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@keyframes grid-move {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 50px 50px;
  }
}

@keyframes neon-breath {
  0%,
  100% {
    text-shadow:
      0 0 10px rgba(0, 229, 255, 0.6),
      0 0 20px rgba(0, 229, 255, 0.4);
  }
  50% {
    text-shadow:
      0 0 15px rgba(0, 229, 255, 0.9),
      0 0 35px rgba(0, 229, 255, 0.7),
      0 0 45px rgba(130, 0, 255, 0.5);
  }
}

@keyframes btn-breath {
  0%,
  100% {
    box-shadow: 0 0 12px rgba(0, 229, 255, 0.5);
  }
  50% {
    box-shadow:
      0 0 25px rgba(0, 229, 255, 0.8),
      0 0 8px rgba(0, 229, 255, 0.9) inset;
  }
}

@keyframes particle-float {
  0% {
    transform: translateY(0) translateX(0);
    opacity: 0;
  }
  20% {
    opacity: 0.8;
  }
  80% {
    opacity: 0.8;
  }
  100% {
    transform: translateY(-100px) translateX(20px);
    opacity: 0;
  }
}

@keyframes glitch-skew {
  0% {
    transform: skew(0deg);
  }
  20% {
    transform: skew(-0.8deg);
  }
  40% {
    transform: skew(0.8deg);
  }
  60% {
    transform: skew(-0.4deg);
  }
  80% {
    transform: skew(0.4deg);
  }
  100% {
    transform: skew(0deg);
  }
}

@keyframes glitch-anim-1 {
  0% {
    clip-path: inset(20% 0 80% 0);
    transform: translate(-2px, 1px);
  }
  20% {
    clip-path: inset(60% 0 10% 0);
    transform: translate(2px, -1px);
  }
  40% {
    clip-path: inset(40% 0 50% 0);
    transform: translate(-2px, 2px);
  }
  60% {
    clip-path: inset(80% 0 5% 0);
    transform: translate(2px, -2px);
  }
  animation: grid-move 20s linear infinite;
}

.particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.particle {
  position: absolute;
  background: #00e5ff;
  border-radius: 50%;
  box-shadow: 0 0 8px #00e5ff;
  animation: particle-float linear infinite;
  80% {
    clip-path: inset(10% 0 60% 0);
    transform: translate(-1px, 1px);
  }
  100% {
    clip-path: inset(50% 0 30% 0);
    transform: translate(1px, -1px);
  }
}

@keyframes glitch-anim-2 {
  0% {
    clip-path: inset(10% 0 60% 0);
    transform: translate(1px, -1px);
  }
  20% {
    clip-path: inset(30% 0 20% 0);
    transform: translate(-1px, 1px);
  }
  40% {
    clip-path: inset(70% 0 10% 0);
    transform: translate(1px, 1px);
  }
  60% {
    clip-path: inset(20% 0 50% 0);
    transform: translate(-1px, -1px);
  }
  80% {
    clip-path: inset(50% 0 30% 0);
    transform: translate(1px, -2px);
  }
  100% {
    clip-path: inset(0% 0 90% 0);
    transform: translate(-2px, 1px);
  }
}
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(1200px 800px at 20% 10%, rgba(0, 200, 255, 0.3), transparent 60%),
    radial-gradient(1000px 700px at 80% 20%, rgba(130, 0, 255, 0.3), transparent 60%),
    linear-gradient(180deg, #101935 0%, #162450 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 255, 255, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 255, 0.06) 1px, transparent 1px);
  background-size: 32px 32px;
  mask-image: radial-gradient(circle at center, rgba(0, 0, 0, 0.9), transparent 70%);
  pointer-events: none;
}

.bg-glow {
  position: absolute;
  width: 480px;
  height: 480px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 255, 255, 0.25), transparent 70%);
  filter: blur(20px);
  top: -120px;
  right: -120px;
  pointer-events: none;
}

.login-box {
  width: 400px;
  background: rgba(17, 32, 69, 0.65);
  border-radius: 14px;
  padding: 40px;
  border: 1px solid rgba(0, 255, 255, 0.35);
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.45),
    0 0 20px rgba(0, 255, 255, 0.2);
  backdrop-filter: blur(12px);
  position: relative;
  z-index: 10;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.title {
  font-size: 28px;
  font-weight: 700;
  color: #e7f6ff;
  margin-bottom: 10px;
  position: relative;
  display: inline-block;
  animation: neon-breath 3s ease-in-out infinite alternate;
}

.title:hover {
  animation: glitch-skew 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both infinite;
  color: #e7f6ff;
}

.title:hover::before,
.title:hover::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(12, 20, 45, 0.8);
}

.title:hover::before {
  left: 2px;
  text-shadow: -2px 0 #ff00de;
  clip-path: inset(0 0 0 0);
  animation: glitch-anim-1 2s infinite linear alternate-reverse;
}

.title:hover::after {
  left: -2px;
  text-shadow: -2px 0 #00e5ff;
  clip-path: inset(0 0 0 0);
  animation: glitch-anim-2 2s infinite linear alternate-reverse;
}

.subtitle {
  font-size: 14px;
  color: rgba(231, 246, 255, 0.7);
}

.login-form {
  margin-top: 30px;
}

.login-btn {
  width: 100%;
  margin-top: 10px;
  background: linear-gradient(90deg, #00e5ff, #6b6bff);
  border: none;
  box-shadow: 0 0 16px rgba(0, 229, 255, 0.4);
}

.login-btn:hover {
  filter: brightness(1.05);
}

.links {
  text-align: center;
  margin-top: 20px;
}

.link {
  color: #74f0ff;
  text-decoration: none;
  font-size: 14px;
}

.link:hover {
  color: #b2f7ff;
}

:deep(.el-input__wrapper) {
  background: rgba(10, 25, 50, 0.4);
  border: 1px solid rgba(0, 255, 255, 0.3);
  box-shadow: inset 0 0 0 1px rgba(0, 255, 255, 0.1);
  color: #e7f6ff;
}

:deep(.el-input__inner) {
  color: #e7f6ff;
}

:deep(.el-input__wrapper.is-focus) {
  border-color: rgba(116, 240, 255, 0.9);
  box-shadow: 0 0 0 2px rgba(0, 229, 255, 0.2);
}

:deep(.el-form-item__error) {
  color: #ff7adf;
}
</style>
