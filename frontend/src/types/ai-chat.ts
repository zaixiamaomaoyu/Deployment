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
