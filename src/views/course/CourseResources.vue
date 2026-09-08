<template>
  <div class="course-resources neon-module">
    <!-- 顶部工具栏 -->
    <el-card class="toolbar-card">
      <div class="toolbar">
        <div class="toolbar-left">
          <h3>课程资源</h3>
        </div>
        <div class="toolbar-right">
          <el-button v-if="(isTeacher || isAdmin) && courseStatus !== 2" type="primary" plain @click="handleAddContent">
            <el-icon><DocumentAdd /></el-icon>
            新增资料
          </el-button>
          <el-button v-if="(isTeacher || isAdmin) && courseStatus !== 2" type="primary" @click="handleAddVideo">
            <el-icon><VideoCamera /></el-icon>
            上传视频
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 资源列表 -->
    <el-card v-loading="loading" class="content-card">
      <el-empty v-if="!contentList.length" description="暂无课程资源" />

      <div v-else class="content-list">
        <div
          v-for="content in contentList"
          :key="content.id"
          class="content-item"
          @click="handleViewContent(content)"
        >
          <div class="content-icon">
            <el-icon v-if="content.contentType === 1"><VideoCamera /></el-icon>
            <el-icon v-else-if="content.contentType === 2"><Document /></el-icon>
            <el-icon v-else><Folder /></el-icon>
          </div>

          <div class="content-info">
            <h4 class="content-title">{{ content.title }}</h4>
            <div class="content-meta">
              <el-tag size="small">{{ content.contentTypeDesc }}</el-tag>
              <el-tag v-if="content.duration" size="small" type="info">
                {{ content.durationFormatted }}
              </el-tag>
              <el-tag
                v-if="content.contentType === 1"
                size="small"
                :type="hlsStatusType(content.hlsStatus)"
              >
                {{ content.hlsStatusDesc }}
              </el-tag>
              <el-tag size="small" :type="content.status === 1 ? 'success' : 'info'">
                {{ content.statusDesc }}
              </el-tag>
              <el-tag v-if="!isTeacher && !isAdmin && content.learningProgress" size="small" type="success">
                {{ Number(content.learningProgress).toFixed(0) }}%
              </el-tag>
            </div>
          </div>

          <div v-if="!(isTeacher || isAdmin)" class="content-actions" @click.stop>
            <el-button type="primary" size="small" @click="handleViewContent(content)">
              {{ content.contentType === 4 && content.contentText ? '查看' : '下载' }}
            </el-button>
          </div>

          <div v-if="(isTeacher || isAdmin) && courseStatus !== 2" class="content-actions" @click.stop>
            <el-button
              v-if="content.status === 0"
              type="success"
              size="small"
              @click="handlePublish(content)"
            >
              发布
            </el-button>
            <el-button v-else type="warning" size="small" @click="handleUnpublish(content)">
              取消发布
            </el-button>
            <el-button type="primary" size="small" @click="handleViewContent(content)">
              查看
            </el-button>
            <el-button
              v-if="content.status === 0"
              type="danger"
              size="small"
              @click="handleDelete(content)"
            >
              删除
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 上传视频对话框 -->
    <el-dialog
      v-model="uploadDialogVisible"
      title="上传视频"
      width="800px"
      :close-on-click-modal="false"
      @close="handleUploadClose"
    >
      <VideoUpload
        v-if="courseId"
        ref="uploadRef"
        :course-id="courseId"
        @success="handleUploadSuccess"
        @cancel="handleUploadClose"
      />
    </el-dialog>

    <!-- 新增资料对话框 -->
    <el-dialog
      v-model="contentDialogVisible"
      title="新增资料"
      width="620px"
      :close-on-click-modal="false"
      @close="resetContentForm"
    >
      <el-form
        ref="contentFormRef"
        :model="contentForm"
        :rules="contentRules"
        label-width="92px"
      >
        <el-form-item label="资料标题" prop="title">
          <el-input
            v-model="contentForm.title"
            maxlength="200"
            show-word-limit
            placeholder="请输入资料标题"
          />
        </el-form-item>
        <el-form-item label="资料类型" prop="contentType">
          <el-select v-model="contentForm.contentType" style="width: 100%">
            <el-option label="文档" :value="2" />
            <el-option label="PPT" :value="3" />
            <el-option label="其他" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="资源链接" prop="contentUrl">
          <el-input
            v-model="contentForm.contentUrl"
            placeholder="可填写公开的 HTTP(S) 资源链接"
            maxlength="1000"
            clearable
          />
          <div class="form-tip">文档和 PPT 发布时必须填写 HTTP(S) 链接；其他资料可只填写文本。</div>
        </el-form-item>
        <el-form-item v-if="contentForm.contentType === 4" label="文本内容" prop="contentText">
          <el-input
            v-model="contentForm.contentText"
            type="textarea"
            :rows="7"
            maxlength="10000"
            show-word-limit
            placeholder="可填写学习提示、补充说明等文本内容"
          />
        </el-form-item>
        <el-form-item label="排序号" prop="sortOrder">
          <el-input-number v-model="contentForm.sortOrder" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="发布状态" prop="status">
          <el-radio-group v-model="contentForm.status">
            <el-radio :label="0">保存为草稿</el-radio>
            <el-radio :label="1">立即发布</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="contentDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submittingContent" @click="handleContentSubmit">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 视频播放对话框 -->
    <el-dialog
      v-model="playDialogVisible"
      :title="currentContent?.title"
      width="80%"
      :close-on-click-modal="false"
      @close="handlePlayClose"
    >
      <HlsVideoPlayer
        v-if="currentContent && currentContent.hlsPlaylistUrl"
        ref="playerRef"
        :src="currentContent.hlsPlaylistUrl"
        :video-info="currentContent"
        @ended="handleVideoEnded"
        @time-update="handleVideoTimeUpdate"
      />
      <el-alert
        v-else-if="currentContent && currentContent.hlsStatus === 2"
        title="视频正在转换中，请稍后再试"
        type="warning"
        :closable="false"
      />
      <el-alert v-else title="视频暂不可用" type="error" :closable="false" />
    </el-dialog>

    <!-- 文本资料查看对话框 -->
    <el-dialog
      v-model="textDialogVisible"
      :title="currentContent?.title || '资料内容'"
      width="680px"
    >
      <div class="text-content">{{ currentContent?.contentText || '暂无文本内容' }}</div>
      <template #footer>
        <el-button v-if="currentContent?.contentUrl" type="primary" @click="handleDownload(currentContent)">
          打开资源链接
        </el-button>
        <el-button @click="textDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { VideoCamera, Document, DocumentAdd, Folder } from '@element-plus/icons-vue'
