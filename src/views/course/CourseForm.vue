<template>
  <div class="course-form">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ isEdit ? '编辑课程' : '新增课程' }}</span>
        </div>
      </template>

      <el-form ref="courseFormRef" :model="courseForm" :rules="formRules" label-width="120px">
        <el-form-item label="课程名称" prop="courseName">
          <el-input v-model="courseForm.courseName" placeholder="请输入课程名称" />
        </el-form-item>

        <el-form-item label="课程简介" prop="description">
          <el-input
            v-model="courseForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入课程简介"
          />
        </el-form-item>

        <el-form-item label="授课教师" prop="teacherId">
          <el-select
            v-model="courseForm.teacherId"
            placeholder="请选择授课教师"
            filterable
            :disabled="isTeacher"
          >
            <el-option
              v-for="teacher in teachers"
              :key="teacher.id"
              :label="teacher.realName"
              :value="teacher.id"
            />
          </el-select>
          <span v-if="isTeacher" style="margin-left: 10px; color: #909399; font-size: 12px">
            授课教师默认为本人
          </span>
        </el-form-item>

        <el-form-item label="学分" prop="credit">
          <el-input-number v-model="courseForm.credit" :min="0" :max="10" :precision="1" />
        </el-form-item>

        <el-form-item label="开课时间" prop="startDate">
          <el-date-picker
            v-model="courseForm.startDate"
            type="date"
            placeholder="选择开课时间"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <el-form-item label="结课时间" prop="endDate">
          <el-date-picker
            v-model="courseForm.endDate"
            type="date"
            placeholder="选择结课时间"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <el-form-item label="课程内容" prop="content">
          <el-input
            v-model="courseForm.content"
            type="textarea"
            :rows="8"
            placeholder="请输入课程内容（支持Markdown格式）"
          />
        </el-form-item>

        <el-form-item label="课程状态" prop="status">
          <el-radio-group v-model="courseForm.status">
            <el-radio :label="0">草稿</el-radio>
            <el-radio :label="1">发布</el-radio>
            <el-radio :label="2">归档</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
            {{ submitLoading ? '提交中...' : '提交' }}
          </el-button>
          <el-button @click="handleCancel">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getCourseById, createCourse, updateCourse } from '@/api/course'
import { getTeachers } from '@/api/user'
import { required } from '@/utils/validate'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const courseFormRef = ref(null)
const submitLoading = ref(false)
const teachers = ref([])

const isEdit = computed(() => !!route.params.id)
const isTeacher = computed(() => userStore.isTeacher)

const courseForm = reactive({
  courseName: '',
  description: '',
  teacherId: null,
  credit: 2,
  startDate: '',
  endDate: '',
  content: '',
  status: 0,
})

const validateEndDate = (rule, value, callback) => {
  if (value && courseForm.startDate && value <= courseForm.startDate) {
    callback(new Error('结课时间必须晚于开课时间'))
  } else {
    callback()
  }
}

const formRules = {
  courseName: [required],
  description: [required],
  teacherId: [required],
  credit: [required],
  startDate: [required],
  endDate: [required, { validator: validateEndDate, trigger: 'blur' }],
  status: [required],
}

onMounted(async () => {
  await loadTeachers()
  if (isEdit.value) {
    await loadCourseDetail()
  }
})

const loadTeachers = async () => {
  try {
    const res = await getTeachers()
    teachers.value = res.data

    // 如果是教师角色且不是编辑模式，默认设置为当前用户
    if (isTeacher.value && !isEdit.value) {
      const currentUser = userStore.userInfo
      if (currentUser && currentUser.id) {
        courseForm.teacherId = currentUser.id
      }
    }
  } catch (error) {
    console.error('Load teachers failed:', error)
  }
}

const loadCourseDetail = async () => {
  try {
    const res = await getCourseById(route.params.id)
    const data = res.data
    Object.assign(courseForm, {
      ...data,
      startDate: data.startTime,
      endDate: data.endTime
    })
  } catch (error) {
    console.error('Load course detail failed:', error)
    ElMessage.error('加载课程详情失败')
    router.back()
  }
}

const handleSubmit = async () => {
  try {
    await courseFormRef.value.validate()
    submitLoading.value = true

    const submitData = {
      ...courseForm,
      startTime: courseForm.startDate,
      endTime: courseForm.endDate
    }

    if (isEdit.value) {
      await updateCourse(route.params.id, submitData)
      ElMessage.success('更新成功')
    } else {
      await createCourse(submitData)
      ElMessage.success('创建成功')
    }

    router.push('/courses')
  } catch (error) {
    console.error('Submit course failed:', error)
  } finally {
    submitLoading.value = false
  }
}

const handleCancel = () => {
  router.back()
}
</script>

<style scoped>
.course-form {
  padding: 20px;
}

.card-header {
  font-size: 18px;
  font-weight: 600;
}
</style>
