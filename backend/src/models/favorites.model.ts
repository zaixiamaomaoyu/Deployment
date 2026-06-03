import { DatabaseService } from '../services/database.service';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export interface Favorite extends RowDataPacket {
  id: number;
  user_id: number;
  content_id: number;
  created_at: Date;
}

/**
 * 收藏列表项（JOIN contents 后的扁平结构）
 * - id / domain / level / title / description / created_at / updated_at 来自 contents
 * - favorite_id / favorited_at 来自 favorites
 */
export interface FavoriteWithContent extends RowDataPacket {
  id: number;
  domain: string;
  level: number;
  title: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
  favorite_id: number;
  favorited_at: Date;
}

export class FavoritesModel {
  /**
   * 添加收藏
   */
  static async add(userId: number, contentId: number): Promise<boolean> {
    try {
      const sql = `
        INSERT INTO favorites (user_id, content_id)
        VALUES (?, ?)
      `;

      await DatabaseService.execute(sql, [userId, contentId]);
      return true;
    } catch (error) {
      // 如果已存在，返回 false
      if (error instanceof Error && error.message.includes('Duplicate entry')) {
        return false;
      }
      throw error;
    }
  }

  /**
   * 取消收藏
   */
  static async remove(userId: number, contentId: number): Promise<boolean> {
    const sql = 'DELETE FROM favorites WHERE user_id = ? AND content_id = ?';
    const result = await DatabaseService.execute(sql, [userId, contentId]);
    return result.affectedRows > 0;
  }

  /**
   * 检查是否已收藏
   */
  static async isFavorited(userId: number, contentId: number): Promise<boolean> {
    const sql = 'SELECT COUNT(*) as count FROM favorites WHERE user_id = ? AND content_id = ?';
    const result = await DatabaseService.query<RowDataPacket[]>(sql, [userId, contentId]);
    return (result[0]?.count || 0) > 0;
  }

  /**
   * 获取用户的收藏列表（含内容详情）
   * JOIN contents 表，显式列出列名以避免列名冲突（c.id 与 f.id 重名）
   */
  static async findByUser(userId: number, page: number = 1, limit: number = 10): Promise<{
    favorites: FavoriteWithContent[];
    total: number;
  }> {
    const offset = (page - 1) * limit;

    const [favorites, totalResult] = await Promise.all([
      DatabaseService.query<FavoriteWithContent[]>(
        `SELECT
           c.id, c.domain, c.level, c.title, c.description,
           c.created_at, c.updated_at,
           f.id AS favorite_id, f.created_at AS favorited_at
         FROM favorites f
         INNER JOIN contents c ON c.id = f.content_id
         WHERE f.user_id = ?
         ORDER BY f.created_at DESC
         LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      ),
      DatabaseService.query<RowDataPacket[]>(
        'SELECT COUNT(*) as total FROM favorites WHERE user_id = ?',
        [userId]
      )
    ]);

    return {
      favorites,
      total: totalResult[0]?.total || 0
    };
  }

  /**
   * 切换收藏状态
   */
  static async toggle(userId: number, contentId: number): Promise<{
    action: 'added' | 'removed';
    isFavorited: boolean;
  }> {
    const isCurrentlyFavorited = await this.isFavorited(userId, contentId);

    if (isCurrentlyFavorited) {
      await this.remove(userId, contentId);
      return {
        action: 'removed',
        isFavorited: false
      };
    } else {
      await this.add(userId, contentId);
      return {
        action: 'added',
        isFavorited: true
      };
    }
  }

  /**
   * 获取收藏统计
   */
  static async getStats(): Promise<{
    total_favorites: number;
    user_favorite_counts: { user_id: number; count: number }[];
  }> {
    const [totalResult, userCountsResult] = await Promise.all([
      DatabaseService.query<RowDataPacket[]>('SELECT COUNT(*) as total FROM favorites'),
      DatabaseService.query<RowDataPacket[]>(
        'SELECT user_id, COUNT(*) as count FROM favorites GROUP BY user_id ORDER BY count DESC LIMIT 10'
      )
    ]);

    const user_favorite_counts = userCountsResult.map(row => ({
      user_id: row.user_id,
      count: row.count
    }));

    return {
      total_favorites: totalResult[0]?.total || 0,
      user_favorite_counts
    };
  }
}