import {
  getContentList,
  createContent,
  deleteContent,
  updateContent,
  getContentDownloadUrl,
} from '@/api/content'
import { getCourseById } from '@/api/course'
import { getLearningRecords, recordLearning } from '@/api/learning'
import { useUserStore } from '@/stores/user'
import VideoUpload from '@/components/VideoUpload.vue'
import HlsVideoPlayer from '@/components/HlsVideoPlayer.vue'

const route = useRoute()
const userStore = useUserStore()

const isTeacher = computed(() => userStore.isTeacher)
const isAdmin = computed(() => userStore.isAdmin)

const courseId = computed(() => parseInt(route.params.id))
const courseStatus = ref(null)
const loading = ref(false)
const contentList = ref([])
const uploadDialogVisible = ref(false)
const playDialogVisible = ref(false)
const contentDialogVisible = ref(false)
const textDialogVisible = ref(false)
const currentContent = ref(null)
const uploadRef = ref(null)
const playerRef = ref(null)
const contentFormRef = ref(null)
const submittingContent = ref(false)
const lastRecordAt = ref(0)

const contentForm = reactive({
  title: '',
  contentType: 2,
  contentUrl: '',
  contentText: '',
  sortOrder: 0,
  status: 0,
})

const contentRules = {
  title: [
    { required: true, message: '请输入资料标题', trigger: 'blur' },
    { max: 200, message: '资料标题不能超过200个字符', trigger: 'blur' },
  ],
  contentType: [{ required: true, message: '请选择资料类型', trigger: 'change' }],
  sortOrder: [{ type: 'number', message: '排序号必须是数字', trigger: 'change' }],
}

onMounted(() => {
  loadContentList()
})

/**
 * 加载资源列表
 */
