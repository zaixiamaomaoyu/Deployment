---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  ['_bmad-output/planning-artifacts/prd.md', '_bmad-output/planning-artifacts/architecture.md', '_bmad-output/planning-artifacts/ux-design-specification.md']
workflowType: 'epics-and-stories'
project_name: 'Deployment'
user_name: 'maomaoyu'
date: '2026-03-31'
status: 'complete'
---

# Deployment - Epic Breakdown

## Overview

本文档提供 Deployment 项目的完整 Epic 和 Story 分解，将 PRD、UX 设计和架构文档中的需求转化为可实现的开发任务。

## Requirements Inventory

### Functional Requirements

**用户认证与管理**
- FR1: 用户可以通过微信扫码登录系统
- FR2: 用户可以查看自己的登录状态
- FR3: 用户可以退出登录
- FR4: 系统可以区分普通用户和管理员角色
- FR5: 用户可以保存和恢复学习进度

**知识内容浏览**
- FR6: 用户可以浏览 6 大领域的知识内容（构建、平台、服务器、自动化、域名、容器）
- FR7: 用户可以按领域和层级筛选内容
- FR8: 用户可以搜索知识内容
- FR9: 用户可以查看内容的详细说明和示例
- FR10: 用户可以收藏感兴趣的内容

**部署决策树**
- FR11: 用户可以通过问答式决策树选择部署方案
- FR12: 系统根据用户回答推荐合适的部署方式
- FR13: 用户可以查看推荐方案的详细步骤指南
- FR14: 用户可以重新开始决策流程

**AI 助手**
- FR15: 用户可以向 AI 助手提问部署相关问题
- FR16: AI 助手可以解释部署相关术语和概念
- FR17: AI 助手可以回答用户遇到的常见问题
- FR18: AI 助手可以进行简单的问题诊断
- FR19: AI 助手回复支持流式输出

**速查手册**
- FR20: 用户可以查看概念卡片
- FR21: 用户可以查看常用命令速查表
- FR22: 用户可以查看配置模板

**免费方案避坑指南**
- FR23: 用户可以浏览各免费平台的注意事项
- FR24: 用户可以查看免费方案的常见限制和风险

**管理员后台**
- FR25: 管理员可以登录后台管理系统
- FR26: 管理员可以创建、编辑、删除知识内容
- FR27: 管理员可以查看用户反馈
- FR28: 管理员可以查看基础统计数据
- FR29: 管理员可以管理用户角色

**用户反馈**
- FR30: 用户可以提交内容反馈
- FR31: 用户可以查看自己提交的反馈状态

### Non-Functional Requirements

**性能**
- NFR1: 首屏加载 < 3 秒
- NFR2: API 响应 < 500ms
- NFR3: AI 首字节 < 3 秒，流式输出
- NFR4: 支持 100+ 并发用户

**安全**
- NFR5: 全站 HTTPS
- NFR6: Session 安全存储
- NFR7: 仅存储微信 OpenID
- NFR8: XSS 防护

**可扩展性**
- NFR9: 支持 10x 用户增长
- NFR10: 支持 1000+ 知识条目

### Additional Requirements (Architecture)

- AR1: 前端项目初始化（Vite + Vue 3 + TypeScript）
- AR2: 后端项目初始化（Express + TypeScript）
- AR3: 数据库创建 + 基础表结构
- AR4: 环境变量配置

### UX Design Requirements

- UX-DR1: DecisionTree 决策树组件
- UX-DR2: AIChat 对话组件
- UX-DR3: ContentCard 知识卡片组件
- UX-DR4: CodeBlock 代码块组件
- UX-DR5: QuickReference 速查组件
- UX-DR6: 响应式布局适配

### FR Coverage Map

| Epic | 覆盖的 FR |
|-----|----------|
| Epic 0: 项目初始化 | AR1-AR4 |
| Epic 1: 用户认证 | FR1-FR5 |
| Epic 2: 知识内容 | FR6-FR10 |
| Epic 3: 部署决策树 | FR11-FR14 |
| Epic 4: AI 助手 | FR15-FR19 |
| Epic 5: 速查手册 | FR20-FR22 |
| Epic 6: 避坑指南 | FR23-FR24 |
| Epic 7: 管理员后台 | FR25-FR29 |
| Epic 8: 用户反馈 | FR30-FR31 |

