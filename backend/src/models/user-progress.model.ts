import { DatabaseService } from '../services/database.service';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export interface UserProgress extends RowDataPacket {
  id: number;
  user_id: number;
  content_id: number;
  status: 'viewed' | 'learning' | 'completed';
  progress_percent: number;
  last_accessed_at: Date;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserProgressDto {
  user_id: number;
  content_id: number;
  status?: 'viewed' | 'learning' | 'completed';
  progress_percent?: number;
}

export interface UpdateUserProgressDto {
  status?: 'viewed' | 'learning' | 'completed';
  progress_percent?: number;
}

export class UserProgressModel {
  /**
   * 创建或更新学习进度
   */
  static async upsert(
    userId: number,
    contentId: number,
    progressData: UpdateUserProgressDto
  ): Promise<boolean> {
    const { status, progress_percent } = progressData;

    // 检查记录是否存在
    const existing = await this.findByUserAndContent(userId, contentId);

    if (existing) {
      return await this.update(existing.id, progressData);
    } else {
      const createData: CreateUserProgressDto = {
        user_id: userId,
        content_id: contentId,
        status: status || 'viewed',
        progress_percent: progress_percent || 0
      };
      await this.create(createData);
      return true;
    }
  }

  /**
   * 创建学习进度
   */
  static async create(progressData: CreateUserProgressDto): Promise<number> {
    const { user_id, content_id, status = 'viewed', progress_percent = 0 } = progressData;

    const sql = `
      INSERT INTO user_progress (user_id, content_id, status, progress_percent)
      VALUES (?, ?, ?, ?)
    `;

    const result = await DatabaseService.execute(sql, [user_id, content_id, status, progress_percent]);
    return result.insertId;
  }

  /**
   * 根据用户ID和内容ID查找进度
   */
  static async findByUserAndContent(userId: number, contentId: number): Promise<UserProgress | null> {
    const sql = 'SELECT * FROM user_progress WHERE user_id = ? AND content_id = ?';
    const progresses = await DatabaseService.query<UserProgress[]>(sql, [userId, contentId]);
    return progresses[0] || null;
  }

  /**
   * 获取用户的所有学习进度
   */
  static async findByUser(userId: number): Promise<UserProgress[]> {
    const sql = 'SELECT * FROM user_progress WHERE user_id = ? ORDER BY updated_at DESC';
    return await DatabaseService.query<UserProgress[]>(sql, [userId]);
  }

  /**
   * 获取用户特定状态的学习进度
   */
  static async findByUserAndStatus(
    userId: number,
    status: 'viewed' | 'learning' | 'completed'
  ): Promise<UserProgress[]> {
    const sql = 'SELECT * FROM user_progress WHERE user_id = ? AND status = ? ORDER BY updated_at DESC';
    return await DatabaseService.query<UserProgress[]>(sql, [userId, status]);
  }

  /**
   * 更新学习进度
   */
  static async update(id: number, progressData: UpdateUserProgressDto): Promise<boolean> {
    const { status, progress_percent } = progressData;

    const updates: string[] = [];
    const params: any[] = [];

    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);

      // 如果状态改为 completed，设置完成时间
      if (status === 'completed') {
        updates.push('completed_at = CURRENT_TIMESTAMP');
      }
    }

    if (progress_percent !== undefined) {
      updates.push('progress_percent = ?');
      params.push(progress_percent);
    }

    // 更新最后访问时间
    updates.push('last_accessed_at = CURRENT_TIMESTAMP');

    if (updates.length === 0) {
      return false;
    }

    params.push(id);
    const sql = `UPDATE user_progress SET ${updates.join(', ')} WHERE id = ?`;

    const result = await DatabaseService.execute(sql, params);
    return result.affectedRows > 0;
  }

  /**
   * 标记内容为已完成
   */
  static async markCompleted(userId: number, contentId: number): Promise<boolean> {
    return await this.upsert(userId, contentId, {
      status: 'completed',
      progress_percent: 100
    });
  }

  /**
   * 获取用户学习统计
   */
  static async getUserStats(userId: number): Promise<{
    total_viewed: number;
    total_learning: number;
    total_completed: number;
    completion_rate: number;
  }> {
    const sql = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'viewed' THEN 1 ELSE 0 END) as total_viewed,
        SUM(CASE WHEN status = 'learning' THEN 1 ELSE 0 END) as total_learning,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as total_completed
      FROM user_progress
      WHERE user_id = ?
    `;

    const result = await DatabaseService.query<RowDataPacket[]>(sql, [userId]);
    const stats = result[0];

    const total = stats.total || 0;
    const total_completed = stats.total_completed || 0;
    const completion_rate = total > 0 ? Math.round((total_completed / total) * 100) : 0;

    return {
      total_viewed: stats.total_viewed || 0,
      total_learning: stats.total_learning || 0,
      total_completed,
      completion_rate
    };
  }

  /**
   * 获取内容的学习统计
   */
  static async getContentStats(contentId: number): Promise<{
    total_users: number;
    completion_rate: number;
    average_progress: number;
  }> {
    const sql = `
      SELECT
        COUNT(*) as total_users,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_users,
        AVG(progress_percent) as average_progress
      FROM user_progress
      WHERE content_id = ?
    `;

    const result = await DatabaseService.query<RowDataPacket[]>(sql, [contentId]);
    const stats = result[0];

    const total_users = stats.total_users || 0;
    const completed_users = stats.completed_users || 0;
    const completion_rate = total_users > 0 ? Math.round((completed_users / total_users) * 100) : 0;

    return {
      total_users,
      completion_rate,
      average_progress: Math.round(stats.average_progress || 0)
    };
  }
}