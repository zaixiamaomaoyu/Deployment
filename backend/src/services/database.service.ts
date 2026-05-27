import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader, FieldPacket } from 'mysql2/promise';

/**
 * 数据库基础服务类
 * 提供通用的数据库操作方法
 */
export class DatabaseService {
  /**
   * 基础查询方法
   */
  static async query<T extends RowDataPacket[]>(
    sql: string,
    params?: any[]
  ): Promise<T> {
    try {
      const [rows] = await pool.execute<T>(sql, params);
      return rows;
    } catch (error) {
      console.error('❌ 数据库查询失败:', { sql, params, error });
      throw new Error(`数据库查询失败: ${error}`);
    }
  }

  /**
   * 基础执行方法（用于 INSERT, UPDATE, DELETE）
   */
  static async execute(sql: string, params?: any[]): Promise<ResultSetHeader> {
    try {
      const [result] = await pool.execute<ResultSetHeader>(sql, params);
      return result;
    } catch (error) {
      console.error('❌ 数据库执行失败:', { sql, params, error });
      throw new Error(`数据库执行失败: ${error}`);
    }
  }

  /**
   * 事务处理
   */
  static async transaction<T>(callback: (connection: any) => Promise<T>): Promise<T> {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      console.error('❌ 数据库事务失败:', error);
      throw new Error(`数据库事务失败: ${error}`);
    } finally {
      connection.release();
    }
  }

  /**
   * 批量插入
   */
  static async batchInsert(sql: string, values: any[][]): Promise<ResultSetHeader> {
    try {
      const [result] = await pool.query<ResultSetHeader>(sql, [values]);
      return result;
    } catch (error) {
      console.error('❌ 数据库批量插入失败:', { sql, values, error });
      throw new Error(`数据库批量插入失败: ${error}`);
    }
  }

  /**
   * 检查表是否存在
   */
  static async tableExists(tableName: string): Promise<boolean> {
    try {
      const [rows] = await pool.execute(
        'SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
        [tableName]
      );
      return Array.isArray(rows) && rows.length > 0;
    } catch (error) {
      console.error('❌ 检查表存在性失败:', { tableName, error });
      return false;
    }
  }

  /**
   * 获取表的行数
   */
  static async getTableRowCount(tableName: string): Promise<number> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM ??',
        [tableName]
      );
      return rows[0]?.count || 0;
    } catch (error) {
      console.error('❌ 获取表行数失败:', { tableName, error });
      return 0;
    }
  }

  /**
   * 验证数据库结构
   */
  static async validateDatabaseStructure(): Promise<{
    success: boolean;
    tables: string[];
    errors: string[];
  }> {
    const expectedTables = [
      'users',
      'contents',
      'user_progress',
      'feedbacks',
      'favorites',
      'decision_trees',
      'tree_nodes',
      'admin_audit_logs'
    ];

    const result: {
      success: boolean;
      tables: string[];
      errors: string[];
    } = {
      success: true,
      tables: [],
      errors: []
    };

    try {
      for (const tableName of expectedTables) {
        const exists = await this.tableExists(tableName);
        if (exists) {
          result.tables.push(tableName);
          console.log(`✅ 表 ${tableName} 存在`);
        } else {
          result.errors.push(`表 ${tableName} 不存在`);
          result.success = false;
        }
      }

      return result;
    } catch (error) {
      console.error('❌ 数据库结构验证失败:', error);
      result.errors.push(`验证过程出错: ${error}`);
      result.success = false;
      return result;
    }
  }
}