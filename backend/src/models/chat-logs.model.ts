import { pool } from '../config/database';
import { logger } from '../utils/logger';

/**
 * 对话日志数据模型
 *
 * 负责异步写入 AI 对话记录到 chat_logs 表
 * 所有写入操作均为异步，不阻塞主流程
 */
export class ChatLogsModel {
  /**
   * 插入一条对话日志
   *
   * 异步执行，失败仅记录日志，不抛出异常
   *
   * @param userId - 用户 ID
   * @param role - 消息角色（user 或 assistant）
   * @param content - 消息内容
   */
  static async insert(
    userId: number,
    role: 'user' | 'assistant',
    content: string
  ): Promise<void> {
    try {
      const query = `
        INSERT INTO chat_logs (user_id, role, content)
        VALUES (?, ?, ?)
      `;
      await pool.execute(query, [userId, role, content]);
    } catch (error) {
      // 异步写日志失败不应阻塞主流程，仅记录错误
      logger.error('写入对话日志失败:', error);
    }
  }
}
