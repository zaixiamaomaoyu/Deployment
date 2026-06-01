<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { ElMessage } from 'element-plus'
import { getContentById, getContentNeighbors, type Content } from '@/api/contents'
import CodeBlock from '@/components/CodeBlock.vue'

const route = useRoute()
const router = useRouter()

const content = ref<Content | null>(null)
const neighbors = ref<{ prev: Content | null; next: Content | null }>({ prev: null, next: null })
const loading = ref(false)
const notFound = ref(false)
const isMounted = ref(true)

onBeforeUnmount(() => {
  isMounted.value = false
})

const renderedContent = computed(() => {
  if (!content.value?.content) return ''
  const result = marked.parse(content.value.content, { async: false })
  return DOMPurify.sanitize(typeof result === 'string' ? result : '')
})

const examples = computed(() => {
  const ex = content.value?.examples
  if (!Array.isArray(ex)) return []
  return ex.filter((item): item is { code: string; language?: string; title?: string } =>
    item && typeof item === 'object' && 'code' in item && typeof item.code === 'string'
  )
})

const domainLabels: Record<string, string> = {
  build: '构建',
  platform: '平台',
  server: '服务器',
  automation: '自动化',
  domain: '域名',
  container: '容器',
}

type TagType = 'primary' | 'success' | 'warning' | 'info' | 'danger' | 'default'
const domainColors: Record<string, TagType> = {
  build: 'primary',
  platform: 'success',
  server: 'warning',
  automation: 'info',
  domain: 'danger',
  container: 'default',
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('zh-CN')
}

function goTo(id: number) {
  router.push(`/contents/${id}`)
}

async function loadData() {
  const rawId = route.params.id
  const id = Number(rawId)

  if (Number.isNaN(id) || !Number.isInteger(id) || id < 1) {
    notFound.value = true
    return
  }

  loading.value = true
  notFound.value = false

  try {
    const [contentResult, neighborsResult] = await Promise.allSettled([
      getContentById(id),
      getContentNeighbors(id),
    ])

    if (!isMounted.value || route.params.id !== rawId) return

    if (contentResult.status === 'rejected') {
      notFound.value = true
      return
    }

    const contentRes = contentResult.value
    if (contentRes.code === 'SUCCESS' && contentRes.data) {
      content.value = contentRes.data
    } else {
      notFound.value = true
      return
    }

    if (neighborsResult.status === 'fulfilled') {
      const neighborsRes = neighborsResult.value
      if (neighborsRes.code === 'SUCCESS' && neighborsRes.data) {
        neighbors.value = neighborsRes.data
      }
    }
  } catch {
    if (!isMounted.value || route.params.id !== rawId) return
    ElMessage.error('加载内容失败')
  } finally {
    if (isMounted.value && route.params.id === rawId) {
      loading.value = false
    }
  }
}

onMounted(() => {
  loadData()
})

watch(() => route.params.id, () => {
  loadData()
})
</script>

