import { pool } from '../config/database';
import { logger } from '../utils/logger';

/** 对话历史记录项 */
export interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
  created_at: Date;
}

/**
 * 对话日志数据模型
 *
 * 负责异步写入、查询、删除 AI 对话记录
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

  /**
   * 查询用户的对话历史
   *
   * @param userId - 用户 ID
   * @param limit - 返回的最大记录数，默认 50
   * @returns 按时间升序排列的对话记录
   */
  static async findByUserId(
    userId: number,
    limit = 50
  ): Promise<ChatHistoryItem[]> {
    const query = `
      SELECT role, content, created_at
      FROM chat_logs
      WHERE user_id = ?
      ORDER BY created_at ASC
      LIMIT ?
    `;
    const [rows] = await pool.execute(query, [userId, limit]);
    return rows as ChatHistoryItem[];
  }

  /**
   * 删除用户的所有对话记录
   *
   * @param userId - 用户 ID
   */
  static async deleteByUserId(userId: number): Promise<void> {
    const query = 'DELETE FROM chat_logs WHERE user_id = ?';
    await pool.execute(query, [userId]);
  }
}
