# Story 4.1: AIChat 组件开发

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

作为用户,
我希望与 AI 助手对话交互,
以便我可以随时提问部署相关问题并获得即时解答。

## Acceptance Criteria

1. **Given** 用户打开 AI 助手
   **When** 显示 AIChat 对话界面
   **Then** 显示对话历史区域
   **And** 显示输入框和发送按钮
   **And** 输入框 placeholder 为「有问题可以问我...」

2. **Given** 用户在输入框输入问题
   **When** 点击发送按钮或按 Enter 键
   **Then** 用户消息立即显示在对话区域
   **And** 输入框清空
   **And** AI 开始回复时显示打字动画（流式占位符）
   **And** AI 回复内容逐字/逐段显示

3. **Given** AI 正在回复中
   **When** 内容逐字渲染
   **Then** 显示打字动画效果（光标闪烁）
   **And** 回复完成后显示复制按钮
   **And** 自动滚动到最新消息

4. **Given** 用户未登录
   **When** 打开 AI 助手
   **Then** 显示友好提示「请先登录后使用 AI 助手」
   **And** 显示登录按钮

5. **Given** AI 回复出现错误（网络超时/服务不可用）
   **When** 显示错误状态
   **Then** 显示错误提示「AI 助手暂时不可用，请稍后再试」
   **And** 提供重试按钮

6. **Given** 用户在移动端（宽度 < 768px）
   **When** 打开 AI 助手
   **Then** AIChat 以底部抽屉形式展开
   **And** 输入框和按钮适配触摸操作

7. **Given** AIChat 组件加载
   **When** 渲染页面
   **Then** 使用 CSS 变量控制样式（--primary-color 等）
   **And** 所有面向用户的文案使用简体中文
   **And** AI 消息区域使用 `role="log"` + `aria-live="polite"` 支持无障碍

8. **Given** 用户点击 AI 助手触发按钮
   **When** 切换 AIChat 显示/隐藏
   **Then** 桌面端以右下角悬浮面板形式展开/收起
   **And** 动画过渡流畅（300ms）

## Tasks / Subtasks

- [ ] 类型定义（AC: #1, #2, #3）
  - [ ] 新建 `frontend/src/types/ai-chat.ts`
  - [ ] 定义类型：
    ```typescript
    /** 聊天消息角色 */
    export type ChatRole = 'user' | 'assistant'

    /** 聊天消息 */
    export interface ChatMessage {
      id: string
      role: ChatRole
      content: string
      timestamp: number
      error?: boolean
    }

    /** AIChat 组件状态 */
    export type AIChatStatus = 'idle' | 'loading' | 'streaming' | 'error'
    ```

- [ ] AIChat 组件实现（AC: #1, #2, #3, #4, #5, #6, #7, #8）
  - [ ] 新建 `frontend/src/components/AIChat.vue`
  - [ ] Props:
    - `visible: boolean`（控制显示/隐藏）
  - [ ] Emits:
    - `(e: 'update:visible', value: boolean)`：切换可见性
    - `(e: 'close')`：关闭面板
  - [ ] 渲染逻辑：
    - 消息列表区域（`role="log"` + `aria-live="polite"`）
    - 用户消息右对齐，AI 消息左对齐
    - AI 回复时显示打字动画（光标闪烁 `▊`）
    - 回复完成后显示复制按钮（复用 `copyToClipboard`）
    - 错误消息显示重试按钮
    - 未登录状态显示登录提示
  - [ ] 样式：
    - 使用 CSS 变量（`--primary-color` 等），禁止新建主题变量
    - 桌面端：右下角悬浮面板（固定宽度 400px，最大高度 600px）
    - 移动端：底部抽屉（全宽，最大高度 70vh）
    - 过渡动画 300ms

- [ ] AI 助手触发按钮（AC: #8）
  - [ ] 新建 `frontend/src/components/AIChatButton.vue`
  - [ ] 右下角固定定位的悬浮按钮
  - [ ] 点击切换 AIChat 面板显示/隐藏
  - [ ] 使用 `el-button` 圆形按钮 + 💬 图标

