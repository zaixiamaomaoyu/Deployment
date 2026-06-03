<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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

// F5: initialNodeId 透传到 composable
const state = useDecisionTree(props.data, props.initialNodeId)
const finalResult = ref<DecisionTreeCompletePayload | null>(null)

// 派生：是否处于结果态（F15: 单一派生状态，替代 finished + finalResult 双 ref）
const isResultState = computed(() => state.isFinished.value && finalResult.value !== null)

// F4: watch data.rootId 而非 props.data 引用，避免父组件无关引用变化触发 reset
watch(
  () => props.data.rootId,
  () => {
    finalResult.value = null
    state.reset()
  },
)

// F5: initialNodeId 变化时也 reset 到新起点
watch(
  () => props.initialNodeId,
  (newVal) => {
    if (newVal && props.data.nodes[newVal]) {
      finalResult.value = null
      state.reset()
      // reset 内部已使用 startId，但 startId 在闭包中是初始值；
      // 切换 initialNodeId 时需要让 composable 重新初始化 → 这里通过显式赋值 currentNodeId
      state.currentNodeId.value = newVal
    }
  },
)

// F12: 切换锁，防止快速连点导致 answers 重复 push
// 锁延迟一个 microtask 释放，确保同一同步连发序列中的后续点击被拦截
const isTransitioning = ref(false)

const currentOptions = computed<DecisionTreeOption[]>(() => state.currentNode.value?.options ?? [])

function handleSelect(option: DecisionTreeOption) {
  if (isTransitioning.value) return
  isTransitioning.value = true
  const outcome = state.selectOption(option)
  if (outcome) {
    if (outcome.type === 'advance') {
      emit('advance', outcome.nextNode)
    } else {
      finalResult.value = outcome.payload
      emit('complete', outcome.payload)
    }
  }
  // 在下一个 microtask 释放锁，拦截同步连发的后续点击
  queueMicrotask(() => {
    isTransitioning.value = false
  })
}

function handleBack() {
  if (isTransitioning.value) return
  const node = state.goBack()
  if (node) emit('back', node)
}

function handleRestart() {
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
  }
  // F2: 删除 Enter/Space 分支，让原生 button click 处理激活（避免双触发）
  if (nextIndex !== null) {
    // F11: 单选项节点 nextIndex === index 时早返，避免无意义 focus
    if (nextIndex === index) return
    event.preventDefault()
    const parent = current.parentElement
    const radios = parent?.querySelectorAll<HTMLElement>('[role="button"]')
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
    <div v-else-if="isResultState && finalResult" class="dt-result">
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
      <!-- F16: 挂载 <Transition> 让 fade-slide 生效，满足 AC #3 过渡动画 -->
      <Transition name="fade-slide" mode="out-in">
        <div :key="state.currentNode.value.id" class="dt-question__inner">
          <h2 data-testid="dt-question" class="dt-question__title">
            {{ state.currentNode.value.question }}
          </h2>

          <div class="dt-options" role="list" aria-label="决策选项">
            <button
              v-for="(opt, idx) in currentOptions"
              :key="opt.id"
              :data-testid="`dt-option-${opt.id}`"
              role="button"
              :aria-pressed="false"
              :aria-label="opt.label"
              class="dt-option"
              type="button"
              @click="handleSelect(opt)"
              @keydown="handleKeydown($event, currentOptions, idx)"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
      </Transition>

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

.dt-question__inner {
  width: 100%;
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
  /* F14: 长 label 文本换行，避免 320px 极小屏溢出 */
  white-space: normal;
  word-break: break-word;
  line-height: 1.45;
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
