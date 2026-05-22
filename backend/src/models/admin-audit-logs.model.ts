import { DatabaseService } from '../services/database.service';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export interface AdminAuditLog extends RowDataPacket {
  id: number;
  admin_id: number;
  action: string;
  target_type: string;
  target_id?: number;
  details?: any;
  ip_address?: string;
  created_at: Date;
}

export interface CreateAdminAuditLogDto {
  admin_id: number;
  action: string;
  target_type: string;
  target_id?: number;
  details?: any;
  ip_address?: string;
}

export class AdminAuditLogsModel {
  /**
   * 创建审计日志
   */
  static async create(logData: CreateAdminAuditLogDto): Promise<number> {
    const { admin_id, action, target_type, target_id, details, ip_address } = logData;

    const sql = `
      INSERT INTO admin_audit_logs
      (admin_id, action, target_type, target_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = await DatabaseService.execute(sql, [
      admin_id, action, target_type, target_id,
      JSON.stringify(details), ip_address
    ]);

    return result.insertId;
  }

  /**
   * 获取管理员的审计日志
   */
  static async findByAdmin(adminId: number, page: number = 1, limit: number = 10): Promise<{
    logs: AdminAuditLog[];
    total: number;
  }> {
    const offset = (page - 1) * limit;

    const [logs, totalResult] = await Promise.all([
      DatabaseService.query<AdminAuditLog[]>(
        'SELECT * FROM admin_audit_logs WHERE admin_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [adminId, limit, offset]
      ),
      DatabaseService.query<RowDataPacket[]>(
        'SELECT COUNT(*) as total FROM admin_audit_logs WHERE admin_id = ?',
        [adminId]
      )
    ]);

    // 解析 JSON 字段
    logs.forEach(log => {
      if (log.details) log.details = JSON.parse(log.details);
    });

    return {
      logs,
      total: totalResult[0]?.total || 0
    };
  }

  /**
   * 获取最近的审计日志
   */
  static async findRecent(limit: number = 50): Promise<AdminAuditLog[]> {
    const sql = 'SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT ?';
    const logs = await DatabaseService.query<AdminAuditLog[]>(sql, [limit]);

    // 解析 JSON 字段
    logs.forEach(log => {
      if (log.details) log.details = JSON.parse(log.details);
    });

    return logs;
  }

  /**
   * 按操作类型获取日志
   */
  static async findByAction(action: string, page: number = 1, limit: number = 10): Promise<{
    logs: AdminAuditLog[];
    total: number;
  }> {
    const offset = (page - 1) * limit;

    const [logs, totalResult] = await Promise.all([
      DatabaseService.query<AdminAuditLog[]>(
        'SELECT * FROM admin_audit_logs WHERE action = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [action, limit, offset]
      ),
      DatabaseService.query<RowDataPacket[]>(
        'SELECT COUNT(*) as total FROM admin_audit_logs WHERE action = ?',
        [action]
      )
    ]);

    // 解析 JSON 字段
    logs.forEach(log => {
      if (log.details) log.details = JSON.parse(log.details);
    });

    return {
      logs,
      total: totalResult[0]?.total || 0
    };
  }
}