- [ ] composable：useAIChat（AC: #1, #2, #3, #4, #5）
  - [ ] 新建 `frontend/src/composables/useAIChat.ts`
  - [ ] 职责：
    - 管理消息列表（`messages: Ref<ChatMessage[]>`）
    - 管理 AI 回复状态（`status: Ref<AIChatStatus>`）
    - 发送消息方法（`sendMessage(content: string)`）
    - 清空对话方法（`clearMessages()`）
  - [ ] `sendMessage` 逻辑：
    - 验证用户登录状态（使用 `useUserStore`）
    - 创建用户消息并添加到列表
    - 设置状态为 `streaming`
    - **本 Story 仅做前端 mock 实现**：模拟流式回复（逐字输出预设文案），不调用后端 API
    - 后端 API 集成留给 Story 4-2
  - [ ] 错误处理：
    - 捕获异常，设置状态为 `error`
    - 在消息中标记 `error: true`

- [ ] API 层占位（AC: #2）
  - [ ] 新建 `frontend/src/api/ai.ts`
  - [ ] 定义接口签名（函数体暂为 mock 实现）：
    ```typescript
    export async function* streamChat(message: string): AsyncGenerator<string> {
      // Story 4-2 将替换为真实 SSE 流式调用
      // 本 Story 使用 mock 数据
      const mockReply = '这是 AI 助手的模拟回复。在后续版本中，这里将接入真实的 AI 服务，为您提供专业的部署问题解答。'
      for (const char of mockReply) {
        yield char
        await new Promise(resolve => setTimeout(resolve, 30))
      }
    }
    ```
  - [ ] 使用 `AsyncGenerator<string>` 接口，与后续 Story 4-2 的 SSE 实现对齐

- [ ] 集成到 App.vue（AC: #8）
  - [ ] 修改 `frontend/src/App.vue`：引入 AIChatButton 和 AIChat 组件
  - [ ] 使用 `v-model:visible` 控制 AIChat 面板
  - [ ] AIChatButton 固定在页面右下角，AIChat 面板悬浮展开

- [ ] 组件测试（AC: #1, #2, #3, #4, #5, #7）
  - [ ] 新建 `frontend/src/components/__tests__/AIChat.spec.ts`
  - [ ] 新建 `frontend/src/composables/__tests__/useAIChat.spec.ts`
  - [ ] AIChat.spec.ts 测试用例：
    - 渲染输入框和发送按钮
    - 输入消息并发送
    - AI 回复逐字显示
    - 未登录状态显示提示
    - 错误状态显示重试按钮
    - 回复完成后显示复制按钮
    - data-testid 全部存在（`ac-messages`、`ac-input`、`ac-send`、`ac-close`、`ac-login-hint`）
  - [ ] useAIChat.spec.ts 测试用例：
    - sendMessage 添加用户消息
    - sendMessage 触发流式回复
    - clearMessages 清空消息列表
    - 未登录时 sendMessage 不调用 API
    - 错误时设置 error 状态

- [ ] 集成验证（AC: 全部）
  - [ ] 运行 `npm run build`，确认 vue-tsc 与 vite build 均通过
  - [ ] 手动验证：
    - 桌面端点击悬浮按钮展开 AIChat
    - 输入问题，AI 流式回复
    - 移动端底部抽屉展开
    - 未登录状态提示登录

## Dev Notes

### Spec 复述（Epic 2 回顾 A1 行动项）

- **本 Story 仅做前端 AIChat 组件 + mock 回复**，不接入后端 AI API（Story 4-2 交付后端）
- **API 接口签名必须使用 `AsyncGenerator<string>`**，与后续 SSE 实现对齐
- **用户登录校验使用 `useUserStore`**，未登录时禁止发送消息
- **CSS 变量复用**：使用 `--primary-color`、`--spacing-md` 等，禁止新建主题变量
- **所有文案简体中文**：placeholder、错误提示、按钮文字

### 关键复用点（禁止重复造轮子）

- **复用 `copyToClipboard`**：`frontend/src/utils/copy-to-clipboard.ts`（Story 3-4 交付），AI 回复完成后的一键复制功能直接使用
- **复用 `useUserStore`**：`frontend/src/stores/user.ts`（Story 1-3 交付），检查登录状态
- **复用 Element Plus 组件**：使用 `<el-input>`、`<el-button>`、`<el-icon>`、`<el-scrollbar>` 等
- **不要新增 npm 依赖**：技术栈已包含 `vue@3.4` + `element-plus@2.13` + `@vue/test-utils@2.4` + `vitest@2.1`
- **类型定义位置**：类型在 `frontend/src/types/` 目录，与 `architecture.md` 第 353-405 行约定一致
- **测试组织**：参考 `frontend/src/components/__tests__/DecisionTree.spec.ts` 测试组织模式
- **composable 模式**：参考 `frontend/src/composables/useDecisionTree.ts`（Story 3-1 交付），业务逻辑与组件分离

