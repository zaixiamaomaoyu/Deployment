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

const domainColors: Record<string, { type: string; color: string; bg: string }> = {
  build: { type: 'primary', color: '#409eff', bg: '#ecf5ff' },
  platform: { type: 'success', color: '#67c23a', bg: '#f0f9ff' },
  server: { type: 'warning', color: '#e6a23c', bg: '#fdf6ec' },
  automation: { type: 'info', color: '#909399', bg: '#f4f4f5' },
  domain: { type: 'danger', color: '#f56c6c', bg: '#fef0f0' },
  container: { type: 'default', color: '#8e44ad', bg: '#faf3ff' },
}

function getDomainLabel(domain: string): string {
  return domainLabels[domain] || domain
}

function getDomainMeta(domain: string) {
  return domainColors[domain] || domainColors.build
}
</script>

<template>
  <div class="content-card" @click="handleClick">
    <div
      class="content-card__strip"
      :style="{ background: getDomainMeta(props.content.domain).color }"
    />
    <div class="content-card__body">
      <div class="card-header">
        <span class="title">
          <HighlightText :text="props.content.title" :keyword="props.highlight" />
        </span>
        <div class="tags">
          <span
            class="domain-tag"
            :style="{
              color: getDomainMeta(props.content.domain).color,
              background: getDomainMeta(props.content.domain).bg,
            }"
          >
            {{ getDomainLabel(props.content.domain) }}
          </span>
          <span class="level-tag">Lv{{ props.content.level }}</span>
        </div>
      </div>
      <p class="description">
        <HighlightText
          :text="props.content.description || '暂无简介'"
          :keyword="props.highlight"
        />
      </p>
      <div class="card-footer">
        <span class="read-more">
          查看详情
          <el-icon><ArrowRight /></el-icon>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.content-card {
  position: relative;
  display: flex;
  background: #fff;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.content-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 32px -8px rgba(0, 0, 0, 0.12);
  border-color: #d1d5db;
}

.content-card:hover .content-card__strip {
  width: 8px;
}

.content-card:hover .read-more {
  color: #409eff;
  gap: 8px;
}

.content-card__strip {
  width: 4px;
  flex-shrink: 0;
  transition: width 0.3s;
}

.content-card__body {
  flex: 1;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.4;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tags {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.domain-tag,
.level-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
}

.domain-tag {
  white-space: nowrap;
}

.level-tag {
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #e5e7eb;
}

.description {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.6;
  margin: 0 0 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-top: 8px;
  border-top: 1px dashed #f0f0f0;
}

.read-more {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #9ca3af;
  transition: all 0.3s;
}

.read-more .el-icon {
  font-size: 12px;
  transition: transform 0.3s;
}
</style>
