import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 数据库连接池配置
 */
export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'deployment_learning',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000
};

/**
 * 创建数据库连接池
 */
export const pool = mysql.createPool(dbConfig);

/**
 * 数据库连接测试
 */
export async function testConnection(): Promise<boolean> {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.ping();
    console.log('✅ 数据库连接测试成功');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接测试失败:', error);
    return false;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

/**
 * 获取数据库连接
 */
export async function getConnection() {
  return await pool.getConnection();
}

/**
 * 关闭连接池
 */
export async function closePool() {
  await pool.end();
}

/**
 * 检查数据库是否存在，如果不存在则创建
 */
export async function ensureDatabaseExists(): Promise<boolean> {
  let connection;
  try {
    // 创建临时连接（不指定数据库）
    const tempPool = mysql.createPool({
      ...dbConfig,
      database: undefined // 不指定数据库
    });

    connection = await tempPool.getConnection();

    // 检查数据库是否存在
    const [rows] = await connection.execute(
      'SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?',
      [dbConfig.database]
    );

    if (Array.isArray(rows) && rows.length === 0) {
      // 数据库不存在，创建数据库
      await connection.execute(
        `CREATE DATABASE ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
      console.log(`✅ 数据库 ${dbConfig.database} 创建成功`);
    } else {
      console.log(`✅ 数据库 ${dbConfig.database} 已存在`);
    }

    await tempPool.end();
    return true;
  } catch (error) {
    console.error('❌ 数据库检查/创建失败:', error);
    return false;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}