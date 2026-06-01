<script setup lang="ts">
const props = defineProps<{
  code: string
  language?: string
  title?: string
}>()

async function copyCode() {
  try {
    await navigator.clipboard.writeText(props.code)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}
</script>

<template>
  <div class="code-block">
    <div v-if="props.title || props.language" class="code-header">
      <span v-if="props.title" class="code-title">{{ props.title }}</span>
      <span v-if="props.language" class="code-lang">{{ props.language }}</span>
      <el-button
        class="copy-btn"
        type="primary"
        link
        size="small"
        @click.stop="copyCode"
      >
        复制
      </el-button>
    </div>
    <pre><code>{{ props.code ?? '' }}</code></pre>
  </div>
</template>

<style scoped>
.code-block {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
  margin: 12px 0;
}

.code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.code-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.code-lang {
  font-size: 12px;
  color: #909399;
  text-transform: uppercase;
  margin-left: auto;
  margin-right: 8px;
}

.copy-btn {
  flex-shrink: 0;
}

pre {
  margin: 0;
  padding: 16px;
  background-color: #fafafa;
  overflow-x: auto;
}

code {
  font-family: 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #333;
}
</style>
