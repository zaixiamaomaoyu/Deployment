<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { TabsPaneContext } from 'element-plus'
import { getContents, type Content } from '@/api/contents'
import ContentCard from '@/components/ContentCard.vue'

const loading = ref(false)
const contents = ref<Content[]>([])
const activeDomain = ref('')
const error = ref('')
let abortController: AbortController | null = null

const domainLabels: Record<string, string> = {
  build: '构建',
  platform: '平台',
  server: '服务器',
  automation: '自动化',
  domain: '域名',
  container: '容器',
}

const domainKeys = Object.keys(domainLabels)

async function fetchContents(domain?: string) {
  // 取消之前的请求
  if (abortController) {
    abortController.abort()
  }
  abortController = new AbortController()

  loading.value = true
  error.value = ''
  try {
    const res = await getContents(domain || undefined, 1, 20, abortController.signal)
    contents.value = res.data.contents
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return
    }
    error.value = '加载内容失败，请稍后重试'
    console.error('加载内容失败:', err)
  } finally {
    loading.value = false
    abortController = null
  }
}

function handleTabClick(pane: TabsPaneContext) {
  const domain = (pane.paneName as string) || ''
  activeDomain.value = domain
  fetchContents(domain || undefined)
}

onMounted(() => {
  fetchContents()
})
</script>

<template>
  <div class="contents-view">
    <h1 class="page-title">知识内容</h1>

    <el-tabs v-model="activeDomain" type="border-card" @tab-click="handleTabClick">
      <el-tab-pane label="全部" name="">
        <div v-loading="loading" class="content-list">
          <el-empty v-if="!loading && contents.length === 0" description="暂无内容，敬请期待" />
          <el-row v-else :gutter="16">
            <el-col
              v-for="content in contents"
              :key="content.id"
              :xs="24"
              :sm="12"
              :md="8"
              :lg="8"
              class="content-col"
            >
              <ContentCard :content="content" />
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>

      <el-tab-pane
        v-for="key in domainKeys"
        :key="key"
        :label="domainLabels[key]"
        :name="key"
      >
        <div v-loading="loading" class="content-list">
          <el-empty v-if="!loading && contents.length === 0" description="暂无内容，敬请期待" />
          <el-row v-else :gutter="16">
            <el-col
              v-for="content in contents"
              :key="content.id"
              :xs="24"
              :sm="12"
              :md="8"
              :lg="8"
              class="content-col"
            >
              <ContentCard :content="content" />
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-alert v-if="error" :title="error" type="error" show-icon class="error-alert" />
  </div>
</template>

<style scoped>
.contents-view {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}
.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
}
.content-list {
  min-height: 200px;
  padding: 16px 0;
}
.content-col {
  margin-bottom: 16px;
}
.error-alert {
  margin-top: 16px;
}
</style>
