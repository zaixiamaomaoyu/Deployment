/** 聊天消息角色 */
export type ChatRole = 'user' | 'assistant'

/** 聊天消息 */
export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  timestamp: number
  error?: boolean
  aborted?: boolean // 标记消息是否被中断
}

/** AIChat 组件状态 */
export type AIChatStatus = 'idle' | 'loading' | 'streaming' | 'error'
