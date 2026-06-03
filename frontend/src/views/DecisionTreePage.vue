<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { DecisionTreeCompletePayload } from '@/types/decision-tree'
import DecisionTree from '@/components/DecisionTree.vue'
import { decisionTreeData } from '@/data/decision-tree-data'

const router = useRouter()
const loading = ref(false)
const error = ref<string | null>(null)

function handleComplete(payload: DecisionTreeCompletePayload) {
  loading.value = true
  error.value = null

  // 跳转到结果页，传递结果数据
  router.push({
    path: '/deployment/decision-tree/result',
    query: {
      answers: JSON.stringify(payload.answers),
      planId: payload.result.planId,
      planName: payload.result.planName,
    },
  })
}

function handleError(err: Error) {
  error.value = err.message || '加载决策树数据失败，请刷新页面重试'
  console.error('DecisionTree error:', err)
}

function handleReload() {
  window.location.reload()
}
</script>

<template>
  <div class="decision-tree-page">
    <div class="page-header">
      <h1 class="page-title">部署方案决策树</h1>
      <p class="page-subtitle">通过几个简单问题，帮你找到最合适的部署方案</p>
    </div>

    <div class="decision-tree-container">
      <div v-if="error" class="error-container">
        <p>{{ error }}</p>
        <el-button type="primary" @click="handleReload">刷新页面</el-button>
      </div>

      <DecisionTree
        v-else
        :data="decisionTreeData"
        @complete="handleComplete"
        @error="handleError"
      />
    </div>
  </div>
</template>

<style scoped>
.decision-tree-page {
  min-height: calc(100vh - 64px);
  padding: 40px 24px;
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin-bottom: 12px;
}

.page-subtitle {
  font-size: 16px;
  color: var(--el-text-color-regular);
  max-width: 600px;
  margin: 0 auto;
}

.decision-tree-container {
  background: var(--el-bg-color);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.error-container {
  text-align: center;
  padding: 60px 24px;
}

.error-container p {
  font-size: 16px;
  color: var(--el-text-color-secondary);
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .decision-tree-page {
    padding: 20px 16px;
  }

  .page-title {
    font-size: 24px;
  }

  .page-subtitle {
    font-size: 14px;
  }

  .decision-tree-container {
    padding: 16px;
  }
}
</style>