<template>
  <div class="content-detail" v-loading="loading">
    <el-empty v-if="notFound" description="内容不存在">
      <el-button type="primary" @click="$router.push('/contents')">
        返回内容列表
      </el-button>
    </el-empty>

    <template v-else-if="content">
      <div class="detail-header">
        <h1 class="title">{{ content.title }}</h1>
        <div class="meta">
          <el-tag :type="domainColors[content.domain]" size="small">
            {{ domainLabels[content.domain] || content.domain }}
          </el-tag>
          <el-tag type="info" size="small">Lv{{ content.level }}</el-tag>
          <span v-if="content.updated_at" class="updated-at">
            更新于 {{ formatDate(content.updated_at) }}
          </span>
        </div>
      </div>

      <div class="detail-body" v-html="renderedContent"></div>

      <div v-if="examples.length" class="detail-examples">
        <h3>代码示例</h3>
        <CodeBlock
          v-for="(ex, i) in examples"
          :key="i"
          :code="ex.code ?? ''"
          :language="ex.language"
          :title="ex.title"
        />
      </div>

      <div class="detail-nav">
        <el-card
          v-if="neighbors.prev"
          class="nav-card nav-prev"
          shadow="hover"
          @click="goTo(neighbors.prev.id)"
        >
          <div class="nav-label">上一篇</div>
          <div class="nav-title">{{ neighbors.prev.title }}</div>
          <div class="nav-meta">
            <el-tag :type="domainColors[neighbors.prev.domain]" size="small">
              {{ domainLabels[neighbors.prev.domain] || neighbors.prev.domain }}
            </el-tag>
            <el-tag type="info" size="small">Lv{{ neighbors.prev.level }}</el-tag>
          </div>
        </el-card>

        <div v-else class="nav-placeholder"></div>

        <el-card
          v-if="neighbors.next"
          class="nav-card nav-next"
          shadow="hover"
          @click="goTo(neighbors.next.id)"
        >
          <div class="nav-label">下一篇</div>
          <div class="nav-title">{{ neighbors.next.title }}</div>
          <div class="nav-meta">
            <el-tag :type="domainColors[neighbors.next.domain]" size="small">
              {{ domainLabels[neighbors.next.domain] || neighbors.next.domain }}
            </el-tag>
            <el-tag type="info" size="small">Lv{{ neighbors.next.level }}</el-tag>
          </div>
        </el-card>

        <div v-else class="nav-placeholder"></div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.content-detail {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 16px;
}

.detail-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.title {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
  line-height: 1.4;
}

.meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.updated-at {
  font-size: 13px;
  color: #909399;
  margin-left: 8px;
}

.detail-body {
  font-size: 15px;
  line-height: 1.8;
  color: #303133;
}

.detail-body :deep(h2) {
  font-size: 22px;
  font-weight: 600;
  margin: 24px 0 12px;
  color: #303133;
}

.detail-body :deep(h3) {
  font-size: 18px;
  font-weight: 600;
  margin: 20px 0 10px;
  color: #303133;
}

.detail-body :deep(p) {
  margin: 12px 0;
}

.detail-body :deep(ul),
.detail-body :deep(ol) {
  margin: 12px 0;
  padding-left: 24px;
}

.detail-body :deep(li) {
  margin: 6px 0;
}

.detail-body :deep(code) {
  background-color: #f5f7fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
}

.detail-body :deep(pre) {
  background-color: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 12px 0;
}

.detail-body :deep(pre code) {
  background: none;
  padding: 0;
}

.detail-body :deep(a) {
  color: #409eff;
  text-decoration: none;
}

.detail-body :deep(a:hover) {
  text-decoration: underline;
}

.detail-body :deep(blockquote) {
  margin: 12px 0;
  padding: 8px 16px;
  border-left: 4px solid #409eff;
  background-color: #f5f7fa;
  color: #606266;
}

.detail-examples {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e4e7ed;
}

.detail-examples h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #303133;
}

.detail-nav {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e4e7ed;
}

.nav-card {
  flex: 1;
  cursor: pointer;
  transition: transform 0.2s;
  max-width: 48%;
}

.nav-card:hover {
  transform: translateY(-2px);
}

.nav-prev {
  text-align: left;
}

.nav-next {
  text-align: right;
}

.nav-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.nav-title {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
  line-height: 1.4;
}

.nav-meta {
  display: flex;
  gap: 6px;
  justify-content: flex-start;
}

.nav-next .nav-meta {
  justify-content: flex-end;
}

.nav-placeholder {
  flex: 1;
  max-width: 48%;
}

@media (max-width: 768px) {
  .content-detail {
    padding: 16px 12px;
  }

  .title {
    font-size: 22px;
  }

  .detail-nav {
    flex-direction: column;
  }

  .nav-card,
  .nav-placeholder {
    max-width: 100%;
  }

  .nav-next {
    text-align: left;
  }

  .nav-next .nav-meta {
    justify-content: flex-start;
  }
}
</style>
