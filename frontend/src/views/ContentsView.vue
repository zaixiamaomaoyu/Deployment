<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import type { TabsPaneContext } from 'element-plus'
import { getContents, type Content } from '@/api/contents'
import ContentCard from '@/components/ContentCard.vue'

const loading = ref(false)
const contents = ref<Content[]>([])
const activeDomain = ref('')
const activeLevel = ref<number | undefined>(undefined)
const searchQuery = ref('')
const error = ref('')
let abortController: AbortController | null = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const emptyDescription = computed(() => {
  if (searchQuery.value && !activeDomain.value && activeLevel.value === undefined) {
    return '未找到相关内容，请尝试其他关键词'
  }
  if (searchQuery.value) {
    return '未找到匹配内容，请调整筛选条件或关键词'
  }
  return '该筛选条件下暂无内容，请尝试其他组合'
})

const domainLabels: Record<string, string> = {
  build: '构建',
  platform: '平台',
  server: '服务器',
  automation: '自动化',
  domain: '域名',
  container: '容器',
}

const domainKeys = Object.keys(domainLabels)

const levelOptions = [
  { label: '全部层级', value: undefined as number | undefined },
  { label: 'Lv1', value: 1 },
  { label: 'Lv2', value: 2 },
  { label: 'Lv3', value: 3 },
  { label: 'Lv4', value: 4 },
  { label: 'Lv5', value: 5 },
]

async function loadData() {
  // 取消之前的请求
  if (abortController) {
    abortController.abort()
  }
  abortController = new AbortController()

  loading.value = true
  error.value = ''
  try {
    const res = await getContents(
      activeDomain.value || undefined,
      activeLevel.value,
      searchQuery.value || undefined,
      1,
      20,
      abortController.signal
    )
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

function handleSearchInput() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    loadData()
  }, 300)
}

function handleSearchClear() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = null
  searchQuery.value = ''
  loadData()
}

function handleTabClick(pane: TabsPaneContext) {
  const domain = (pane.paneName as string) || ''
  activeDomain.value = domain
  loadData()
}

function handleLevelChange() {
  loadData()
}

onMounted(() => {
  loadData()
})

onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<template>
  <div class="contents-view">
    <h1 class="page-title">知识内容</h1>

    <div class="filter-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索知识内容"
        clearable
        class="search-input"
        @input="handleSearchInput"
        @clear="handleSearchClear"
      >
        <template #prefix>
          <el-icon><search /></el-icon>
        </template>
      </el-input>
      <el-select
        v-model="activeLevel"
        placeholder="选择层级"
        clearable
        class="level-select"
        @change="handleLevelChange"
      >
        <el-option
          v-for="opt in levelOptions"
          :key="opt.value ?? 'all'"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
    </div>

    <el-tabs v-model="activeDomain" type="border-card" @tab-click="handleTabClick">
      <el-tab-pane label="全部" name="">
        <div v-loading="loading" class="content-list">
          <el-empty
            v-if="!loading && contents.length === 0"
            :description="emptyDescription"
          />
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
              <ContentCard :content="content" :highlight="searchQuery" />
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
          <el-empty
            v-if="!loading && contents.length === 0"
            :description="emptyDescription"
          />
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
              <ContentCard :content="content" :highlight="searchQuery" />
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
.filter-bar {
  margin-bottom: 16px;
  display: flex;
  gap: 12px;
}
.search-input {
  width: 240px;
}
.level-select {
  width: 160px;
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
