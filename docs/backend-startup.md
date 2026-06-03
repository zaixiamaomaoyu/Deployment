# 后端服务启动指南

## 前置条件

- **Node.js** >= 18
- **MySQL** >= 8.0
- **npm**

## 启动步骤

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置数据库

#### 2.1 创建数据库

登录 MySQL，执行：

```bash
mysql -u root -p
```

```sql
CREATE DATABASE IF NOT EXISTS deployment_learning
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

#### 2.2 配置环境变量

复制环境变量模板：

```bash
cp .env.example .env
```

编辑 `.env`，填写数据库密码：

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的密码
DB_NAME=deployment_learning
```

### 3. 初始化数据库表结构

执行建表及种子数据脚本：

```bash
mysql -u root -p --default-character-set=utf8mb4 < scripts/database-init.sql
mysql -u root -p --default-character-set=utf8mb4 < backend/scripts/seed-data.sql
```

### 4. 启动开发服务器

```bash
cd backend
npm run dev
```

服务启动后输出：

```
🚀 后端服务器运行在端口 3000
🌐 健康检查: http://localhost:3000/api/health
```

### 5. 验证服务

```bash
curl http://localhost:3000/api/health
curl "http://localhost:3000/api/contents?page=1&limit=20"
```

## 常见问题

### ts-node 类型声明未加载

若启动时报 `Property 'userId' does not exist on type 'SessionData'`，已通过在 `nodemon.json` 中为 `ts-node` 添加 `--files` 参数解决。

### 数据库连接被拒绝

- 确认 MySQL 服务已启动：`net start MySQL80`
- 确认 `.env` 中 `DB_PASSWORD` 正确

### 表不存在报错

请先执行数据库初始化脚本（步骤 3）。

## 可用脚本

| 脚本 | 说明 |
|---|---|
| `npm run dev` | 开发模式启动（热重载） |
| `npm run build` | 编译 TypeScript |
| `npm start` | 生产模式启动 |
| `npm run lint` | 代码检查 |