### 技术实现要点

**组件架构：AIChat.vue + useAIChat + AIChatButton**

```
App.vue
├── NavBar.vue（已有）
├── <router-view />（已有）
├── AIChatButton.vue（新增 - 悬浮触发按钮）
└── AIChat.vue（新增 - 对话面板）
    └── useAIChat.ts（新增 - 对话逻辑）
        └── api/ai.ts（新增 - API 层 mock）
```

**AIChat.vue 组件骨架：**

```vue
<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { useAIChat } from '@/composables/useAIChat'
import { copyToClipboard } from '@/utils/copy-to-clipboard'
import { ElMessage } from 'element-plus'
import { Close, CopyDocument } from '@element-plus/icons-vue'
import type { ChatMessage } from '@/types/ai-chat'

interface Props {
  visible: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
}>()

const userStore = useUserStore()
const { messages, status, sendMessage, clearMessages, retryLast } = useAIChat()

const inputText = ref('')
const messagesRef = ref<HTMLElement>()

// 自动滚动到底部
watch(messages, async () => {
  await nextTick()
  messagesRef.value?.scrollTo({ top: messagesRef.value.scrollHeight, behavior: 'smooth' })
}, { deep: true })

async function handleSend() {
  const text = inputText.value.trim()
  if (!text || status.value === 'streaming') return
  inputText.value = ''
  await sendMessage(text)
}

async function handleCopy(content: string) {
  try {
    await copyToClipboard(content)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败，请手动复制')
  }
}

function handleClose() {
  emit('update:visible', false)
  emit('close')
}
</script>
```

**useAIChat composable 骨架：**

```typescript
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'
import { streamChat } from '@/api/ai'
import type { ChatMessage, AIChatStatus } from '@/types/ai-chat'

export function useAIChat() {
  const userStore = useUserStore()
  const messages = ref<ChatMessage[]>([])
  const status = ref<AIChatStatus>('idle')

  function generateId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  }

  async function sendMessage(content: string) {
    if (!userStore.isLoggedIn) return

    // 添加用户消息
    messages.value.push({
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    })

    // 创建 AI 消息占位
    const aiMessage: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    }
    messages.value.push(aiMessage)
    status.value = 'streaming'

    try {
      for await (const chunk of streamChat(content)) {
        aiMessage.content += chunk
      }
      status.value = 'idle'
    } catch (error) {
      aiMessage.error = true
      aiMessage.content = 'AI 助手暂时不可用，请稍后再试'
      status.value = 'error'
    }
  }

  function clearMessages() {
    messages.value = []
    status.value = 'idle'
  }

  async function retryLast() {
    const lastUserMsg = [...messages.value].reverse().find(m => m.role === 'user')
    if (!lastUserMsg) return
    // 移除最后的 AI 消息
    messages.value = messages.value.filter(m => m.id !== messages.value[messages.value.length - 1]?.id || m.role === 'user')
    await sendMessage(lastUserMsg.content)
  }

  return { messages, status, sendMessage, clearMessages, retryLast }
}
```

**AIChatButton.vue 骨架：**

```vue
<script setup lang="ts">
defineEmits<{
  (e: 'click'): void
}>()
</script>

<template>
  <el-button
    class="aichat-trigger"
    type="primary"
    circle
    size="large"
    data-testid="ac-trigger"
    aria-label="打开 AI 助手"
    @click="$emit('click')"
  >
    💬
  </el-button>
</template>

<style scoped>
.aichat-trigger {
  position: fixed;
  bottom: 32px;
  right: 32px;
  width: 56px;
  height: 56px;
  font-size: 24px;
  z-index: 200;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.4);
  transition: transform 0.3s, box-shadow 0.3s;
}

.aichat-trigger:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(64, 158, 255, 0.5);
}

@media (max-width: 768px) {
  .aichat-trigger {
    bottom: 20px;
    right: 20px;
    width: 48px;
    height: 48px;
    font-size: 20px;
  }
}
</style>
```