const loadContentList = async () => {
  try {
    loading.value = true
    console.log('[CourseResources] 加载资源列表, courseId:', courseId.value)
    const [res, courseRes] = await Promise.all([
      getContentList(courseId.value),
      getCourseById(courseId.value),
    ])
    courseStatus.value = courseRes.data?.status ?? null
    console.log('[CourseResources] API响应:', res)
    console.log('[CourseResources] 资源数量:', res.data?.length || 0)

    let list = res.data || []

    if (!isTeacher.value && !isAdmin.value) {
      try {
        const recordRes = await getLearningRecords(courseId.value)
        const records = new Map((recordRes.data || []).map((record) => [record.contentId, record]))
        list = list.map((item) => ({
          ...item,
          learningProgress: records.get(item.id)?.learnProgress || 0,
          isCompleted: records.get(item.id)?.isCompleted === 1,
        }))
      } catch (error) {
        console.error('加载学习记录失败:', error)
      }
    }

    // 学生只能看到已发布的内容
    if (!isTeacher.value && !isAdmin.value) {
      list = list.filter((item) => item.status === 1)
      console.log('[CourseResources] 学生角色，过滤后资源数量:', list.length)
    }

    contentList.value = list
  } catch (error) {
    console.error('加载资源列表失败:', error)
    ElMessage.error('加载资源列表失败')
  } finally {
    loading.value = false
  }
}

/**
 * 添加视频
 */
const handleAddVideo = () => {
  uploadDialogVisible.value = true
}

/**
 * 新增非视频资料
 */
const handleAddContent = () => {
  resetContentForm()
  contentDialogVisible.value = true
}

const resetContentForm = () => {
  Object.assign(contentForm, {
    title: '',
    contentType: 2,
    contentUrl: '',
    contentText: '',
    sortOrder: 0,
    status: 0,
  })
  contentFormRef.value?.clearValidate()
}

const isHttpUrl = (value) => {
  try {
    const url = new URL(value.trim())
    return Boolean(url.hostname) && ['http:', 'https:'].includes(url.protocol)
  } catch {
    return false
  }
}

const handleContentSubmit = async () => {
  try {
    const valid = await contentFormRef.value.validate().catch(() => false)
    if (!valid) return
    const url = contentForm.contentUrl.trim()
    const text = contentForm.contentText.trim()
    if (url && !isHttpUrl(url)) {
      ElMessage.warning('资源链接必须使用有效的 HTTP(S) 地址')
      return
    }
    if (contentForm.status === 1 && [2, 3].includes(contentForm.contentType) && !url) {
      ElMessage.warning('文档或 PPT 发布时必须填写资源链接')
      return
    }
    if (contentForm.status === 1 && contentForm.contentType === 4 && !url && !text) {
      ElMessage.warning('其他类型资料至少填写资源链接或文本内容')
      return
    }

    submittingContent.value = true
    await createContent({
      courseId: courseId.value,
      title: contentForm.title.trim(),
      contentType: contentForm.contentType,
      contentUrl: url || null,
      contentText: text || null,
      sortOrder: contentForm.sortOrder,
      status: contentForm.status,
    })
    ElMessage.success(contentForm.status === 1 ? '资料已发布' : '资料已保存为草稿')
    contentDialogVisible.value = false
    loadContentList()
  } catch (error) {
    if (error !== false) {
      console.error('新增资料失败:', error)
      ElMessage.error(error?.message || '新增资料失败')
    }
  } finally {
    submittingContent.value = false
  }
}

/**
 * 查看内容
 */
const handleViewContent = (content) => {
  if (content.contentType === 1) {
    // 视频类型
    if (content.hlsStatus === 1) {
      currentContent.value = content
      playDialogVisible.value = true
    } else if (content.hlsStatus === 2) {
      ElMessage.warning('视频正在转换中，请稍后再试')
    } else {
      ElMessage.warning('视频尚未转换，无法播放')
    }
  } else if (content.contentType === 4 && content.contentText) {
    currentContent.value = content
    textDialogVisible.value = true
  } else {
    // 文件资料统一通过后端校验权限后下载
    handleDownload(content)
  }
}

/**
 * 下载课程资源。后端先校验课程权限，再返回短期下载地址。
 */
const handleDownload = async (content) => {
  try {
    const res = await getContentDownloadUrl(content.id)
    const url = res.data
    if (!url) {
      ElMessage.warning('资源链接不可用')
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
    recordContentProgress(content, 100, true)
  } catch (error) {
    console.error('下载课程资源失败:', error)
    ElMessage.error('下载失败，请稍后重试')
  }
}

/**
 * 删除内容
 */
const handleDelete = async (content) => {
  try {
    await ElMessageBox.confirm(`确定删除「${content.title}」吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await deleteContent(content.id)
    ElMessage.success('删除成功')
    loadContentList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

/**
 * 发布内容
 */
const handlePublish = async (content) => {
  try {
    await ElMessageBox.confirm(`确定发布「${content.title}」吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
    })

    // 更新状态为已发布
    const updateData = {
      id: content.id,
      status: 1,
    }
    await updateContent(updateData)
    ElMessage.success('发布成功')
    loadContentList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('发布失败:', error)
      ElMessage.error('发布失败')
    }
  }
}

