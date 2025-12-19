/**
 * 路由配置
 */
import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import NProgress from 'nprogress'

/**
 * 路由配置
 */
const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/RegisterView.vue'),
    meta: { title: '注册', requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        meta: { title: '工作台' }
      },
      // 用户管理
      {
        path: 'users',
        name: 'UserList',
        component: () => import('@/views/user/UserList.vue'),
        meta: { title: '用户管理', roles: ['ADMIN'] }
      },
      // 个人中心
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/user/ProfileView.vue'),
        meta: { title: '个人中心' }
      },
      // 课程管理
      {
        path: 'courses',
        name: 'CourseList',
        component: () => import('@/views/course/CourseList.vue'),
        meta: { title: '课程列表' }
      },
      {
        path: 'courses/create',
        name: 'CourseCreate',
        component: () => import('@/views/course/CourseForm.vue'),
        meta: { title: '创建课程', roles: ['ADMIN', 'TEACHER'] }
      },
      {
        path: 'courses/:id/edit',
        name: 'CourseEdit',
        component: () => import('@/views/course/CourseForm.vue'),
        meta: { title: '编辑课程', roles: ['ADMIN', 'TEACHER'] }
      },
      {
        path: 'courses/:id',
        name: 'CourseDetail',
        component: () => import('@/views/course/CourseDetail.vue'),
        meta: { title: '课程详情' }
      },
      {
        path: 'my-courses',
        name: 'MyCourses',
        component: () => import('@/views/course/MyCourses.vue'),
        meta: { title: '我的课程', roles: ['STUDENT'] }
      },
      // 作业管理
      {
        path: 'homework',
        name: 'HomeworkList',
        component: () => import('@/views/homework/HomeworkList.vue'),
        meta: { title: '作业列表' }
      },
      {
        path: 'homework/create',
        name: 'HomeworkCreate',
        component: () => import('@/views/homework/HomeworkForm.vue'),
        meta: { title: '发布作业', roles: ['ADMIN', 'TEACHER'] }
      },
      {
        path: 'homework/:id',
        name: 'HomeworkDetail',
        component: () => import('@/views/homework/HomeworkDetail.vue'),
        meta: { title: '作业详情' }
      },
      {
        path: 'homework/:id/submit',
        name: 'HomeworkSubmit',
        component: () => import('@/views/homework/HomeworkSubmit.vue'),
        meta: { title: '提交作业', roles: ['STUDENT'] }
      },
      // 考试管理
      // 试卷管理
      {
        path: 'exam/papers',
        name: 'PaperList',
        component: () => import('@/views/exam/PaperList.vue'),
        meta: { title: '试卷列表' }
      },
      {
        path: 'exam/paper/add',
        name: 'PaperAdd',
        component: () => import('@/views/exam/PaperForm.vue'),
        meta: { title: '新增试卷', roles: ['ADMIN', 'TEACHER'] }
      },
      {
        path: 'exam/paper/edit/:id',
        name: 'PaperEdit',
        component: () => import('@/views/exam/PaperForm.vue'),
        meta: { title: '编辑试卷', roles: ['ADMIN', 'TEACHER'] }
      },
      {
        path: 'exam/paper/detail/:id',
        name: 'PaperDetail',
        component: () => import('@/views/exam/PaperDetail.vue'),
        meta: { title: '试卷详情' }
      },
      // 试题管理
      {
        path: 'exam/questions',
        name: 'QuestionList',
        component: () => import('@/views/exam/QuestionList.vue'),
        meta: { title: '试题管理', roles: ['ADMIN', 'TEACHER'] }
      },
      {
        path: 'exam/question/add',
        name: 'QuestionAdd',
        component: () => import('@/views/exam/QuestionForm.vue'),
        meta: { title: '新增试题', roles: ['ADMIN', 'TEACHER'] }
      },
      {
        path: 'exam/question/edit/:id',
        name: 'QuestionEdit',
        component: () => import('@/views/exam/QuestionForm.vue'),
        meta: { title: '编辑试题', roles: ['ADMIN', 'TEACHER'] }
      },
      // 参加考试
      {
        path: 'exam/take/:id',
        name: 'StudentExam',
        component: () => import('@/views/exam/StudentExam.vue'),
        meta: { title: '参加考试', roles: ['STUDENT'] }
      },
      // 考试记录
      {
        path: 'exam/records',
        name: 'ExamRecordList',
        component: () => import('@/views/exam/ExamRecordList.vue'),
        meta: { title: '考试记录' }
      },
      // 成绩管理
      {
        path: 'scores',
        name: 'ScoreList',
        component: () => import('@/views/score/ScoreList.vue'),
        meta: { title: '成绩管理' }
      },
      {
        path: 'my-scores',
        name: 'MyScores',
        component: () => import('@/views/score/MyScores.vue'),
        meta: { title: '我的成绩', roles: ['STUDENT'] }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/NotFound.vue'),
    meta: { title: '404' }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

/**
 * 路由守卫
 */
router.beforeEach((to, from, next) => {
  NProgress.start()

  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 学习管理系统` : '学习管理系统'

  const userStore = useUserStore()
  const requiresAuth = to.meta.requiresAuth !== false
  const requiredRoles = to.meta.roles || []

  // 不需要登录的页面直接放行
  if (!requiresAuth) {
    next()
    return
  }

  // 检查登录状态
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  // 检查角色权限
  if (requiredRoles.length > 0) {
    const hasRole = requiredRoles.some((role) => userStore.roles.includes(role))
    if (!hasRole) {
      ElMessage.error('您没有权限访问该页面')
      next({ path: '/dashboard' })
      return
    }
  }

  next()
})

router.afterEach(() => {
  NProgress.done()
})

export default router

