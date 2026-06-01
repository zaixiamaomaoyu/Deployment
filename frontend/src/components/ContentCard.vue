<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Content } from '@/api/contents'
import HighlightText from './HighlightText.vue'

const props = defineProps<{
  content: Content
  highlight?: string
}>()

const router = useRouter()

function handleClick() {
  router.push(`/contents/${props.content.id}`)
}

const domainLabels: Record<string, string> = {
  build: '构建',
  platform: '平台',
  server: '服务器',
  automation: '自动化',
  domain: '域名',
  container: '容器',
}

const domainColors: Record<string, string> = {
  build: 'primary',
  platform: 'success',
  server: 'warning',
  automation: 'info',
  domain: 'danger',
  container: 'default',
}

function getDomainLabel(domain: string): string {
  return domainLabels[domain] || domain
}

function getDomainColor(domain: string): string {
  return domainColors[domain] || 'default'
}
</script>

<template>
  <el-card class="content-card" shadow="hover" @click="handleClick">
    <template #header>
      <div class="card-header">
        <span class="title"><HighlightText :text="props.content.title" :keyword="props.highlight" /></span>
        <div class="tags">
          <el-tag :type="getDomainColor(props.content.domain) as any" size="small">
            {{ getDomainLabel(props.content.domain) }}
          </el-tag>
          <el-tag type="info" size="small">Lv{{ props.content.level }}</el-tag>
        </div>
      </div>
    </template>
    <p class="description"><HighlightText :text="props.content.description || '暂无简介'" :keyword="props.highlight" /></p>
  </el-card>
</template>

<style scoped>
.content-card {
  transition: transform 0.2s;
  cursor: pointer;
}
.content-card:hover {
  transform: translateY(-4px);
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  flex: 1;
}
.tags {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
.description {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
