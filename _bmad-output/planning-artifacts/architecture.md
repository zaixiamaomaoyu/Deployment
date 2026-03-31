---
stepsCompleted: [1, 2, 3]
inputDocuments: ['_bmad-output/planning-artifacts/prd.md']
workflowType: 'architecture'
project_name: 'Deployment'
user_name: 'maomaoyu'
date: '2026-03-25'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

| 模块 | 需求 | 架构影响 |
|-----|------|---------|
| 用户认证与管理 | FR1-FR5 | 微信 OAuth 集成、Session 管理、角色权限系统 |
| 知识内容浏览 | FR6-FR10 | 内容存储方案、搜索索引、收藏功能 |
| 部署决策树 | FR11-FR14 | 前端状态机、决策逻辑、步骤指南组件 |
| AI 助手 | FR15-FR19 | SSE/WebSocket 实时通信、AI 服务集成 |
| 速查手册 | FR20-FR22 | 静态内容管理、模板存储 |
| 免费方案避坑指南 | FR23-FR24 | 内容模块化存储 |
| 管理员后台 | FR25-FR29 | 后台管理界面、权限控制、数据统计 |
| 用户反馈 | FR30-FR31 | 反馈存储、状态追踪 |

**Non-Functional Requirements:**

| 类别 | 指标 | 架构决策影响 |
|-----|------|-------------|
| 性能 | 首屏 < 3s | Vite 构建、代码分割、CDN 部署 |
| 性能 | API < 500ms | 后端优化、缓存策略 |
| 性能 | AI 首字节 < 3s | 流式响应必需 |
| 并发 | 100+ 用户 | 后端无状态设计、负载均衡准备 |
| 安全 | HTTPS + Session | 安全传输、Session 存储方案 |
| 可扩展 | 10x 用户增长 | 水平扩展架构设计 |

**Scale & Complexity:**

- Primary domain: 全栈 Web 应用
- Complexity level: 中等
- Estimated architectural components: 前端应用 + API 服务 + AI 集成 + 管理后台

### Technical Constraints & Dependencies

| 约束类型 | 内容 |
|---------|------|
| 技术栈锁定 | 前端：Vue 3 + Element Plus + Pinia + Vue Router + Vite |
| 认证依赖 | 微信开放平台（需申请 AppID/AppSecret） |
| AI 服务依赖 | 需选择支持流式输出的 AI 服务提供商 |
| 浏览器支持 | 现代浏览器最新两个版本 |

### Cross-Cutting Concerns Identified

1. **认证授权** — 贯穿所有 API 端点，需要统一的中间件
2. **实时通信** — AI 助手流式输出，需要 SSE/WebSocket 基础设施
3. **内容管理** — 知识内容、速查手册、避坑指南共享存储模式
4. **错误处理** — 前后端统一的错误处理机制
5. **日志监控** — 用户行为追踪、AI 使用统计

## Starter Template Evaluation

### Primary Technology Domain

**全栈 Web 应用** — Vue 3 前端 + Node.js/Express 后端

### Starter Options Considered

| 方案 | 优点 | 缺点 |
|-----|------|------|
| Vite 官方模板 | 轻量、官方维护、TypeScript 原生支持 | 需手动添加 UI 库和状态管理 |
| Express 手动搭建 | 灵活、完全控制结构 | 无预设架构，需自行组织 |
| NestJS | 企业级、结构化 | 学习曲线陡，对中等项目可能过重 |

### Selected Starters

#### 前端：Vite + Vue 3 + TypeScript

**Rationale for Selection:**
- 官方推荐，社区活跃
- TypeScript 原生支持，类型安全
- Vite 极速 HMR，开发体验优秀
- 生产构建优化（Rollup）

**Initialization Command:**

```bash
npm create vite@latest frontend -- --template vue-ts
cd frontend
npm install element-plus pinia vue-router axios
```

**Additional Setup:**

```bash
# Element Plus 自动导入
npm install -D unplugin-vue-components unplugin-auto-import
```

**Architectural Decisions Provided:**

| 项目 | 决策 |
|-----|------|
| 语言 | TypeScript 5.x |
| 构建工具 | Vite 5.x |
| UI 组件库 | Element Plus（手动添加） |
| 状态管理 | Pinia（手动添加） |
| 路由 | Vue Router 4（手动添加） |
| HTTP 客户端 | Axios（手动添加） |

#### 后端：Express + TypeScript（手动搭建）

**Rationale for Selection:**
- 轻量灵活，适合中等复杂度项目
- 完全控制项目结构
- 学习曲线平缓

**Initialization Commands:**

```bash
mkdir backend && cd backend
npm init -y

# 核心依赖
npm install express cors dotenv mysql2 @anthropic-ai/sdk express-session

# 开发依赖
npm install -D typescript @types/node @types/express @types/cors ts-node nodemon

# 初始化 TypeScript
npx tsc --init
```

**Project Structure:**

```
backend/
├── src/
│   ├── config/          # 配置（数据库、Session、AI）
│   ├── controllers/     # 控制器（请求处理）
│   ├── middlewares/     # 中间件（认证、错误处理、SSE）
│   ├── routes/          # 路由定义
│   ├── services/        # 业务逻辑（AI 服务、内容服务）
│   ├── models/          # 数据模型
│   ├── types/           # TypeScript 类型定义
│   ├── utils/           # 工具函数
│   └── app.ts           # 应用入口
├── package.json
└── tsconfig.json
```

### AI Integration: Claude API

**SDK:** `@anthropic-ai/sdk`

**流式响应实现：** SSE (Server-Sent Events)

```typescript
// AI 服务示例
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

export async function* streamChat(message: string) {
  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [{ role: 'user', content: message }],
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta') {
      yield event.delta.text;
    }
  }
}
```

### Database: MySQL + mysql2

**Driver:** `mysql2` (支持 Promise API 和连接池)

**Connection Pool Configuration:**

```typescript
import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
```

### Environment Configuration

**Backend `.env`:**
```
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=deployment_learning

# WeChat OAuth
WECHAT_APP_ID=
WECHAT_APP_SECRET=

# Claude API
ANTHROPIC_API_KEY=

# Session
SESSION_SECRET=your-session-secret
```

**Note:** 项目初始化应作为第一个实现故事，包含：
1. 前端项目初始化 + 依赖安装
2. 后端项目初始化 + TypeScript 配置
3. 数据库创建 + 基础表结构
4. 环境变量配置
