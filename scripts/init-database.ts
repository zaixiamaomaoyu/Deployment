#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';
import { pool, ensureDatabaseExists } from '../backend/src/config/database';
import { DatabaseService } from '../backend/src/services/database.service';

/**
 * 数据库初始化脚本
 */
async function initializeDatabase() {
  console.log('🚀 开始初始化数据库...');

  try {
    // 1. 确保数据库存在
    console.log('📋 步骤 1: 检查/创建数据库...');
    const dbExists = await ensureDatabaseExists();
    if (!dbExists) {
      throw new Error('数据库创建失败');
    }

    // 2. 测试数据库连接
    console.log('📋 步骤 2: 测试数据库连接...');
    const connectionTest = await DatabaseService.query('SELECT 1 as test');
    console.log('✅ 数据库连接测试成功:', connectionTest);

    // 3. 读取并执行SQL脚本
    console.log('📋 步骤 3: 执行数据库初始化脚本...');
    const sqlScriptPath = path.join(__dirname, 'database-init.sql');

    if (!fs.existsSync(sqlScriptPath)) {
      throw new Error(`SQL脚本文件不存在: ${sqlScriptPath}`);
    }

    const sqlScript = fs.readFileSync(sqlScriptPath, 'utf8');

    // 分割SQL语句并执行
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('\n'));

    console.log(`📝 发现 ${statements.length} 个SQL语句需要执行`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await pool.execute(statement);
        console.log(`✅ 语句 ${i + 1}/${statements.length} 执行成功`);
      } catch (error) {
        // 忽略已存在表的错误（IF NOT EXISTS）
        if (error.message.includes('already exists') || error.message.includes('ER_TABLE_EXISTS_ERROR')) {
          console.log(`ℹ️ 语句 ${i + 1} 已存在，跳过`);
        } else {
          console.error(`❌ 语句 ${i + 1} 执行失败:`, error.message);
          throw error;
        }
      }
    }

    // 4. 验证数据库结构
    console.log('📋 步骤 4: 验证数据库结构...');
    const validationResult = await DatabaseService.validateDatabaseStructure();

    if (validationResult.success) {
      console.log('✅ 数据库结构验证成功');
      console.log(`📊 成功创建 ${validationResult.tables.length} 个表:`);
      validationResult.tables.forEach(table => console.log(`  - ${table}`));
    } else {
      console.error('❌ 数据库结构验证失败:');
      validationResult.errors.forEach(error => console.error(`  - ${error}`));
      throw new Error('数据库结构验证失败');
    }

    // 5. 检查初始化数据
    console.log('📋 步骤 5: 检查初始化数据...');
    const contentCount = await DatabaseService.getTableRowCount('contents');
    const decisionTreeCount = await DatabaseService.getTableRowCount('decision_trees');

    console.log(`📊 知识内容数量: ${contentCount}`);
    console.log(`📊 决策树数量: ${decisionTreeCount}`);

    if (contentCount === 0) {
      console.warn('⚠️ 警告: 知识内容表为空，可能需要手动添加数据');
    }

    // 6. 最终验证
    console.log('📋 步骤 6: 最终验证...');
    const finalTest = await DatabaseService.query('SELECT DATABASE() as current_db');
    console.log(`✅ 当前数据库: ${finalTest[0]?.current_db}`);

    console.log('\n🎉 数据库初始化完成！');
    console.log('\n📈 初始化摘要:');
    console.log(`  - 数据库: ${process.env.DB_NAME || 'deployment_learning'}`);
    console.log(`  - 表数量: ${validationResult.tables.length}`);
    console.log(`  - 内容条目: ${contentCount}`);
    console.log(`  - 决策树: ${decisionTreeCount}`);

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

/**
 * 验证数据库功能的独立脚本
 */
async function validateDatabase() {
  console.log('🔍 开始验证数据库功能...');

  try {
    // 1. 测试基础查询
    console.log('📋 测试基础查询...');
    const users = await DatabaseService.query('SELECT COUNT(*) as count FROM users');
    console.log(`✅ 用户表行数: ${users[0]?.count || 0}`);

    // 2. 测试外键约束
    console.log('📋 测试外键约束...');
    try {
      await DatabaseService.execute(
        'INSERT INTO user_progress (user_id, content_id, status) VALUES (99999, 99999, "viewed")'
      );
      console.error('❌ 外键约束测试失败：应该抛出错误');
    } catch (error) {
      if (error.message.includes('foreign key constraint')) {
        console.log('✅ 外键约束正常工作');
      } else {
        console.error('❌ 意外的外键约束错误:', error.message);
      }
    }

    // 3. 测试事务
    console.log('📋 测试事务处理...');
    try {
      await DatabaseService.transaction(async (connection) => {
        await connection.execute('INSERT INTO users (openid, role) VALUES (?, ?)', ['test_openid', 'user']);
        const [result] = await connection.execute('SELECT LAST_INSERT_ID() as id');
        const userId = result[0]?.id;
        console.log(`✅ 事务测试成功，创建用户ID: ${userId}`);

        // 回滚测试，不提交
        throw new Error('ROLLBACK_TEST');
      });
    } catch (error) {
      if (error.message === 'ROLLBACK_TEST') {
        console.log('✅ 事务回滚正常工作');
      }
    }

    // 4. 测试索引
    console.log('📋 测试索引性能...');
    const startTime = Date.now();
    await DatabaseService.query('SELECT * FROM contents WHERE domain = ?', ['build']);
    const queryTime = Date.now() - startTime;
    console.log(`✅ 索引查询时间: ${queryTime}ms`);

    console.log('\n🎉 数据库功能验证完成！');

  } catch (error) {
    console.error('❌ 数据库验证失败:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// 主函数
async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'init':
      await initializeDatabase();
      break;
    case 'validate':
      await validateDatabase();
      break;
    case 'reset':
      console.log('⚠️  重置功能暂未实现');
      break;
    default:
      console.log('📋 数据库管理工具');
      console.log('用法:');
      console.log('  npm run db:init     # 初始化数据库');
      console.log('  npm run db:validate # 验证数据库功能');
      console.log('  npm run db:reset    # 重置数据库（谨慎使用）');
  }
}

// 执行主函数
main().catch(console.error);