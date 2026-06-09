<script setup lang="ts">
import { ref, nextTick, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useAIChat } from '@/composables/useAIChat'
import { copyToClipboard } from '@/utils/copy-to-clipboard'
import { ElMessage } from 'element-plus'
import { Close, CopyDocument, RefreshRight, Delete } from '@element-plus/icons-vue'
import type { ChatMessage } from '@/types/ai-chat'

interface Props {
  visible: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
}>()

const router = useRouter()
const userStore = useUserStore()
const { messages, status, sendMessage, clearMessages, retryLast } = useAIChat()

const inputText = ref('')
const messagesContainerRef = ref<HTMLElement>()

/** 是否正在流式输出 */
const isStreaming = computed(() => status.value === 'streaming')

/** 是否有消息可以清空 */
const hasMessages = computed(() => messages.value.length > 0)

/** 自动滚动到底部 */
watch(
  messages,
  async () => {
    await nextTick()
    if (messagesContainerRef.value) {
      messagesContainerRef.value.scrollTop = messagesContainerRef.value.scrollHeight
    }
  },
  { deep: true }
)

/** 发送消息 */
async function handleSend() {
  const text = inputText.value.trim()
  if (!text || isStreaming.value) return
  inputText.value = ''
  await sendMessage(text)
}

/** 复制 AI 回复内容 */
async function handleCopy(content: string) {
  try {
    await copyToClipboard(content)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败，请手动复制')
  }
}

/** 重试上一条失败消息 */
async function handleRetry() {
  await retryLast()
}

/** 清空对话 */
function handleClear() {
  clearMessages()
}

/** 关闭面板 */
function handleClose() {
  emit('update:visible', false)
  emit('close')
}

/** 跳转登录 */
function goToLogin() {
  handleClose()
  router.push('/login')
}

/** 格式化时间 */
function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <transition name="aichat-slide">
    <div v-show="visible" class="aichat-panel" data-testid="ac-panel">
      <!-- 头部 -->
      <div class="ac-header">
        <div class="ac-header__title">
          <span class="ac-header__icon">🤖</span>
          <span>AI 学习助手</span>
        </div>
        <div class="ac-header__actions">
          <el-button
            v-if="hasMessages"
            :icon="Delete"
            circle
            size="small"
            data-testid="ac-clear"
            aria-label="清空对话"
            @click="handleClear"
          />
          <el-button
            :icon="Close"
            circle
            size="small"
            data-testid="ac-close"
            aria-label="关闭 AI 助手"
            @click="handleClose"
          />
        </div>
      </div>

      <!-- 消息区域 -->
      <div
        ref="messagesContainerRef"
        class="ac-messages"
        role="log"
        aria-live="polite"
        aria-label="AI 助手对话"
        data-testid="ac-messages"
      >
        <!-- 空状态 -->
        <div v-if="messages.length === 0" class="ac-empty">
          <div class="ac-empty__icon">💬</div>
          <p class="ac-empty__text">有问题可以问我...</p>
          <p class="ac-empty__hint">我可以帮你解答部署相关问题</p>
        </div>

        <!-- 消息列表 -->
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="ac-message"
          :class="{
            'ac-message--user': msg.role === 'user',
            'ac-message--assistant': msg.role === 'assistant',
            'ac-message--error': msg.error,
          }"
        >
          <div class="ac-message__avatar">
            {{ msg.role === 'user' ? '👤' : '🤖' }}
          </div>
          <div class="ac-message__body">
            <div class="ac-message__content">
              <template v-if="msg.content">{{ msg.content }}</template>
              <!-- AI 回复未开始时显示打字动画 -->
              <span
                v-else-if="msg.role === 'assistant' && isStreaming"
                class="ac-typing"
              >
                <span class="ac-typing__dot"></span>
                <span class="ac-typing__dot"></span>
                <span class="ac-typing__dot"></span>
              </span>
              <!-- 流式输出光标 -->
              <span
                v-if="msg.role === 'assistant' && msg.content && isStreaming && msg === messages[messages.length - 1]"
                class="ac-cursor"
                aria-hidden="true"
              >▊</span>
            </div>
            <div class="ac-message__meta">
              <span class="ac-message__time">{{ formatTime(msg.timestamp) }}</span>
              <!-- 复制按钮（AI 回复完成后显示） -->
              <el-button
                v-if="msg.role === 'assistant' && msg.content && !isStreaming && !msg.error"
                :icon="CopyDocument"
                circle
                size="small"
                class="ac-message__copy"
                aria-label="复制回复内容"
                @click="handleCopy(msg.content)"
              />
              <!-- 重试按钮（错误消息显示） -->
              <el-button
                v-if="msg.error"
                :icon="RefreshRight"
                circle
                size="small"
                type="danger"
                class="ac-message__retry"
                data-testid="ac-retry"
                aria-label="重试"
                @click="handleRetry"
              />
            </div>
          </div>
        </div>

      </div>

      <!-- 未登录提示 -->
      <div v-if="!userStore.isLoggedIn" class="ac-login-hint" data-testid="ac-login-hint">
        <p>请先登录后使用 AI 助手</p>
        <el-button type="primary" size="small" @click="goToLogin">登录</el-button>
      </div>

      <!-- 输入区域 -->
      <div v-else class="ac-input-area">
        <el-input
          v-model="inputText"
          placeholder="有问题可以问我..."
          data-testid="ac-input"
          :disabled="isStreaming"
          @keyup.enter="handleSend"
        >
          <template #append>
            <el-button
              type="primary"
              data-testid="ac-send"
              :disabled="!inputText.trim() || isStreaming"
              aria-label="发送消息"
              @click="handleSend"
            >
              发送
            </el-button>
          </template>
        </el-input>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.aichat-panel {
  position: fixed;
  bottom: 100px;
  right: 32px;
  width: 400px;
  max-height: 600px;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  z-index: 201;
  overflow: hidden;
}