---

## Epic List

| Epic | 名称 | 优先级 | Story 数量 |
|------|------|--------|-----------|
| Epic 0 | 项目初始化 | P0 | 4 |
| Epic 1 | 用户认证 | P0 | 5 |
| Epic 2 | 知识内容浏览 | P0 | 6 |
| Epic 3 | 部署决策树 | P0 | 4 |
| Epic 4 | AI 助手 | P0 | 5 |
| Epic 5 | 速查手册 | P1 | 3 |
| Epic 6 | 避坑指南 | P1 | 2 |
| Epic 7 | 管理员后台 | P1 | 5 |
| Epic 8 | 用户反馈 | P2 | 2 |

---

## Epic 0: 项目初始化

初始化前后端项目骨架、数据库结构、基础配置。

### Story 0.1: 前端项目初始化

As a 开发者,
I want 初始化 Vue 3 前端项目骨架,
So that 后续功能开发有统一的基础架构。

**Acceptance Criteria:**

**Given** 项目目录为空
**When** 执行初始化命令
**Then** 创建 Vue 3 + TypeScript + Vite 项目
**And** 安装 Element Plus、Pinia、Vue Router、Axios
**And** 配置路径别名 @/、Element Plus 自动导入
**And** 项目可正常启动 `npm run dev`

---

### Story 0.2: 后端项目初始化

As a 开发者,
I want 初始化 Express 后端项目骨架,
So that 后续 API 开发有统一的基础架构。

**Acceptance Criteria:**

**Given** 项目目录为空
**When** 执行初始化命令
**Then** 创建 Express + TypeScript 项目
**And** 配置 tsconfig.json、nodemon、ESLint
**And** 创建 src 目录结构（controllers、routes、services、middlewares、models、types）
**And** 项目可正常启动 `npm run dev`

---

### Story 0.3: 数据库设计与初始化

As a 开发者,
I want 创建数据库和基础表结构,
So that 系统可以存储用户数据、内容数据。

**Acceptance Criteria:**

**Given** MySQL 服务已运行
**When** 执行数据库初始化脚本
**Then** 创建数据库 `deployment_learning`
**And** 创建 users 表（id、openid、role、created_at）
**And** 创建 contents 表（id、domain、level、title、description、examples）
**And** 创建 user_progress 表（user_id、content_id、status、updated_at）
**And** 创建 feedbacks 表（id、user_id、content_id、type、message、status）

---

### Story 0.4: 环境变量配置

As a 开发者,
I want 配置环境变量模板,
So that 敏感信息不会被提交到代码仓库。

**Acceptance Criteria:**

**Given** 项目需要外部服务凭证
**When** 创建 .env.example 模板
**Then** 包含数据库配置项
**And** 包含微信 OAuth 配置项
**And** 包含 Claude API 配置项
**And** .env 已加入 .gitignore

---

## Epic 1: 用户认证

实现微信扫码登录、用户状态管理、角色区分。

### Story 1.1: 微信扫码登录前端

As a 未登录用户,
I want 通过微信扫码登录系统,
So that 我可以使用平台的完整功能。

**Acceptance Criteria:**

**Given** 用户未登录
**When** 访问登录页面
**Then** 显示微信扫码登录按钮
**And** 点击后跳转到微信授权页面
**And** 授权成功后跳转回首页并显示登录状态

---

### Story 1.2: 微信 OAuth 后端集成

As a 系统,
I want 处理微信 OAuth 回调,
So that 用户可以通过微信账号登录。

**Acceptance Criteria:**

**Given** 用户在微信授权页面点击同意
**When** 微信回调到后端接口
**Then** 后端获取 access_token
**And** 获取用户 openid
**And** 创建或更新用户记录
**And** 设置 Session 并返回前端

---

### Story 1.3: 用户登录状态管理

As a 登录用户,
I want 在页面间保持登录状态,
So that 我不需要重复登录。

**Acceptance Criteria:**

**Given** 用户已登录
**When** 刷新页面或访问其他页面
**Then** 保持登录状态
**And** 显示用户信息
**And** Session 过期后提示重新登录

