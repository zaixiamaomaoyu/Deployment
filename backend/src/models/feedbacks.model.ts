import { DatabaseService } from '../services/database.service';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export interface Feedback extends RowDataPacket {
  id: number;
  user_id: number;
  content_id?: number;
  type: 'error' | 'suggestion' | 'question' | 'other';
  message: string;
  status: 'pending' | 'processing' | 'resolved' | 'rejected';
  admin_reply?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateFeedbackDto {
  user_id: number;
  content_id?: number;
  type: 'error' | 'suggestion' | 'question' | 'other';
  message: string;
}

export interface UpdateFeedbackDto {
  status?: 'pending' | 'processing' | 'resolved' | 'rejected';
  admin_reply?: string;
}

export interface FeedbackQueryOptions {
  user_id?: number;
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export class FeedbacksModel {
  /**
   * 创建反馈
   */
  static async create(feedbackData: CreateFeedbackDto): Promise<number> {
    const { user_id, content_id, type, message } = feedbackData;

    const sql = `
      INSERT INTO feedbacks (user_id, content_id, type, message)
      VALUES (?, ?, ?, ?)
    `;

    const result = await DatabaseService.execute(sql, [user_id, content_id, type, message]);
    return result.insertId;
  }

  /**
   * 根据 ID 查找反馈
   */
  static async findById(id: number): Promise<Feedback | null> {
    const sql = 'SELECT * FROM feedbacks WHERE id = ?';
    const feedbacks = await DatabaseService.query<Feedback[]>(sql, [id]);
    return feedbacks[0] || null;
  }

  /**
   * 根据查询条件获取反馈列表
   */
  static async findAll(options: FeedbackQueryOptions = {}): Promise<{
    feedbacks: Feedback[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      user_id,
      type,
      status,
      page = 1,
      limit = 10
    } = options;

    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: any[] = [];

    if (user_id) {
      conditions.push('user_id = ?');
      params.push(user_id);
    }

    if (type) {
      conditions.push('type = ?');
      params.push(type);
    }

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [feedbacks, totalResult] = await Promise.all([
      DatabaseService.query<Feedback[]>(
        `SELECT * FROM feedbacks ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      ),
      DatabaseService.query<RowDataPacket[]>(
        `SELECT COUNT(*) as total FROM feedbacks ${whereClause}`,
        params
      )
    ]);

    const total = totalResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      feedbacks,
      total,
      page,
      totalPages
    };
  }

  /**
   * 获取用户的反馈
   */
  static async findByUser(userId: number, page: number = 1, limit: number = 10): Promise<{
    feedbacks: Feedback[];
    total: number;
  }> {
    const result = await this.findAll({ user_id: userId, page, limit });
    return {
      feedbacks: result.feedbacks,
      total: result.total
    };
  }

  /**
   * 更新反馈状态
   */
  static async update(id: number, feedbackData: UpdateFeedbackDto): Promise<boolean> {
    const { status, admin_reply } = feedbackData;

    const updates: string[] = [];
    const params: any[] = [];

    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }

    if (admin_reply !== undefined) {
      updates.push('admin_reply = ?');
      params.push(admin_reply);
    }

    if (updates.length === 0) {
      return false;
    }

    params.push(id);
    const sql = `UPDATE feedbacks SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

    const result = await DatabaseService.execute(sql, params);
    return result.affectedRows > 0;
  }

  /**
   * 标记反馈为已解决
   */
  static async markResolved(id: number, adminReply?: string): Promise<boolean> {
    return await this.update(id, {
      status: 'resolved',
      admin_reply: adminReply
    });
  }

  /**
   * 获取反馈统计
   */
  static async getStats(): Promise<{
    total_feedbacks: number;
    pending_count: number;
    resolved_count: number;
    by_type: { [key: string]: number };
  }> {
    const [totalResult, statusResult, typeResult] = await Promise.all([
      DatabaseService.query<RowDataPacket[]>('SELECT COUNT(*) as total FROM feedbacks'),
      DatabaseService.query<RowDataPacket[]>(
        'SELECT status, COUNT(*) as count FROM feedbacks GROUP BY status'
      ),
      DatabaseService.query<RowDataPacket[]>(
        'SELECT type, COUNT(*) as count FROM feedbacks GROUP BY type'
      )
    ]);

    const statusCounts: { [key: string]: number } = {};
    statusResult.forEach(row => {
      statusCounts[row.status] = row.count;
    });

    const by_type: { [key: string]: number } = {};
    typeResult.forEach(row => {
      by_type[row.type] = row.count;
    });

    return {
      total_feedbacks: totalResult[0]?.total || 0,
      pending_count: statusCounts.pending || 0,
      resolved_count: statusCounts.resolved || 0,
      by_type
    };
  }
}