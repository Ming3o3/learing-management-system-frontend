<template>
  <div class="paper-form">
    <el-card>
      <template #header>
        <span>{{ isEdit ? '编辑试卷' : '新增试卷' }}</span>
      </template>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        style="max-width: 800px"
      >
        <el-form-item label="课程" prop="courseId">
          <el-select
            v-model="formData.courseId"
            placeholder="请选择课程"
            style="width: 100%"
            :disabled="isEdit"
          >
            <el-option
              v-for="course in courseList"
              :key="course.id"
              :label="course.courseName"
              :value="course.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="试卷名称" prop="paperName">
          <el-input
            v-model="formData.paperName"
            placeholder="请输入试卷名称"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="试卷描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="4"
            placeholder="请输入试卷描述"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="总分" prop="totalScore">
              <el-input-number
                v-model="formData.totalScore"
                :min="0"
                :max="1000"
                :precision="1"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="考试时长" prop="duration">
              <el-input-number
                v-model="formData.duration"
                :min="1"
                :max="999"
                style="width: 100%"
              />
              <span style="margin-left: 10px">分钟</span>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始时间" prop="startTime">
              <el-date-picker
                v-model="formData.startTime"
                type="datetime"
                placeholder="请选择开始时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DDTHH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间" prop="endTime">
              <el-date-picker
                v-model="formData.endTime"
                type="datetime"
                placeholder="请选择结束时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DDTHH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="及格分数" prop="passScore">
          <el-input-number
            v-model="formData.passScore"
            :min="0"
            :max="formData.totalScore"
            :precision="1"
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item label="允许查看答案" prop="allowViewAnswer">
          <el-switch
            v-model="formData.allowViewAnswer"
            :active-value="1"
            :inactive-value="0"
            active-text="是"
            inactive-text="否"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit">保存</el-button>
          <el-button @click="handleCancel">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCourseList } from '@/api/course'
import { createPaper, updatePaper, getPaperById } from '@/api/exam'

const router = useRouter()
const route = useRoute()

const formRef = ref(null)
const isEdit = ref(false)
const courseList = ref([])

const formData = reactive({
  id: null,
  courseId: null,
  paperName: '',
  description: '',
  totalScore: 100,
  duration: 60,
  startTime: '',
  endTime: '',
  passScore: 60,
  allowViewAnswer: 0,
  status: 0
})

const formRules = {
  courseId: [{ required: true, message: '请选择课程', trigger: 'change' }],
  paperName: [
    { required: true, message: '请输入试卷名称', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  totalScore: [{ required: true, message: '请输入总分', trigger: 'blur' }],
  duration: [{ required: true, message: '请输入考试时长', trigger: 'blur' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [
    { required: true, message: '请选择结束时间', trigger: 'change' },
    {
      validator: (rule, value, callback) => {
        if (value && formData.startTime && value <= formData.startTime) {
          callback(new Error('结束时间必须大于开始时间'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  passScore: [{ required: true, message: '请输入及格分数', trigger: 'blur' }]
}

onMounted(async () => {
  await loadCourseList()

  // 判断是编辑还是新增
  const id = route.params.id
  if (id) {
    isEdit.value = true
    await loadPaperDetail(id)
  }
})

/**
 * 加载课程列表
 */
const loadCourseList = async () => {
  try {
    const res = await getCourseList({ status: 1 })
    courseList.value = res.data || []
  } catch (error) {
    ElMessage.error('加载课程列表失败')
    console.error(error)
  }
}

/**
 * 加载试卷详情
 */
const loadPaperDetail = async (id) => {
  try {
    const res = await getPaperById(id)
    if (res.code === 200) {
      Object.assign(formData, res.data)
    }
  } catch (error) {
    ElMessage.error('加载试卷详情失败')
    console.error(error)
  }
}

/**
 * 提交
 */
const handleSubmit = async () => {
  try {
    await formRef.value.validate()

    const apiMethod = isEdit.value ? updatePaper : createPaper
    const res = await apiMethod(formData)

    if (res.code === 200) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      router.back()
    }
  } catch (error) {
    if (error !== false) {
      ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
      console.error(error)
    }
  }
}

/**
 * 取消
 */
const handleCancel = () => {
  router.back()
}
</script>

<style scoped>
.paper-form {
  padding: 20px;
}
</style>