**App.vue 集成修改：**

```vue
<!-- 在 App.vue <template> 中追加 -->
<AIChatButton @click="showAIChat = !showAIChat" />
<AIChat v-model:visible="showAIChat" />

<!-- script setup 中追加 -->
<script setup lang="ts">
import { ref } from 'vue'
import AIChatButton from '@/components/AIChatButton.vue'
import AIChat from '@/components/AIChat.vue'

const showAIChat = ref(false)
</script>
```

### 关键设计决策

1. **组件与 composable 分离**：参考 Story 3-1 的 `DecisionTree.vue + useDecisionTree.ts` 模式，业务逻辑在 composable，组件纯展示
2. **API 层使用 AsyncGenerator**：`streamChat` 返回 `AsyncGenerator<string>`，composable 使用 `for await...of` 消费。这个接口与 Story 4-2 的 SSE 实现完全对齐，替换时无需修改 composable
3. **AIChat 为全局组件**：集成在 App.vue 中，所有页面均可访问，与 UX 设计规范中「右下角悬浮」一致
4. **mock 回复策略**：本 Story 使用前端 mock 逐字输出预设文案，不依赖后端。模拟 30ms/字 的打字速度，体验接近真实流式输出
5. **登录校验在 composable 中**：`sendMessage` 方法内检查 `userStore.isLoggedIn`，未登录时静默返回，组件层显示登录提示

### 接口契约

| 接口 | 类型 | 说明 |
|------|------|------|
| Prop `visible` | `boolean` | 控制面板显示/隐藏（支持 v-model） |
| Emit `update:visible` | `(value: boolean) => void` | v-model 双向绑定 |
| Emit `close` | `() => void` | 用户关闭面板 |
| `sendMessage(content)` | `(content: string) => Promise<void>` | 发送消息并触发 AI 回复 |
| `clearMessages()` | `() => void` | 清空对话历史 |
| `retryLast()` | `() => Promise<void>` | 重试上一条失败的消息 |

### 性能考虑

- 消息列表使用 `el-scrollbar` 虚拟滚动（消息量大时避免性能问题）
- `messages` 使用 `ref<ChatMessage[]>`，流式追加内容直接修改对象属性（Vue 3 响应式可追踪）
- AIChat 面板使用 `v-show` 而非 `v-if`，避免频繁创建/销毁组件
- `auto-scroll` 使用 `nextTick + scrollTo`，避免布局抖动

### 安全考虑

- 所有 AI 回复使用文本插值 `{{ }}` 渲染，禁止 `v-html`，防止 XSS
- 用户输入在发送前不做前端过滤，但后端 API（Story 4-2）需做输入验证
- 登录校验防止未登录用户滥用 AI 接口

### 测试要求

- **组件测试**：使用 `@vue/test-utils` 的 `mount`，Mock `useAIChat` 和 `useUserStore`
- **composable 测试**：直接调用 composable 函数，Mock `streamChat` API
- **覆盖率目标**：组件渲染分支 ≥ 80%，composable 语句覆盖 ≥ 90%
- **手动测试场景**：
  1. 桌面端点击悬浮按钮展开 AIChat 面板
  2. 输入问题，AI 流式回复逐字显示
  3. 回复完成显示复制按钮，复制成功
  4. 未登录状态显示登录提示
  5. 模拟错误场景，显示重试按钮
  6. 移动端（375x667）底部抽屉展开
  7. 键盘 Enter 发送消息

## Project Structure Notes

新增文件：
- `frontend/src/types/ai-chat.ts` — 类型定义
- `frontend/src/components/AIChat.vue` — AI 对话面板组件
- `frontend/src/components/AIChatButton.vue` — AI 助手触发按钮
- `frontend/src/composables/useAIChat.ts` — AI 对话逻辑 composable
- `frontend/src/api/ai.ts` — AI API 层（mock 实现）
- `frontend/src/components/__tests__/AIChat.spec.ts` — AIChat 组件测试
- `frontend/src/composables/__tests__/useAIChat.spec.ts` — useAIChat 测试