/* 过渡动画 */
.aichat-slide-enter-active,
.aichat-slide-leave-active {
  transition: all 0.3s ease;
}

.aichat-slide-enter-from,
.aichat-slide-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

/* 头部 */
.ac-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--primary-color, #409eff);
  color: #fff;
  flex-shrink: 0;
}

.ac-header__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}

.ac-header__icon {
  font-size: 20px;
}

.ac-header__actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.ac-header__actions :deep(.el-button) {
  color: #fff;
  background: rgba(255, 255, 255, 0.15);
  border: none;
}

.ac-header__actions :deep(.el-button:hover) {
  background: rgba(255, 255, 255, 0.3);
}

/* 消息区域 */
.ac-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 300px;
}

/* 空状态 */
.ac-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
  color: #909399;
}

.ac-empty__icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.ac-empty__text {
  font-size: 16px;
  margin-bottom: 4px;
}

.ac-empty__hint {
  font-size: 13px;
  color: #c0c4cc;
}

/* 消息 */
.ac-message {
  display: flex;
  gap: 8px;
  max-width: 85%;
}

.ac-message--user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.ac-message--assistant {
  align-self: flex-start;
}

.ac-message--error .ac-message__content {
  color: var(--danger-color, #f56c6c);
  background: #fef0f0;
}

.ac-message__avatar {
  font-size: 24px;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ac-message__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ac-message__content {
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

.ac-message--user .ac-message__content {
  background: var(--primary-color, #409eff);
  color: #fff;
  border-bottom-right-radius: 2px;
}

.ac-message--assistant .ac-message__content {
  background: #f4f4f5;
  color: #303133;
  border-bottom-left-radius: 2px;
}

.ac-message__meta {
  display: flex;
  align-items: center;
  gap: 4px;
}

.ac-message--user .ac-message__meta {
  justify-content: flex-end;
}

.ac-message__time {
  font-size: 11px;
  color: #c0c4cc;
}

.ac-message__copy,
.ac-message__retry {
  opacity: 0;
  transition: opacity 0.2s;
}

.ac-message:hover .ac-message__copy,
.ac-message:hover .ac-message__retry {
  opacity: 1;
}

/* 流式光标动画 */
.ac-cursor {
  animation: cursor-blink 0.8s infinite;
  color: var(--primary-color, #409eff);
  font-weight: bold;
}

@keyframes cursor-blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* 打字动画（三点） */
.ac-typing {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
}

.ac-typing__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #c0c4cc;
  animation: typing-dot 1.2s infinite ease-in-out;
}

.ac-typing__dot:nth-child(2) {
  animation-delay: 0.2s;
}

.ac-typing__dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing-dot {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

/* 未登录提示 */
.ac-login-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-top: 1px solid #ebeef5;
  font-size: 14px;
  color: #909399;
  flex-shrink: 0;
}

/* 输入区域 */
.ac-input-area {
  padding: 12px 16px;
  border-top: 1px solid #ebeef5;
  background: #fff;
  flex-shrink: 0;
}

.ac-input-area :deep(.el-input-group__append) {
  padding: 0;
}

.ac-input-area :deep(.el-input-group__append .el-button) {
  border-radius: 0 4px 4px 0;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .aichat-panel {
    bottom: 0;
    right: 0;
    left: 0;
    width: 100%;
    max-height: 70vh;
    border-radius: 16px 16px 0 0;
  }

  .aichat-slide-enter-from,
  .aichat-slide-leave-to {
    transform: translateY(100%);
    opacity: 1;
  }
}
</style>