---

### Story 1.4: 用户角色区分

As a 管理员,
I want 系统区分普通用户和管理员,
So that 管理员可以访问后台管理功能。

**Acceptance Criteria:**

**Given** 用户角色字段存在
**When** 用户登录时
**Then** 系统检查用户角色
**And** 管理员可访问 /admin 路由
**And** 普通用户访问 /admin 时返回 403

---

### Story 1.5: 退出登录

As a 登录用户,
I want 安全退出登录,
So that 我的账号不会被他人冒用。

**Acceptance Criteria:**

**Given** 用户已登录
**When** 点击退出登录按钮
**Then** 清除 Session
**And** 跳转到首页
**And** 显示「已退出登录」提示

---

## Epic 2: 知识内容浏览

实现 6 大领域知识内容的浏览、筛选、搜索、收藏功能。

### Story 2.1: 知识内容列表页

As a 用户,
I want 浏览 6 大领域的知识内容,
So that 我可以学习部署相关知识。

**Acceptance Criteria:**

**Given** 数据库中有知识内容数据
**When** 访问知识内容页面
**Then** 显示 6 大领域分类（构建、平台、服务器、自动化、域名、容器）
**And** 每个领域显示内容卡片列表
**And** 卡片显示标题、层级标签、简介

---

### Story 2.2: 内容筛选功能

As a 用户,
I want 按领域和层级筛选内容,
So that 我可以快速找到感兴趣的内容。

**Acceptance Criteria:**

**Given** 内容列表已加载
**When** 选择领域筛选条件
**Then** 只显示该领域的内容
**When** 选择层级筛选条件
**Then** 只显示该层级的内容
**And** 支持组合筛选

---

### Story 2.3: 内容搜索功能

As a 用户,
I want 搜索知识内容,
So that 我可以快速定位特定知识点。

**Acceptance Criteria:**

**Given** 内容列表已加载
**When** 在搜索框输入关键词
**Then** 实时显示匹配的内容
**And** 高亮匹配的关键词
**And** 无结果时显示友好提示

---

### Story 2.4: 内容详情页

As a 用户,
I want 查看内容的详细说明和示例,
So that 我可以深入学习该知识点。

**Acceptance Criteria:**

**Given** 用户点击内容卡片
**When** 进入详情页
**Then** 显示完整的知识内容
**And** 显示代码示例（带语法高亮）
**And** 显示相关链接
**And** 显示上一篇/下一篇导航

---

### Story 2.5: 内容收藏功能

As a 登录用户,
I want 收藏感兴趣的内容,
So that 我可以快速找到它们。

**Acceptance Criteria:**

**Given** 用户已登录
**When** 点击收藏按钮
**Then** 内容被添加到收藏列表
**And** 按钮状态变为「已收藏」
**When** 再次点击
**Then** 取消收藏

---

### Story 2.6: 收藏列表页

As a 登录用户,
I want 查看我收藏的内容列表,
So that 我可以快速访问感兴趣的内容。

**Acceptance Criteria:**

**Given** 用户已登录且有收藏内容
**When** 访问收藏页面
**Then** 显示所有收藏的内容卡片
**And** 支持取消收藏
**And** 点击卡片跳转到内容详情

---

## Epic 3: 部署决策树

实现问答式决策树，引导用户选择合适的部署方案。

### Story 3.1: 决策树组件开发

As a 开发者,
I want 开发 DecisionTree 组件,
So that 用户可以通过问答流程选择方案。

**Acceptance Criteria:**

**Given** 组件已开发
**When** 传入决策树数据
**Then** 渲染当前问题和选项
**And** 点击选项后前进到下一题
**And** 显示进度指示器
**And** 支持返回上一题

---

### Story 3.2: 决策树数据设计

As a 开发者,
I want 设计决策树问题和推荐逻辑,
So that 系统可以根据用户回答推荐方案。

**Acceptance Criteria:**

**Given** 决策树需要覆盖常见部署场景
**When** 设计问题和选项
**Then** 问题涵盖：服务器、预算、项目类型、技术栈等
**And** 每条路径有明确的推荐结果
**And** 推荐结果包含推荐理由

---

