<template>
  <div class="violation-list neon-module">
    <el-card class="neon-card">
      <template #header>
        <span class="card-title">违规记录</span>
      </template>
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="课程" v-if="showCourseFilter">
          <el-select
            v-model="searchForm.courseId"
            placeholder="全部课程"
            clearable
            style="width: 180px"
          >
            <el-option
              v-for="c in courseList"
              :key="c.id"
              :label="c.courseName"
              :value="c.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="考试" v-if="showExamFilter">
          <el-select
            v-model="searchForm.examId"
            placeholder="全部考试"
            clearable
            filterable
            style="width: 200px"
          >
            <el-option
              v-for="p in paperList"
              :key="p.id"
              :label="p.paperName"
              :value="p.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadList">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
      <el-table v-loading="loading" :data="tableData" border stripe class="neon-table">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="examName" label="考试" min-width="140" show-overflow-tooltip />
        <el-table-column prop="courseName" label="课程" width="120" show-overflow-tooltip />
        <el-table-column prop="studentName" label="学生" width="100" v-if="!isStudent" />
        <el-table-column prop="violationTypeDesc" label="违规类型" width="110" />
        <el-table-column prop="severityDesc" label="严重程度" width="90">
          <template #default="{ row }">
            <el-tag :type="severityTagType(row.severity)" size="small">{{ row.severityDesc }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="violationDescription" label="描述" min-width="120" show-overflow-tooltip />
        <el-table-column prop="violationTime" label="违规时间" width="165" />
        <el-table-column prop="isHandled" label="处理" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.isHandled === 1" type="success" size="small">已处理</el-tag>
            <el-tag v-else type="info" size="small">待处理</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right" v-if="isTeacher || isAdmin">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadList"
          @current-change="loadList"
        />
      </div>
    </el-card>
    <el-dialog v-model="detailVisible" title="违规详情" width="560px" class="detail-dialog">
      <el-descriptions :column="1" border v-if="currentRow">
        <el-descriptions-item label="考试">{{ currentRow.examName }}</el-descriptions-item>
        <el-descriptions-item label="课程">{{ currentRow.courseName }}</el-descriptions-item>
        <el-descriptions-item label="学生">{{ currentRow.studentName }}</el-descriptions-item>
        <el-descriptions-item label="违规类型">{{ currentRow.violationTypeDesc }}</el-descriptions-item>
        <el-descriptions-item label="严重程度">{{ currentRow.severityDesc }}</el-descriptions-item>
        <el-descriptions-item label="描述">{{ currentRow.violationDescription }}</el-descriptions-item>
        <el-descriptions-item label="违规时间">{{ currentRow.violationTime }}</el-descriptions-item>
        <el-descriptions-item label="处理状态">{{ currentRow.isHandled === 1 ? '已处理' : '待处理' }}</el-descriptions-item>
        <el-descriptions-item label="处理结果" v-if="currentRow.isHandled === 1">{{ currentRow.handleResultDesc }}</el-descriptions-item>
        <el-descriptions-item label="处理备注" v-if="currentRow.handleRemark">{{ currentRow.handleRemark }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { getViolationPage } from '@/api/proctor'
import { getCourseList } from '@/api/course'
import { getPaperPage } from '@/api/exam'

const userStore = useUserStore()
const isAdmin = computed(() => userStore.isAdmin)
const isTeacher = computed(() => userStore.isTeacher)
const isStudent = computed(() => userStore.isStudent)

const showCourseFilter = computed(() => isAdmin.value || isTeacher.value)
const showExamFilter = computed(() => isAdmin.value || isTeacher.value)

const loading = ref(false)
const tableData = ref([])
const courseList = ref([])
const paperList = ref([])
const detailVisible = ref(false)
const currentRow = ref(null)

const searchForm = reactive({
  courseId: null,
  examId: null,
})
const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0,
})

async function loadList() {
  loading.value = true
  try {
    const params = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      courseId: searchForm.courseId || undefined,
      examId: searchForm.examId || undefined,
    }
    const res = await getViolationPage(params)
    tableData.value = res.data?.list ?? []
    pagination.total = res.data?.total ?? 0
  } finally {
    loading.value = false
  }
}

function resetSearch() {
  searchForm.courseId = null
  searchForm.examId = null
  pagination.pageNum = 1
  loadList()
}

function openDetail(row) {
  currentRow.value = row
  detailVisible.value = true
}

function severityTagType(severity) {
  const map = { critical: 'danger', high: 'warning', medium: 'info', low: '' }
  return map[severity] || 'info'
}

async function loadCourseList() {
  if (!showCourseFilter.value) return
  const res = await getCourseList({ status: 1 })
  courseList.value = res.data ?? []
}

async function loadPaperList() {
  if (!showExamFilter.value) return
  const res = await getPaperPage({ pageSize: 500 })
  paperList.value = res.data?.list ?? []
}

watch(() => searchForm.courseId, async () => {
  searchForm.examId = null
  if (searchForm.courseId) {
    const { getPaperByCourse } = await import('@/api/exam')
    const res = await getPaperByCourse(searchForm.courseId)
    paperList.value = res.data ?? []
  } else {
    await loadPaperList()
  }
})

onMounted(() => {
  loadCourseList()
  loadPaperList()
  loadList()
})
</script>

<style scoped>
.violation-list {
  padding: 20px;
}
.card-title {
  font-weight: 600;
  color: #00e5ff;
}
.search-form {
  margin-bottom: 16px;
}
.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
:deep(.detail-dialog .el-descriptions__label) {
  width: 90px;
  color: #fff;
}
:deep(.detail-dialog .el-descriptions__content) {
  color: #fff;
}
</style>
