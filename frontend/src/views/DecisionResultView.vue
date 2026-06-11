<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { DecisionTreeCompletePayload } from '@/types/decision-tree'
import { deploymentPlans } from '@/data/deployment-plans'

interface Props {
  result: DecisionTreeCompletePayload
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'go-back'): void
  (e: 'view-steps'): void
}>()

const router = useRouter()

// 从 deploymentPlans 读取方案详情，不存在时显示空状态
const plan = computed(() => deploymentPlans[props.result.result.planId])

function priceRangeTagType(range: 'free' | 'low' | 'medium' | 'high'): 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    free: 'success',
    low: 'warning',
    medium: 'danger',
    high: 'info',
  }
  return map[range] || 'info'
}

function handleGoBack() {
  emit('go-back')
}

function handleViewSteps() {
  emit('view-steps')
  // 跳转到步骤指南页面
  if (plan.value) {
    router.push(`/deployment/decision-tree/steps/${plan.value.planId}`)
  }
}

function priceRangeLabel(range: 'free' | 'low' | 'medium' | 'high'): string {
  const map: Record<string, string> = {
    free: '免费',
    low: '低成本',
    medium: '中等成本',
    high: '高成本',
  }
  return map[range] || range
}
</script>

<template>
  <div data-testid="decision-result" class="decision-result">
    <!-- 方案名称 -->
    <h1 data-testid="dr-result-name" class="dr-title">
      {{ plan?.planName || '加载中...' }}
    </h1>

    <!-- 方案详情卡片 -->
    <el-card data-testid="dr-card" class="dr-card" v-if="plan">
      <!-- 推荐理由 -->
      <div data-testid="dr-reasons" class="dr-reasons">
        <el-alert
          v-for="(reason, idx) in plan.reason"
          :key="idx"
          :type="idx === 0 ? 'success' : 'info'"
          :closable="false"
        >
          {{ reason }}
        </el-alert>
      </div>

      <!-- 标签 -->
      <div data-testid="dr-tags" class="dr-tags">
        <el-tag>{{ plan.category }}</el-tag>
        <el-tag type="info">{{ plan.difficulty }}</el-tag>
        <el-tag :type="priceRangeTagType(plan.priceRange)">
          {{ priceRangeLabel(plan.priceRange) }}
        </el-tag>
      </div>

      <!-- 适合人群 -->
      <div data-testid="dr-suitable-for" class="dr-suitable-for">
        <span class="dr-suitable-for-label">适合人群：</span>
        <el-tag
          v-for="(user, idx) in plan.suitableFor"
          :key="idx"
          style="margin-right: 8px"
        >
          {{ user }}
        </el-tag>
      </div>
    </el-card>

    <!-- 按钮区域 -->
    <div data-testid="dr-actions" class="dr-actions" v-if="plan">
      <el-button data-testid="dr-view-steps" @click="handleViewSteps">
        查看步骤指南
      </el-button>
      <el-button data-testid="dr-go-back" @click="handleGoBack">
        重新选择
      </el-button>
    </div>

    <!-- 错误状态：planId 不存在 -->
    <div data-testid="dr-error" class="dr-error" v-else>
      <p>未找到推荐的部署方案，请重新选择</p>
      <el-button @click="handleGoBack">重新选择</el-button>
    </div>
  </div>
</template>

<style scoped>
.decision-result {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.dr-title {
  font-size: 2rem;
  margin-bottom: 24px;
  color: var(--el-text-color-primary);
}

.dr-card {
  margin-bottom: 24px;
}

.dr-reasons {
  margin-bottom: 20px;
}

.dr-tags {
  margin-bottom: 20px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.dr-suitable-for {
  margin-bottom: 20px;
}

.dr-suitable-for-label {
  font-weight: 500;
  margin-right: 8px;
}

.dr-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.dr-error {
  text-align: center;
  padding: 40px 20px;
}

.dr-error p {
  margin-bottom: 20px;
  font-size: 1.1rem;
  color: var(--el-text-color-regular);
}

/* 移动端响应式 */
@media (max-width: 768px) {
  .decision-result {
    padding: 16px;
  }

  .dr-title {
    font-size: 1.5rem;
    margin-bottom: 16px;
  }

  .dr-actions {
    flex-direction: column;
  }

  .dr-actions .el-button {
    width: 100%;
  }
}
</style>