### Story 3.3: 决策结果展示页

As a 用户,
I want 查看决策树的推荐结果,
So that 我知道应该选择哪种部署方案。

**Acceptance Criteria:**

**Given** 用户完成决策树问答
**When** 显示推荐结果
**Then** 显示推荐的部署方案
**And** 显示推荐理由
**And** 显示「查看步骤指南」按钮
**And** 显示「重新选择」按钮

---

### Story 3.4: 步骤指南展示

As a 用户,
I want 查看推荐方案的详细步骤指南,
So that 我可以按步骤完成部署。

**Acceptance Criteria:**

**Given** 用户点击「查看步骤指南」
**When** 进入步骤指南页
**Then** 显示分步骤的操作指南
**And** 每步骤包含描述、截图、代码
**And** 支持一键复制命令
**And** 显示预计完成时间

---

## Epic 4: AI 助手

实现 AI 对话功能，支持流式输出、术语解释、问题诊断。

### Story 4.1: AIChat 组件开发

As a 开发者,
I want 开发 AIChat 对话组件,
So that 用户可以与 AI 助手交互。

**Acceptance Criteria:**

**Given** 组件已开发
**When** 用户打开 AI 助手
**Then** 显示对话界面
**And** 显示输入框和发送按钮
**And** 支持输入问题并发送
**And** 显示 AI 回复（流式输出）

---

### Story 4.2: AI 对话后端 API

As a 系统,
I want 提供 AI 对话 API,
So that 前端可以调用 AI 服务。

**Acceptance Criteria:**

**Given** 后端已集成 Claude API
**When** 前端调用 POST /api/ai/chat
**Then** 后端流式调用 Claude API
**And** 返回 SSE 流式响应
**And** 处理超时和错误情况
**And** 记录对话历史

---

### Story 4.3: 流式响应处理

As a 用户,
I want 看到 AI 回复逐字显示,
So that 我不需要等待完整响应。

**Acceptance Criteria:**

**Given** 用户发送问题
**When** AI 开始回复
**Then** 内容逐字/逐段显示
**And** 显示打字动画效果
**And** 支持中断响应
**And** 响应完成后显示复制按钮

---

### Story 4.4: 术语解释功能

As a 用户,
I want AI 解释部署相关术语,
So that 我可以理解专业名词。

**Acceptance Criteria:**

**Given** 用户询问术语（如「什么是 Nginx」）
**When** AI 回复
**Then** 返回通俗易懂的解释
**And** 包含示例或类比
**And** 提供相关学习链接

---

### Story 4.5: 对话历史记录

As a 登录用户,
I want 查看我的对话历史,
So that 我可以回顾之前的问题和解答。

**Acceptance Criteria:**

**Given** 用户已登录
**When** 打开 AI 助手
**Then** 显示最近的对话记录
**And** 可以继续之前的对话
**And** 可以清空对话历史

---

## Epic 5: 速查手册

实现概念卡片、命令速查、配置模板功能。

### Story 5.1: 概念卡片页面

As a 用户,
I want 查看概念卡片,
So that 我可以快速了解核心概念。

**Acceptance Criteria:**

**Given** 数据库中有概念卡片数据
**When** 访问速查手册页面
**Then** 显示概念卡片列表
**And** 卡片包含术语、定义、示例
**And** 支持搜索和筛选

---

### Story 5.2: 命令速查表

As a 用户,
I want 查看常用命令速查表,
So that 我可以快速复制常用命令。

**Acceptance Criteria:**

**Given** 命令数据已录入
**When** 访问命令速查页面
**Then** 显示按类别分组的命令列表
**And** 每条命令有说明
**And** 支持一键复制

---

### Story 5.3: 配置模板库

As a 用户,
I want 查看常用配置模板,
So that 我可以快速使用标准配置。

**Acceptance Criteria:**

**Given** 配置模板数据已录入
**When** 访问配置模板页面
**Then** 显示配置模板列表（Nginx、Docker、CI/CD 等）
**And** 显示配置说明
**And** 支持一键复制完整配置

---

## Epic 6: 避坑指南

实现免费平台注意事项和风险提示。

### Story 6.1: 免费平台对比页

