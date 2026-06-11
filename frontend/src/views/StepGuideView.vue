<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { deploymentPlans } from '@/data/deployment-plans'
import { copyToClipboard } from '@/utils/copy-to-clipboard'
import type { DeploymentPlan } from '@/types/deployment-plan'

interface Props {
  planId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'go-back'): void
}>()

const router = useRouter()

// 从 deploymentPlans 读取方案详情
const plan = computed<DeploymentPlan | undefined>(() =>
  props.planId ? deploymentPlans[props.planId] : undefined,
)

// 复制状态管理：记录已复制的命令
const copiedCommand = ref<string | null>(null)

// 占位步骤数据（Story 3-5 将替换为来自 deploymentPlans 的真实步骤数据）
const placeholderSteps = [
  {
    title: '步骤 1：环境准备',
    description: '确保本地环境满足部署要求',
    command: 'git clone https://github.com/your-repo.git',
  },
  {
    title: '步骤 2：安装依赖',
    description: '安装项目所需的依赖包',
    command: 'npm install',
  },
  {
    title: '步骤 3：构建项目',
    description: '执行构建命令生成生产产物',
    command: 'npm run build',
  },
]

// 复制命令
async function handleCopyCommand(command: string) {
  try {
    await copyToClipboard(command)
    copiedCommand.value = command
    ElMessage.success('命令已复制到剪贴板')
    setTimeout(() => {
      copiedCommand.value = null
    }, 2000)
  } catch {
    ElMessage.error('复制失败，请手动复制')
  }
}

// 返回决策树
function handleGoBack() {
  emit('go-back')
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push({ name: 'decision-tree' })
  }
}
</script>

<template>
  <div v-if="plan" class="step-guide">
    <!-- 方案名称和简介 -->
    <el-card class="sg-card">
      <h1 data-testid="sg-title">{{ plan.planName }}</h1>
      <p data-testid="sg-intro">{{ plan.summary }}</p>

      <!-- 特点 -->
      <div data-testid="sg-pros" class="sg-pros">
        <h3>优点</h3>
        <el-alert
          v-for="(pro, idx) in plan.pros"
          :key="`pro-${idx}`"
          type="success"
          :closable="false"
        >
          {{ pro }}
        </el-alert>
      </div>

      <div data-testid="sg-cons" class="sg-cons">
        <h3>缺点</h3>
        <el-alert
          v-for="(con, idx) in plan.cons"
          :key="`con-${idx}`"
          type="warning"
          :closable="false"
        >
          {{ con }}
        </el-alert>
      </div>

      <div data-testid="sg-suited-for" class="sg-suited-for">
        <h3>适合人群</h3>
        <el-tag
          v-for="(user, idx) in plan.suitableFor"
          :key="`user-${idx}`"
          style="margin-right: 8px"
        >
          {{ user }}
        </el-tag>
      </div>

      <!-- 外部链接 -->
      <div v-if="plan.externalUrl" class="sg-external-url">
        <h3>官方文档</h3>
        <el-link :href="plan.externalUrl" target="_blank" type="primary">
          {{ plan.externalUrl }}
        </el-link>
      </div>
    </el-card>

    <!-- 步骤列表 -->
    <el-card class="sg-steps-card">
      <h2>部署步骤</h2>
      <div class="sg-steps">
        <div
          v-for="(step, idx) in placeholderSteps"
          :key="idx"
          class="sg-step-item"
        >
          <h3>{{ step.title }}</h3>
          <p>{{ step.description }}</p>
          <div class="sg-code-block">
            <pre><code>{{ step.command }}</code></pre>
            <el-button
              size="small"
              :type="copiedCommand === step.command ? 'success' : 'primary'"
              @click="handleCopyCommand(step.command)"
            >
              {{ copiedCommand === step.command ? '已复制' : '一键复制' }}
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 按钮区域 -->
    <div class="sg-actions">
      <el-button data-testid="sg-back" @click="handleGoBack">
        返回决策树
      </el-button>
    </div>
  </div>

  <!-- 错误状态：planId 不存在 -->
  <div v-else class="sg-error" data-testid="sg-error">
    <p>未找到该方案的步骤指南，请重新选择</p>
    <el-button data-testid="sg-back" @click="handleGoBack">
      返回决策树
    </el-button>
  </div>
</template>

<style scoped>
.step-guide {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.sg-card {
  margin-bottom: 24px;
}

.sg-card h1 {
  font-size: 28px;
  margin-bottom: 12px;
  color: var(--accent);
}

.sg-card p {
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 16px;
}

.sg-pros,
.sg-cons,
.sg-suited-for,
.sg-external-url {
  margin-top: 16px;
}

.sg-pros h3,
.sg-cons h3,
.sg-suited-for h3,
.sg-external-url h3 {
  margin-bottom: 8px;
  font-size: 16px;
}

.sg-steps-card {
  margin-bottom: 24px;
}

.sg-steps-card h2 {
  font-size: 20px;
  margin-bottom: 16px;
  color: var(--accent);
}

.sg-step-item {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.sg-step-item:last-child {
  border-bottom: none;
}

.sg-step-item h3 {
  font-size: 16px;
  margin-bottom: 8px;
}

.sg-step-item p {
  font-size: 14px;
  color: var(--el-text-color-regular);
  margin-bottom: 12px;
}

.sg-code-block {
  background: #f5f7fa;
  border-radius: 4px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.sg-code-block pre {
  flex: 1;
  margin: 0;
  overflow-x: auto;
}

.sg-code-block code {
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

.sg-actions {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

.sg-error {
  max-width: 600px;
  margin: 100px auto;
  text-align: center;
  padding: 24px;
}

.sg-error p {
  font-size: 16px;
  margin-bottom: 16px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .step-guide {
    padding: 16px;
  }

  .sg-card h1 {
    font-size: 24px;
  }

  .sg-card p {
    font-size: 14px;
  }

  .sg-code-block {
    flex-direction: column;
    align-items: flex-start;
  }

  .sg-code-block pre {
    width: 100%;
  }

  .sg-actions {
    flex-direction: column;
  }

  .sg-actions .el-button {
    width: 100%;
  }
}
</style>
