<template>
  <div class="exam-record-list">
    <el-card>
      <template #header>
        <span>{{ isTeacher ? '考试记录管理' : '我的考试记录' }}</span>
      </template>

      <!-- 教师视图 - 按试卷查看 -->
      <template v-if="isTeacher || isAdmin">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="试卷">
            <el-select
              v-model="searchForm.paperId"
              placeholder="请选择试卷"
              clearable
              style="width: 300px"
              @change="loadRecordList"
            >
              <el-option
                v-for="paper in paperList"
                :key="paper.id"
                :label="paper.paperName"
                :value="paper.id"
              />
            </el-select>
          </el-form-item>
        </el-form>

        <el-table v-loading="loading" :data="tableData" border stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="paperName" label="试卷名称" width="200" show-overflow-tooltip />
          <el-table-column prop="studentName" label="学生姓名" width="120" />
          <el-table-column prop="studentNo" label="学号" width="150" />
          <el-table-column prop="startTime" label="开始时间" width="160" />
          <el-table-column prop="submitTime" label="提交时间" width="160" />
          <el-table-column prop="usedDuration" label="用时(分钟)" width="120">
            <template #default="{ row }">
              {{ row.usedDuration || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="totalScore" label="得分" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.totalScore !== null" :type="getScoreType(row)">
                {{ row.totalScore }}
              </el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="isPassed" label="是否通过" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.isPassed === 1" type="success">通过</el-tag>
              <el-tag v-else-if="row.isPassed === 0" type="danger">未通过</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.status === 0" type="info">未开始</el-tag>
              <el-tag v-else-if="row.status === 1" type="warning">进行中</el-tag>
              <el-tag v-else-if="row.status === 2" type="primary">已提交</el-tag>
              <el-tag v-else type="success">已批改</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="handleView(row)">查看</el-button>
              <el-button
                v-if="row.status === 2"
                type="success"
                size="small"
                @click="handleCorrect(row)"
              >
                批改
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination">
          <el-pagination
            v-model:current-page="pagination.pageNum"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadRecordList"
            @current-change="loadRecordList"
          />
        </div>
      </template>

      <!-- 学生视图 - 我的考试记录 -->
      <template v-else>
        <el-table v-loading="loading" :data="myRecords" border stripe>
          <el-table-column prop="paperName" label="试卷名称" min-width="200" show-overflow-tooltip />
          <el-table-column prop="startTime" label="开始时间" width="160" />
          <el-table-column prop="submitTime" label="提交时间" width="160" />
          <el-table-column prop="totalScore" label="得分" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.totalScore !== null" :type="getScoreType(row)">
                {{ row.totalScore }}
              </el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="isPassed" label="是否通过" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.isPassed === 1" type="success">通过</el-tag>
              <el-tag v-else-if="row.isPassed === 0" type="danger">未通过</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <el-tag v-if="row.status === 0" type="info">未开始</el-tag>
              <el-tag v-else-if="row.status === 1" type="warning">进行中</el-tag>
              <el-tag v-else-if="row.status === 2" type="primary">已提交</el-tag>
              <el-tag v-else type="success">已批改</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="handleView(row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </el-card>

    <!-- 查看答题详情对话框 -->
    <el-dialog v-model="viewDialogVisible" title="答题详情" width="900px" top="5vh">
      <div v-loading="detailLoading">
        <el-descriptions :column="2" border style="margin-bottom: 20px">
          <el-descriptions-item label="试卷名称">
            {{ recordDetail.paperName }}
          </el-descriptions-item>
          <el-descriptions-item label="学生">
            {{ recordDetail.studentName }}({{ recordDetail.studentNo }})
          </el-descriptions-item>
          <el-descriptions-item label="开始时间">
            {{ recordDetail.startTime }}
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">
            {{ recordDetail.submitTime }}
          </el-descriptions-item>
          <el-descriptions-item label="得分">
            <el-tag :type="getScoreType(recordDetail)">
              {{ recordDetail.totalScore || 0 }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag v-if="recordDetail.status === 3" type="success">已批改</el-tag>
            <el-tag v-else type="warning">待批改</el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 这里可以展示答题详情,包括每道题的答案和得分 -->
        <el-divider>答题详情</el-divider>
        <p style="text-align: center; color: #909399">详细答题内容需要根据后端返回数据展示</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { getPaperPage, getRecordsByPaper, getMyRecords, getRecordById, correctExam } from '@/api/exam'

const router = useRouter()
const userStore = useUserStore()

const isTeacher = computed(() => userStore.userInfo?.roleId === 2)
const isAdmin = computed(() => userStore.userInfo?.roleId === 1)
const isStudent = computed(() => userStore.userInfo?.roleId === 3)

const loading = ref(false)
const detailLoading = ref(false)
const paperList = ref([])
const tableData = ref([])
const myRecords = ref([])
const viewDialogVisible = ref(false)
const recordDetail = ref({})

const searchForm = reactive({
  paperId: null
})

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

onMounted(async () => {
  if (isTeacher.value || isAdmin.value) {
    await loadPaperList()
  } else {
    await loadMyRecords()
  }
})

/**
 * 加载试卷列表
 */
const loadPaperList = async () => {
  try {
    const res = await getPaperPage({ status: 1, pageNum: 1, pageSize: 100 })
    if (res.code === 200) {
      paperList.value = res.data.list || []
    }
  } catch (error) {
    console.error('加载试卷列表失败:', error)
  }
}

/**
 * 加载考试记录列表
 */
const loadRecordList = async () => {
  if (!searchForm.paperId) {
    tableData.value = []
    return
  }

  loading.value = true
  try {
    const res = await getRecordsByPaper(searchForm.paperId, {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize
    })
    if (res.code === 200) {
      tableData.value = res.data.list || []
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    ElMessage.error('加载考试记录失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

/**
 * 加载我的考试记录
 */
const loadMyRecords = async () => {
  loading.value = true
  try {
    const res = await getMyRecords()
    if (res.code === 200) {
      myRecords.value = res.data || []
    }
  } catch (error) {
    ElMessage.error('加载考试记录失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

/**
 * 查看详情
 */
const handleView = async (row) => {
  viewDialogVisible.value = true
  detailLoading.value = true
  try {
    const res = await getRecordById(row.id)
    if (res.code === 200) {
      recordDetail.value = res.data
    }
  } catch (error) {
    ElMessage.error('加载详情失败')
    console.error(error)
  } finally {
    detailLoading.value = false
  }
}

/**
 * 批改
 */
const handleCorrect = async (row) => {
  try {
    const res = await correctExam(row.id)
    if (res.code === 200) {
      ElMessage.success('批改成功')
      await loadRecordList()
    }
  } catch (error) {
    ElMessage.error('批改失败')
    console.error(error)
  }
}

/**
 * 获取分数标签类型
 */
const getScoreType = (row) => {
  if (!row.totalScore) return 'info'
  if (row.isPassed === 1) return 'success'
  return 'danger'
}
</script>

<style scoped>
.exam-record-list {
  padding: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