As a 用户,
I want 浏览各免费平台的注意事项,
So that 我可以选择最适合的平台。

**Acceptance Criteria:**

**Given** 平台数据已录入
**When** 访问避坑指南页面
**Then** 显示主流免费平台列表（Vercel、Netlify、GitHub Pages 等）
**And** 显示各平台优缺点对比
**And** 显示限制条件和注意事项

---

### Story 6.2: 风险提示页面

As a 用户,
I want 查看免费方案的常见限制和风险,
So that 我可以避免踩坑。

**Acceptance Criteria:**

**Given** 风险数据已录入
**When** 访问风险提示页面
**Then** 显示常见风险类别
**And** 每个风险有详细说明
**And** 提供规避建议

---

## Epic 7: 管理员后台

实现内容管理、用户管理、数据统计功能。

### Story 7.1: 后台登录页

As a 管理员,
I want 安全登录后台管理系统,
So that 我可以管理平台内容。

**Acceptance Criteria:**

**Given** 用户角色为管理员
**When** 访问 /admin 路由
**Then** 显示后台登录页（或自动跳转）
**And** 登录成功后进入后台首页
**And** 非管理员显示 403 错误

---

### Story 7.2: 内容管理 CRUD

As a 管理员,
I want 创建、编辑、删除知识内容,
So that 我可以维护平台内容。

**Acceptance Criteria:**

**Given** 管理员已登录后台
**When** 访问内容管理页面
**Then** 显示内容列表
**And** 支持新增内容（标题、领域、层级、描述、示例）
**And** 支持编辑内容
**And** 支持删除内容（需确认）

---

### Story 7.3: 用户反馈管理

As a 管理员,
I want 查看用户反馈,
So that 我可以了解用户需求和问题。

**Acceptance Criteria:**

**Given** 用户已提交反馈
**When** 访问反馈管理页面
**Then** 显示反馈列表
**And** 显示反馈类型、内容、状态
**And** 支持标记反馈状态（待处理/已处理/已忽略）

---

### Story 7.4: 数据统计面板

As a 管理员,
I want 查看基础统计数据,
So that 我可以了解平台使用情况。

**Acceptance Criteria:**

**Given** 后台已登录
**When** 访问统计面板
**Then** 显示今日活跃用户数
**And** 显示 AI 使用次数
**And** 显示热门内容 Top 10
**And** 显示用户增长趋势图

---

### Story 7.5: 用户角色管理

As a 超级管理员,
I want 管理用户角色,
So that 我可以授权其他管理员。

**Acceptance Criteria:**

**Given** 当前用户有权限
**When** 访问用户管理页面
**Then** 显示用户列表
**And** 支持修改用户角色
**And** 操作记录审计日志

---

## Epic 8: 用户反馈

实现用户反馈提交和状态查看功能。

### Story 8.1: 反馈提交功能

As a 登录用户,
I want 提交内容反馈,
So that 我可以报告错误或提出建议。

**Acceptance Criteria:**

**Given** 用户已登录
**When** 点击反馈按钮
**Then** 显示反馈表单
**And** 可选择反馈类型（错误/建议/其他）
**And** 可输入反馈内容
**And** 提交成功显示确认信息

---

### Story 8.2: 反馈状态查看

As a 登录用户,
I want 查看我提交的反馈状态,
So that 我知道反馈是否被处理。

**Acceptance Criteria:**

**Given** 用户已提交过反馈
**When** 访问我的反馈页面
**Then** 显示反馈列表
**And** 显示每条反馈的状态
**And** 显示管理员回复（如有）

---

## Summary

| Epic | Stories | 优先级 |
|------|---------|--------|
| Epic 0: 项目初始化 | 4 | P0 |
| Epic 1: 用户认证 | 5 | P0 |
| Epic 2: 知识内容浏览 | 6 | P0 |
| Epic 3: 部署决策树 | 4 | P0 |
| Epic 4: AI 助手 | 5 | P0 |
| Epic 5: 速查手册 | 3 | P1 |
| Epic 6: 避坑指南 | 2 | P1 |
| Epic 7: 管理员后台 | 5 | P1 |
| Epic 8: 用户反馈 | 2 | P2 |
| **总计** | **36** | — |