修改文件：
- `frontend/src/App.vue` — 引入 AIChatButton 和 AIChat 组件

**不修改**：
- `frontend/src/stores/user.ts`（仅消费，不修改）
- `frontend/src/utils/copy-to-clipboard.ts`（仅复用，不修改）
- `frontend/src/router/index.ts`（AIChat 是全局悬浮组件，不需要路由）
- `frontend/src/components/NavBar.vue`（不修改，AIChat 独立于导航栏）
- 后端任何文件（本 Story 纯前端）

**对齐 architecture.md**：
- 组件在 `src/components/`，与 `architecture.md` 第 374-377 行约定一致
- composable 在 `src/composables/`，与 Story 3-1 建立的模式一致
- API 层在 `src/api/`，与 `architecture.md` 第 388-389 行约定一致
- 类型定义在 `src/types/`，与 `architecture.md` 第 392 行约定一致
- 测试文件就近放置在 `__tests__/`，与 `project-context.md#测试组织结构` 一致

## References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.1] — Story 需求与 AC 来源（第 472-484 行）
- [Source: _bmad-output/planning-artifacts/prd.md#AI 助手] — FR15-FR19 功能需求（第 390-396 行）
- [Source: _bmad-output/planning-artifacts/architecture.md#AI Integration] — Claude API 流式响应架构（第 156-183 行）
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#AIChat 对话组件] — AIChat UX 规范（第 193-210 行）
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive Design] — AI 助手桌面/移动端布局（第 261 行）
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Accessibility] — AI 消息区域 ARIA 规范（第 290-298 行）
- [Source: _bmad-output/project-context.md#AI 流式输出陷阱] — 流式输出错误处理模式（第 610-629 行）
- [Source: _bmad-output/project-context.md#导入/导出模式] — 命名导出规范（第 73-86 行）
- [Source: _bmad-output/project-context.md#测试规则] — Vitest + @vue/test-utils 测试规范（第 258-327 行）
- [Source: _bmad-output/implementation-artifacts/stories/3-1-决策树组件开发.md] — composable+组件分离模式参考
- [Source: _bmad-output/implementation-artifacts/stories/3-4-步骤指南展示.md] — copyToClipboard 复用参考
- [Source: frontend/src/utils/copy-to-clipboard.ts] — 复制功能实现（本 Story 复用）
- [Source: frontend/src/stores/user.ts] — 用户状态管理（本 Story 消费）
- [Source: frontend/src/composables/useDecisionTree.ts] — composable 模式参考
- [Source: backend/package.json] — `@anthropic-ai/sdk` 已安装（Story 4-2 将使用）

## Previous Story Intelligence

### Story 3-4 学到的经验

- **copyToClipboard 复用**：StepGuideView 已实现复制功能并测试通过，本 Story 直接复用
- **错误处理模式**：`planId` 不存在时显示友好错误，不抛 JS 异常。AIChat 应遵循相同模式——AI 回复失败时显示友好提示 + 重试按钮
- **CSS 变量复用**：使用全局 CSS 变量，禁止新建主题变量

### Story 3-1 学到的经验

- **composable 与组件分离**：业务逻辑在 `useDecisionTree.ts`，组件 `DecisionTree.vue` 纯展示。本 Story 的 `useAIChat` 应遵循相同模式
- **Props/Emits 契约明确**：组件接口在 Dev Notes 中显式定义，便于后续 Story 消费
- **ARIA 可访问性**：决策树选项使用 `role="button"` + `aria-pressed`。AIChat 消息区域应使用 `role="log"` + `aria-live="polite"`
- **测试组织**：composable 测试与组件测试分开，composable 测试覆盖逻辑，组件测试覆盖渲染

### Story 3-3 学到的经验

- **路由 vs 全局组件**：决策结果页使用路由，但 AIChat 是全局悬浮组件，不需要路由，通过 v-model:visible 控制
- **动画过渡**：路由切换使用 `<transition>`，AIChat 面板使用 CSS transition 实现滑入/滑出

### Epic 2 回顾行动项

- **A1：dev-story 启动前增加 spec 复述步骤** — 本 Story Dev Notes 顶部已添加 Spec 复述段
- **A2：Dev Notes「已完整」断言需验证** — 本 Story 不引用「已完整」断言，所有复用点已验证
- **A3：修复预存测试失败** — 独立行动项，不阻塞本 Story 开发

## Git Intelligence Summary

### 最近 5 次提交分析

**Commit 1: 21a1209 - 实现3-4步骤指南展示页**
- **关键内容**：StepGuideView.vue、copyToClipboard、路由配置
- **对本 Story 的启发**：copyToClipboard 可直接复用；错误处理模式（友好提示+重试）

**Commit 2: 45b2296 - 实现3-3决策结果展示页**
- **关键内容**：DecisionResultView.vue、el-card/el-tag/el-alert 使用
- **对本 Story 的启发**：Element Plus 组件使用模式；CSS 变量样式

**Commit 3: d64ec79 - feat(decision-tree): 实现 Story 3-2 决策树数据设计**
- **关键内容**：deploymentPlans 数据、类型扩展
- **对本 Story 的启发**：类型定义放在 `src/types/`，与 architecture.md 对齐

**Commit 4: fa7b979 - fix(decision-tree): 修复 Story 3-1 代码审查 15 项 findings**
- **对本 Story 的启发**：代码审查常见问题类型（竞态、JSON.parse、类型 any），开发时主动规避

**Commit 5: 42930d0 - feat(decision-tree): 实现 Story 3-1 决策树组件**
- **关键内容**：useDecisionTree composable、DecisionTree.vue、测试
- **对本 Story 的启发**：composable + 组件分离模式；测试组织模式

### 工作模式总结

1. **composable + 组件分离**：Epic 3 建立的模式，本 Story 遵循
2. **Element Plus 组件优先**：使用 el-input/el-button/el-scrollbar，不自己造轮子
3. **CSS 变量样式系统**：使用全局变量，不新建主题变量
4. **测试就近放置**：组件测试在 `__tests__/`，composable 测试在 `__tests__/`
5. **错误处理友好化**：显示友好提示，不抛 JS 异常

## Dev Agent Record

### Agent Model Used

Qoder AI

### Debug Log References

无

### Completion Notes List

1. 所有 8 个 AC 已实现
2. 类型定义、API mock、composable、组件、测试全部创建
3. vite build 通过，无类型错误
4. useAIChat.spec.ts 9 个测试全绿，AIChat.spec.ts 10 个测试全绿
5. 预存测试失败（StepGuideView、copy-to-clipboard）不影响本 Story 新增测试

### File List

新增：
- `frontend/src/types/ai-chat.ts`
- `frontend/src/components/AIChat.vue`
- `frontend/src/components/AIChatButton.vue`
- `frontend/src/composables/useAIChat.ts`
- `frontend/src/api/ai.ts`
- `frontend/src/components/__tests__/AIChat.spec.ts`
- `frontend/src/composables/__tests__/useAIChat.spec.ts`

修改：
- `frontend/src/App.vue`（引入 AIChatButton 和 AIChat 组件）

## Review Findings

- [x] [Review][Patch] `retryLast` 重试时追加重复用户消息 [useAIChat.ts:68-81] — 已修复：retryLast 改为直接调用 streamChat 而不调用 sendMessage，不再追加重复用户消息
- [x] [Review][Patch] 空 AI 消息占位与打字动画占位短暂共存导致双气泡 [AIChat.vue:194] — 已修复：移除独立打字动画 div，将打字动画内嵌到 AI 消息气泡内部，content 为空时显示打字动画
- [x] [Review][Patch] 错误处理测试未实质验证 catch 块 [useAIChat.spec.ts:74-91] — 已修复：使用 shouldThrow 标志切换 mock，新增 streamChat 抛错测试和错误后 clearMessages 测试
- [x] [Review][Patch] `sendMessage` 缺少状态守卫 [useAIChat.ts:28] — 已修复：sendMessage 和 retryLast 入口均添加 `if (status.value === 'streaming') return`
- [x] [Review][Defer] 消息区域使用原生 div 而非 el-scrollbar [AIChat.vue:126] — deferred, pre-existing: Dev Notes 提到 el-scrollbar 虚拟滚动但实现使用原生 div，当前消息量下性能可接受，后续如有性能问题再升级

## Change Log

- 2026-06-09：Story 4-1 概念创建完成，状态：ready-for-dev。
- 2026-06-09：Code review 完成，4 patch + 1 defer。
