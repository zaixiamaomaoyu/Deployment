/**
 * 数据库初始化脚本
 * 用法: npx ts-node scripts/init-database.ts
 */
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { dbConfig, pool, ensureDatabaseExists, closePool } from '../src/config/database';

// 提前加载 .env，确保数据库连接配置生效
dotenv.config();

/**
 * 检查必要的环境变量
 */
function checkEnv(): boolean {
  if (!process.env.DB_PASSWORD) {
    console.error('❌ 未检测到 DB_PASSWORD 环境变量。');
    console.error('   请在 backend/.env 文件中配置数据库连接信息。');
    console.error('   可参考 backend/.env.example 创建。');
    return false;
  }
  return true;
}

/**
 * 读取并执行 SQL 脚本
 */
async function executeSqlScript(connection: mysql.PoolConnection, scriptPath: string): Promise<void> {
  const sqlScript = fs.readFileSync(scriptPath, 'utf8');

  // 按分号分割语句，同时忽略注释和空行
  const statements = sqlScript
    .split(';')
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));

  console.log(`📄 读取到 ${statements.length} 条 SQL 语句`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    try {
      await connection.query(statement);
    } catch (error) {
      // SET 语句和 DROP IF EXISTS 允许失败
      const isSetOrDrop = /^SET|^DROP TABLE IF EXISTS/i.test(statement);
      if (!isSetOrDrop) {
        console.error(`❌ 执行第 ${i + 1} 条语句失败:`);
        console.error(statement.substring(0, 200));
        throw error;
      }
    }
  }
}

/**
 * 验证表是否创建成功
 */
async function verifyTables(connection: mysql.PoolConnection): Promise<string[]> {
  const [rows] = await connection.execute(
    `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?`,
    [dbConfig.database]
  );

  const tables = (rows as mysql.RowDataPacket[]).map((r) => r.TABLE_NAME as string);
  return tables;
}

/**
 * 主初始化流程
 */
async function initializeDatabase(): Promise<void> {
  console.log('🚀 开始初始化数据库...\n');

  if (!checkEnv()) {
    process.exit(1);
  }

  // 步骤 1: 确保数据库存在
  console.log('📦 步骤 1: 检查/创建数据库...');
  const dbExists = await ensureDatabaseExists();
  if (!dbExists) {
    console.error('❌ 数据库创建失败，终止初始化');
    process.exit(1);
  }
  console.log('');

  // 步骤 2: 执行 SQL 脚本
  console.log('📦 步骤 2: 执行表结构初始化脚本...');
  const scriptPath = path.join(__dirname, 'database-init.sql');

  if (!fs.existsSync(scriptPath)) {
    console.error(`❌ SQL 脚本不存在: ${scriptPath}`);
    process.exit(1);
  }

  const connection = await pool.getConnection();
  try {
    await executeSqlScript(connection, scriptPath);
    console.log('✅ 表结构初始化完成\n');

    // 步骤 3: 验证表创建结果
    console.log('📦 步骤 3: 验证表结构...');
    const tables = await verifyTables(connection);

    const expectedTables = [
      'users',
      'contents',
      'decision_trees',
      'tree_nodes',
      'user_progress',
      'feedbacks',
      'favorites',
      'admin_audit_logs',
    ];

    console.log(`   数据库中现有 ${tables.length} 张表:`);
    tables.forEach((t) => console.log(`   - ${t}`));

    const missing = expectedTables.filter((t) => !tables.includes(t));
    if (missing.length > 0) {
      console.error(`\n⚠️ 缺少以下表: ${missing.join(', ')}`);
    } else {
      console.log('\n✅ 所有预期表均已创建');
    }
  } finally {
    connection.release();
  }

  console.log('\n🎉 数据库初始化完成!');
}

// 执行初始化
initializeDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ 数据库初始化失败:', error);
    process.exit(1);
  })
  .finally(async () => {
    await closePool();
  });
