<template>
  <div class="course-resources neon-module">
    <!-- 顶部工具栏 -->
    <el-card class="toolbar-card">
      <div class="toolbar">
        <div class="toolbar-left">
          <h3>课程资源</h3>
        </div>
        <div class="toolbar-right">
          <el-button v-if="isTeacher || isAdmin" type="primary" @click="handleAddVideo">
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
            </div>
          </div>

          <div v-if="isTeacher || isAdmin" class="content-actions" @click.stop>
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
            <el-button type="danger" size="small" @click="handleDelete(content)"> 删除 </el-button>
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
      />
      <el-alert
        v-else-if="currentContent && currentContent.hlsStatus === 2"
        title="视频正在转换中，请稍后再试"
        type="warning"
        :closable="false"
      />
      <el-alert v-else title="视频暂不可用" type="error" :closable="false" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { VideoCamera, Document, Folder } from '@element-plus/icons-vue'
import { getContentList, deleteContent, updateContent } from '@/api/content'
import { useUserStore } from '@/stores/user'
import VideoUpload from '@/components/VideoUpload.vue'
import HlsVideoPlayer from '@/components/HlsVideoPlayer.vue'

const route = useRoute()
const userStore = useUserStore()

const isTeacher = computed(() => userStore.isTeacher)
const isAdmin = computed(() => userStore.isAdmin)

const courseId = computed(() => parseInt(route.params.id))
const loading = ref(false)
const contentList = ref([])
const uploadDialogVisible = ref(false)
const playDialogVisible = ref(false)
const currentContent = ref(null)
const uploadRef = ref(null)
const playerRef = ref(null)

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
    const res = await getContentList(courseId.value)
    console.log('[CourseResources] API响应:', res)
    console.log('[CourseResources] 资源数量:', res.data?.length || 0)

    let list = res.data || []

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
  } else {
    // 其他类型
    if (content.contentUrl) {
      window.open(content.contentUrl, '_blank')
    } else {
      ElMessage.warning('资源链接不可用')
    }
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
  playDialogVisible.value = false
  currentContent.value = null
  playerRef.value?.pause()
}

/**
 * 视频播放结束
 */
const handleVideoEnded = () => {
  ElMessage.success('视频播放完成')
  // TODO: 记录学习进度
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