/**
 * 取消发布内容
 */
const handleUnpublish = async (content) => {
  try {
    await ElMessageBox.confirm(
      `确定取消发布「${content.title}」吗？学生将无法查看此内容。`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )

    // 更新状态为草稿
    const updateData = {
      id: content.id,
      status: 0,
    }
    await updateContent(updateData)
    ElMessage.success('已取消发布')
    loadContentList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消发布失败:', error)
      ElMessage.error('操作失败')
    }
  }
}

/**
 * 上传成功
 */
const handleUploadSuccess = () => {
  uploadDialogVisible.value = false
  loadContentList()
}

/**
 * 关闭上传对话框
 */
const handleUploadClose = () => {
  uploadDialogVisible.value = false
  uploadRef.value?.resetForm()
}

/**
 * 关闭播放对话框
 */
const handlePlayClose = () => {
  flushLearningRecord()
  playDialogVisible.value = false
  currentContent.value = null
  playerRef.value?.pause()
}

/**
 * 视频播放结束
 */
const handleVideoEnded = () => {
  ElMessage.success('视频播放完成')
  recordContentProgress(currentContent.value, 100, true)
}

const handleVideoTimeUpdate = (currentTime) => {
  if (!currentContent.value || !currentTime) return
  const duration = Number(currentContent.value.duration || 0)
  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0
  recordContentProgress(currentContent.value, progress, false, currentTime)
}

const recordContentProgress = (content, progress, completed, duration) => {
  if (!content || isTeacher.value || isAdmin.value || courseStatus.value === 2) return
  const now = Date.now()
  if (!completed && now - lastRecordAt.value < 8000) return
  lastRecordAt.value = now
  recordLearning({
    contentId: content.id,
    learnDuration: Math.max(0, Math.floor(duration || content.duration || 0)),
    learnProgress: Math.min(100, Math.max(0, Number(progress || 0))),
    isCompleted: completed ? 1 : 0,
  }).catch((error) => console.error('记录学习进度失败:', error))
}

const flushLearningRecord = () => {
  if (currentContent.value && !isTeacher.value && !isAdmin.value) {
    recordContentProgress(currentContent.value, 0, false)
  }
}

/**
 * HLS状态标签类型
 */
const hlsStatusType = (status) => {
  switch (status) {
    case 1:
      return 'success'
    case 2:
      return 'warning'
    default:
      return 'info'
  }
}
</script>

<style scoped lang="scss">
.course-resources {
  padding: 20px;
}

.toolbar-card {
  margin-bottom: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    color: #e7f6ff;
    font-size: 20px;
  }
}

.content-card {
  min-height: 400px;
}

.content-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.content-item {
  display: flex;
  align-items: center;
  padding: 20px;
  background: rgba(10, 24, 52, 0.5);
  border: 1px solid rgba(72, 156, 255, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: rgba(20, 40, 80, 0.6);
    border-color: #409eff;
    transform: translateX(5px);
  }
}

.content-icon {
  font-size: 40px;
  color: #409eff;
  margin-right: 20px;
  min-width: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content-info {
  flex: 1;
}

.content-title {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #e7f6ff;
}

.content-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.content-actions {
  display: flex;
  gap: 8px;
}

.form-tip {
  margin-top: 4px;
  color: #8aa9c7;
  font-size: 12px;
  line-height: 1.5;
}

.text-content {
  min-height: 160px;
  max-height: 480px;
  overflow: auto;
  padding: 16px;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.8;
  color: #e7f6ff;
  background: rgba(10, 24, 52, 0.55);
  border: 1px solid rgba(72, 156, 255, 0.25);
  border-radius: 8px;
}

:deep(.el-dialog__header) {
  background: linear-gradient(135deg, rgba(10, 24, 52, 0.9) 0%, rgba(20, 40, 80, 0.9) 100%);
  border-bottom: 1px solid rgba(72, 156, 255, 0.3);

  .el-dialog__title {
    color: #e7f6ff;
  }

  .el-dialog__headerbtn {
    .el-dialog__close {
      color: #96c2f5;
      &:hover {
        color: #409eff;
      }
    }
  }
}

:deep(.el-dialog__body) {
  background: rgba(5, 15, 35, 0.95);
  color: #cfe9ff;
}

:deep(.el-dialog) {
  background: rgba(10, 24, 52, 0.95);
  border: 1px solid rgba(72, 156, 255, 0.4);
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.6),
    0 0 20px rgba(0, 255, 255, 0.2);
}
</style>
