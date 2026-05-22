import { DatabaseService } from '../services/database.service';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export interface User extends RowDataPacket {
  id: number;
  openid: string;
  role: 'user' | 'admin';
  nickname?: string;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserDto {
  openid: string;
  role?: 'user' | 'admin';
  nickname?: string;
  avatar_url?: string;
}

export interface UpdateUserDto {
  role?: 'user' | 'admin';
  nickname?: string;
  avatar_url?: string;
}

export class UsersModel {
  /**
   * 创建用户
   */
  static async create(userData: CreateUserDto): Promise<number> {
    const { openid, role = 'user', nickname, avatar_url } = userData;

    const sql = `
      INSERT INTO users (openid, role, nickname, avatar_url)
      VALUES (?, ?, ?, ?)
    `;

    const result = await DatabaseService.execute(sql, [openid, role, nickname, avatar_url]);
    return result.insertId;
  }

  /**
   * 根据 OpenID 查找用户
   */
  static async findByOpenId(openid: string): Promise<User | null> {
    const sql = 'SELECT * FROM users WHERE openid = ?';
    const users = await DatabaseService.query<User[]>(sql, [openid]);
    return users[0] || null;
  }

  /**
   * 根据 ID 查找用户
   */
  static async findById(id: number): Promise<User | null> {
    const sql = 'SELECT * FROM users WHERE id = ?';
    const users = await DatabaseService.query<User[]>(sql, [id]);
    return users[0] || null;
  }

  /**
   * 更新用户信息
   */
  static async update(id: number, userData: UpdateUserDto): Promise<boolean> {
    const { role, nickname, avatar_url } = userData;

    const updates: string[] = [];
    const params: any[] = [];

    if (role !== undefined) {
      updates.push('role = ?');
      params.push(role);
    }
    if (nickname !== undefined) {
      updates.push('nickname = ?');
      params.push(nickname);
    }
    if (avatar_url !== undefined) {
      updates.push('avatar_url = ?');
      params.push(avatar_url);
    }

    if (updates.length === 0) {
      return false;
    }

    params.push(id);
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

    const result = await DatabaseService.execute(sql, params);
    return result.affectedRows > 0;
  }

  /**
   * 删除用户
   */
  static async delete(id: number): Promise<boolean> {
    const sql = 'DELETE FROM users WHERE id = ?';
    const result = await DatabaseService.execute(sql, [id]);
    return result.affectedRows > 0;
  }

  /**
   * 获取用户列表（管理员用）
   */
  static async findAll(page: number = 1, limit: number = 10): Promise<{
    users: User[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;

    const [users, totalResult] = await Promise.all([
      DatabaseService.query<User[]>(
        'SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
      ),
      DatabaseService.query<RowDataPacket[]>('SELECT COUNT(*) as total FROM users')
    ]);

    const total = totalResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      users,
      total,
      page,
      totalPages
    };
  }

  /**
   * 检查用户是否为管理员
   */
  static async isAdmin(userId: number): Promise<boolean> {
    const user = await this.findById(userId);
    return user?.role === 'admin';
  }

  /**
   * 获取用户统计信息
   */
  static async getStats(): Promise<{
    total_users: number;
    admin_users: number;
    regular_users: number;
    new_users_today: number;
  }> {
    const sql = `
      SELECT
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_users,
        SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as regular_users,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as new_users_today
      FROM users
    `;

    const result = await DatabaseService.query<RowDataPacket[]>(sql);
    return result[0] as any;
  }
}