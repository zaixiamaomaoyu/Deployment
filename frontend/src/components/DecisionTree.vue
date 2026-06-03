<script setup lang="ts">
import { ref, watch } from 'vue'
import { useDecisionTree } from '@/composables/useDecisionTree'
import type {
  DecisionTreeCompletePayload,
  DecisionTreeNode,
  DecisionTreeOption,
} from '@/types/decision-tree'

const props = defineProps<{
  data: import('@/types/decision-tree').DecisionTreeData
  initialNodeId?: string
}>()

const emit = defineEmits<{
  (e: 'complete', payload: DecisionTreeCompletePayload): void
  (e: 'advance', node: DecisionTreeNode): void
  (e: 'back', node: DecisionTreeNode): void
}>()

const state = useDecisionTree(props.data)
const finished = ref(false)
const finalResult = ref<DecisionTreeCompletePayload | null>(null)

// 父组件切换 data 时重置组件状态
watch(
  () => props.data,
  () => {
    finished.value = false
    finalResult.value = null
    state.reset()
  },
  { deep: false },
)

function handleSelect(option: DecisionTreeOption) {
  const outcome = state.selectOption(option)
  if (!outcome) return
  if (outcome.type === 'advance') {
    finished.value = false
    emit('advance', outcome.nextNode)
  } else {
    finished.value = true
    finalResult.value = outcome.payload
    emit('complete', outcome.payload)
  }
}

function handleBack() {
  const node = state.goBack()
  if (node) emit('back', node)
}

function handleRestart() {
  finished.value = false
  finalResult.value = null
  state.reset()
}

function handleKeydown(event: KeyboardEvent, options: DecisionTreeOption[], index: number) {
  const current = event.currentTarget as HTMLElement
  let nextIndex: number | null = null
  if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
    nextIndex = (index + 1) % options.length
  } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
    nextIndex = (index - 1 + options.length) % options.length
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    handleSelect(options[index])
    return
  }
  if (nextIndex !== null) {
    event.preventDefault()
    const parent = current.parentElement
    const radios = parent?.querySelectorAll<HTMLElement>('[role="radio"]')
    radios?.[nextIndex]?.focus()
  }
}
</script>

<template>
  <div data-testid="decision-tree" class="decision-tree">
    <!-- 空状态 -->
    <div v-if="state.empty.value" class="dt-empty">
      决策树数据为空
    </div>

    <!-- 结果态 -->
    <div v-else-if="finished && finalResult" class="dt-result">
      <div class="dt-result__icon">🎯</div>
      <div data-testid="dt-result" class="dt-result__text">
        推荐方案：{{ finalResult.result.planName }}
      </div>
      <el-button data-testid="dt-restart" type="primary" @click="handleRestart">
        重新选择
      </el-button>
    </div>

    <!-- 问答态 -->
    <div v-else-if="state.currentNode.value" class="dt-question">
      <h2 data-testid="dt-question" class="dt-question__title">
        {{ state.currentNode.value.question }}
      </h2>

      <div class="dt-options" role="radiogroup" aria-label="决策选项">
        <button
          v-for="(opt, idx) in state.currentNode.value.options"
          :key="opt.id"
          :data-testid="`dt-option-${opt.id}`"
          role="radio"
          :aria-checked="false"
          :aria-label="opt.label"
          class="dt-option"
          type="button"
          @click="handleSelect(opt)"
          @keydown="handleKeydown($event, state.currentNode.value!.options, idx)"
        >
          {{ opt.label }}
        </button>
      </div>

      <div class="dt-footer">
        <el-button
          data-testid="dt-back"
          :disabled="!state.canGoBack.value"
          @click="handleBack"
        >
          上一题
        </el-button>

        <div class="dt-progress-wrap">
          <span data-testid="dt-progress" class="dt-progress">
            {{ state.progress.value.current }} / {{ state.progress.value.total }}
          </span>
          <span data-testid="dt-progress-dots" class="dt-progress__dots">
            <span
              v-for="i in state.progress.value.total"
              :key="i"
              :class="['dt-dot', { 'dt-dot--filled': i <= state.progress.value.current }]"
            />
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.decision-tree {
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  padding: 32px 24px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}

.dt-empty {
  padding: 48px 24px;
  text-align: center;
  color: #9ca3af;
  font-size: 15px;
}

.dt-question__title {
  margin: 0 0 24px;
  font-size: 22px;
  font-weight: 600;
  color: #1f2937;
  text-align: center;
  line-height: 1.4;
}

.dt-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 28px;
}

.dt-option {
  display: block;
  width: 100%;
  padding: 16px 20px;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  color: #1f2937;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
  font-family: inherit;
}

.dt-option:hover {
  background: #eff6ff;
  border-color: #60a5fa;
  color: #1e40af;
}

.dt-option:focus-visible {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.25);
}

.dt-option:active {
  transform: scale(0.98);
}

.dt-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
}

.dt-progress-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dt-progress {
  font-size: 13px;
  color: #6b7280;
  font-variant-numeric: tabular-nums;
}

.dt-progress__dots {
  display: inline-flex;
  gap: 4px;
}

.dt-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e5e7eb;
  transition: background 0.2s ease;
}

.dt-dot--filled {
  background: #409eff;
}

.dt-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px 16px;
  text-align: center;
}

.dt-result__icon {
  font-size: 48px;
}

.dt-result__text {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

/* Vue Transition：fade-slide */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* 尊重用户的动效减弱偏好 */
@media (prefers-reduced-motion: reduce) {
  .fade-slide-enter-active,
  .fade-slide-leave-active,
  .dt-option,
  .dt-dot {
    transition: none !important;
  }
  .dt-option:active {
    transform: none;
  }
}

/* 移动端响应式 */
@media (max-width: 768px) {
  .decision-tree {
    max-width: 100%;
    padding: 20px 16px;
    border-radius: 12px;
  }
  .dt-question__title {
    font-size: 18px;
  }
  .dt-option {
    font-size: 14px;
    padding: 14px 16px;
  }
  .dt-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  .dt-progress-wrap {
    justify-content: center;
  }
}
</style>
