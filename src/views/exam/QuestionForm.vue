<template>
  <div class="question-form">
    <el-card>
      <template #header>
        <span>{{ isEdit ? '编辑试题' : '新增试题' }}</span>
      </template>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        style="max-width: 900px"
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

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="题型" prop="questionType">
              <el-select
                v-model="formData.questionType"
                placeholder="请选择题型"
                style="width: 100%"
                @change="handleQuestionTypeChange"
              >
                <el-option label="单选题" :value="1" />
                <el-option label="多选题" :value="2" />
                <el-option label="判断题" :value="3" />
                <el-option label="填空题" :value="4" />
                <el-option label="简答题" :value="5" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="难度" prop="difficulty">
              <el-select v-model="formData.difficulty" placeholder="请选择难度" style="width: 100%">
                <el-option label="简单" :value="1" />
                <el-option label="中等" :value="2" />
                <el-option label="困难" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="题目" prop="title">
          <el-input
            v-model="formData.title"
            type="textarea"
            :rows="3"
            placeholder="请输入题目"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <!-- 单选题选项 -->
        <template v-if="formData.questionType === 1">
          <el-form-item
            v-for="(option, index) in singleChoiceOptions"
            :key="index"
            :label="`选项${option.key}`"
            :prop="`options.${option.key}`"
          >
            <div class="option-input-wrapper">
              <el-input
                v-model="option.value"
                placeholder="请输入选项内容"
                maxlength="200"
                show-word-limit
              />
              <div class="option-actions">
                <el-button
                  v-if="index === singleChoiceOptions.length - 1 && index < 9"
                  type="success"
                  size="small"
                  :icon="Plus"
                  @click="addOption"
                >
                  添加
                </el-button>
                <el-button
                  v-if="index > 3"
                  type="danger"
                  size="small"
                  :icon="Delete"
                  @click="removeOption(index)"
                >
                  删除
                </el-button>
              </div>
            </div>
          </el-form-item>
          <el-form-item label="正确答案" prop="answer">
            <el-radio-group v-model="formData.answer">
              <el-radio
                v-for="option in singleChoiceOptions"
                :key="option.key"
                :label="option.key"
              >
                {{ option.key }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </template>

        <!-- 多选题选项 -->
        <template v-else-if="formData.questionType === 2">
          <el-form-item
            v-for="(option, index) in multipleChoiceOptions"
            :key="index"
            :label="`选项${option.key}`"
          >
            <div class="option-input-wrapper">
              <el-input
                v-model="option.value"
                placeholder="请输入选项内容"
                maxlength="200"
                show-word-limit
              />
              <div class="option-actions">
                <el-button
                  v-if="index === multipleChoiceOptions.length - 1 && index < 9"
                  type="success"
                  size="small"
                  :icon="Plus"
                  @click="addOption"
                >
                  添加
                </el-button>
                <el-button
                  v-if="index > 3"
                  type="danger"
                  size="small"
                  :icon="Delete"
                  @click="removeOption(index)"
                >
                  删除
                </el-button>
              </div>
            </div>
          </el-form-item>
          <el-form-item label="正确答案" prop="answer">
            <el-checkbox-group v-model="multipleAnswers">
              <el-checkbox
                v-for="option in multipleChoiceOptions"
                :key="option.key"
                :label="option.key"
              >
                {{ option.key }}
              </el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </template>

        <!-- 判断题 -->
        <template v-else-if="formData.questionType === 3">
          <el-form-item label="正确答案" prop="answer">
            <el-radio-group v-model="formData.answer">
              <el-radio label="A">正确</el-radio>
              <el-radio label="B">错误</el-radio>
            </el-radio-group>
          </el-form-item>
        </template>

        <!-- 填空题/简答题答案 -->
        <template v-else>
          <el-form-item label="参考答案" prop="answer">
            <el-input
              v-model="formData.answer"
              type="textarea"
              :rows="4"
              placeholder="请输入参考答案"
              maxlength="1000"
              show-word-limit
            />
          </el-form-item>
        </template>

        <el-form-item label="答案解析">
          <el-input
            v-model="formData.analysis"
            type="textarea"
            :rows="4"
            placeholder="请输入答案解析(可选)"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="分值" prop="score">
          <el-input-number v-model="formData.score" :min="0" :max="100" :precision="1" />
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
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import { getCourseList } from '@/api/course'
import { createQuestion, updateQuestion, getQuestionById } from '@/api/exam'

const router = useRouter()
const route = useRoute()

const formRef = ref(null)
const isEdit = ref(false)
const courseList = ref([])

const formData = reactive({
  id: null,
  courseId: null,
  questionType: 1,
  title: '',
  options: '',
  answer: '',
  analysis: '',
  difficulty: 1,
  score: 5.0
})

const formRules = {
  courseId: [{ required: true, message: '请选择课程', trigger: 'change' }],
  questionType: [{ required: true, message: '请选择题型', trigger: 'change' }],
  difficulty: [{ required: true, message: '请选择难度', trigger: 'change' }],
  title: [
    { required: true, message: '请输入题目', trigger: 'blur' },
    { min: 2, max: 500, message: '长度在 2 到 500 个字符', trigger: 'blur' }
  ],
  answer: [{ required: true, message: '请输入答案', trigger: 'blur' }],
  score: [{ required: true, message: '请输入分值', trigger: 'blur' }]
}

// 单选题选项
const singleChoiceOptions = ref([
  { key: 'A', value: '' },
  { key: 'B', value: '' },
  { key: 'C', value: '' },
  { key: 'D', value: '' }
])

// 多选题选项
const multipleChoiceOptions = ref([
  { key: 'A', value: '' },
  { key: 'B', value: '' },
  { key: 'C', value: '' },
  { key: 'D', value: '' }
])

// 多选题答案
const multipleAnswers = ref([])

// 监听多选题答案变化
watch(multipleAnswers, (newVal) => {
  formData.answer = newVal.sort().join(',')
})

onMounted(async () => {
  await loadCourseList()

  // 判断是编辑还是新增
  const id = route.params.id
  if (id) {
    isEdit.value = true
    await loadQuestionDetail(id)
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
 * 加载试题详情
 */
const loadQuestionDetail = async (id) => {
  try {
    const res = await getQuestionById(id)
    if (res.code === 200) {
      Object.assign(formData, res.data)

      // 解析选项
      if (formData.options) {
        const options = JSON.parse(formData.options)
        if (formData.questionType === 1) {
          singleChoiceOptions.value = Object.keys(options).map((key) => ({
            key,
            value: options[key]
          }))
        } else if (formData.questionType === 2) {
          multipleChoiceOptions.value = Object.keys(options).map((key) => ({
            key,
            value: options[key]
          }))
          multipleAnswers.value = formData.answer.split(',')
        }
      }
    }
  } catch (error) {
    ElMessage.error('加载试题详情失败')
    console.error(error)
  }
}

/**
 * 题型改变
 */
const handleQuestionTypeChange = () => {
  formData.answer = ''
  formData.options = ''
  multipleAnswers.value = []

  // 重置选项
  if (formData.questionType === 1 || formData.questionType === 2) {
    const options = [
      { key: 'A', value: '' },
      { key: 'B', value: '' },
      { key: 'C', value: '' },
      { key: 'D', value: '' }
    ]
    if (formData.questionType === 1) {
      singleChoiceOptions.value = options
    } else {
      multipleChoiceOptions.value = options
    }
  } else if (formData.questionType === 3) {
    formData.options = '{"A":"正确","B":"错误"}'
  }
}

/**
 * 添加选项
 */
const addOption = () => {
  const letters = 'ABCDEFGHIJ'
  const currentOptions =
    formData.questionType === 1 ? singleChoiceOptions.value : multipleChoiceOptions.value
  const nextKey = letters[currentOptions.length]

  if (nextKey) {
    currentOptions.push({ key: nextKey, value: '' })
  }
}

/**
 * 删除选项
 */
const removeOption = (index) => {
  if (formData.questionType === 1) {
    singleChoiceOptions.value.splice(index, 1)
  } else {
    multipleChoiceOptions.value.splice(index, 1)
  }
}

/**
 * 提交
 */
const handleSubmit = async () => {
  try {
    await formRef.value.validate()

    // 组装选项JSON
    if (formData.questionType === 1 || formData.questionType === 2) {
      const options =
        formData.questionType === 1 ? singleChoiceOptions.value : multipleChoiceOptions.value
      const optionsObj = {}
      options.forEach((opt) => {
        if (opt.value.trim()) {
          optionsObj[opt.key] = opt.value
        }
      })
      formData.options = JSON.stringify(optionsObj)
    }

    const apiMethod = isEdit.value ? updateQuestion : createQuestion
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
.question-form {
  padding: 20px;
}

.option-input-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.option-input-wrapper :deep(.el-input) {
  flex: 1;
}

.option-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.option-actions .el-button {
  margin: 0;
  min-width: 80px;
}
</style>
