---
project_name: 'Deployment'
user_name: 'maomaoyu'
date: '2026-06-02'
change_scope: 'Moderate'
status: 'Approved'
---

# Sprint Change Proposal - 认证方式变更

## Section 1: Issue Summary

### 问题陈述
用户提出将项目的认证方式从**微信扫码登录（OAuth 2.0）**改为**账号密码 + 数字随机验证码登录**。

### 变更背景
- **触发时间**：2026-06-02，由利益相关者主动提出
- **变更性质**：需求方向调整，非技术缺陷修复
- **当前状态**：Epic 1（用户认证）已标记为"已完成"，所有 Story（1-1 至 1-5）已实现基于微信 OAuth 的认证流程

### 问题证据
- PRD 中明确定义登录方式为"微信扫码登录"（FR1）
- 架构文档中认证依赖为"微信开放平台（需申请 AppID/AppSecret）"
- 代码层面已完成微信 OAuth 前端扫码页和后端回调接口

---

## Section 2: Impact Analysis

### Epic Impact

| Epic | 影响程度 | 说明 |
|------|---------|------|
| **Epic 1: 用户认证** | **高** | Story 1-1/1-2 需完全重写；1-3/1-4/1-5 与认证方式无关，可保留 |
| **Epic 7: 管理员后台** | **中** | Story 7-1（后台登录页）可能也需同步改为账号密码登录 |
| **Epic 2-8** | **低** | 仅涉及用户表结构调整（新增 password 字段），功能逻辑不受影响 |

### Story Impact

| Story | 当前状态 | 需执行操作 |
|-------|---------|-----------|
| 1-1 微信扫码登录前端 | 已完成 | **重写**：改为账号密码+验证码登录页 |
| 1-2 微信OAuth后端集成 | 已完成 | **重写**：改为自建账号认证 API |
| 1-3 用户登录状态管理 | 已完成 | **保留**：Session 机制通用，不受影响 |
| 1-4 用户角色区分 | 已完成 | **保留**：角色体系与认证方式无关 |
| 1-5 退出登录 | 已完成 | **保留**：退出逻辑与认证方式无关 |
| **1-6 账号注册功能** | **新增** | **新增 Story**：用户名注册、密码设置、验证码校验 |

### 文档冲突

| 文档 | 需更新章节 |
|------|-----------|
| **PRD** | FR1（登录方式）、NFR7（密码存储策略）、API 规范（用户认证端点） |
| **架构** | 认证依赖、用户数据模型（users 表结构）、密码加密策略、验证码机制 |
| **UX 设计** | 登录页面设计、登录流程、注册流程（新增） |

### 技术影响

| 领域 | 影响 |
|------|------|
| **数据库** | users 表新增 `username`、`password_hash` 字段；需迁移现有微信用户数据 |
| **后端代码** | 删除/替换微信 OAuth 相关控制器和路由；新增登录/注册/验证码接口 |
| **前端代码** | 删除微信扫码组件；新增登录表单、验证码输入组件、注册页面 |
| **环境配置** | 移除 `WECHAT_APP_ID`、`WECHAT_APP_SECRET`；可能新增验证码配置 |
| **测试** | 新增账号密码登录的单元测试和 E2E 测试 |
| **安全** | 引入密码存储安全（bcrypt）、验证码防刷、密码强度校验 |

---

## Section 3: Recommended Approach

### 选定路径：局部回滚 + 直接调整（混合方案）

**核心策略**：
1. **保留已完成且不受影响的 Story**（1-3、1-4、1-5）——减少重复工作
2. **重写认证入口 Story**（1-1、1-2）——替换为账号密码+验证码实现
3. **新增注册 Story**（1-6）——自建账号体系需要注册入口

### 选择理由

| 考量维度 | 评估 |
|---------|------|
| **实现工作量** | 中等。只需重写 2 个 Story + 新增 1 个 Story，而非整个 Epic |
| **技术风险** | 中等。bcrypt 和验证码是成熟方案，但需确保密码安全和防刷 |
| **团队动力** | 高保留度。已完成的通用 Story 不被浪费 |
| **长期可维护性** | 高。自建认证体系比依赖第三方 OAuth 更可控 |
| **MVP 影响** | 无。认证方式改变不影响核心产品价值 |

### 工作量与时间估算

| 任务 | 预估工作量 |
|------|-----------|
| Story 1-1 重写（前端登录页） | 1-2 天 |
| Story 1-2 重写（后端认证 API） | 2-3 天 |
| Story 1-6 新增（账号注册） | 1-2 天 |
| 文档同步更新（PRD/架构/UX） | 0.5 天 |
| **总计** | **约 1 个 Sprint（1-2 周）** |

### 风险与缓解

| 风险 | 缓解策略 |
|------|---------|
| 密码泄露风险 | 使用 bcrypt (cost=10) 加密，不存储明文 |
| 验证码被暴力破解 | 5 分钟有效期 + 最多 3 次错误尝试 + 单 IP 限流 |
| 现有微信用户数据迁移 | MVP 阶段允许用户重新注册；未来可扩展"绑定微信"功能 |

---

## Section 4: Detailed Change Proposals

### Story 变更

#### Story 1-1: 用户认证前端（重写）

**Section: 验收标准 + 实现内容**

**OLD:**
- 实现微信扫码登录前端页面
- 调用微信 OAuth API 获取扫码二维码
- 轮询登录状态直至成功

**NEW:**
- 实现账号密码登录前端页面（Element Plus 表单）
- 包含：用户名输入框、密码输入框、验证码输入框
- 支持「记住我」选项
- 提供「还没有账号？立即注册」入口
- 验证码支持数字随机验证码（svg-captcha 生成图片）
- 登录成功后调用原有用户状态管理逻辑（复用 Story 1-3）

**Rationale:** 认证方式从 OAuth 改为自建账号体系

---

#### Story 1-2: 用户认证后端（重写）

**Section: 验收标准 + 实现内容**

**OLD:**
- 实现微信 OAuth 回调接口 `/api/auth/wechat/callback`
- 调用微信 API 获取用户 openid/unionid
- 根据 openid 自动创建或查询用户
- 设置 Session

**NEW:**
- 实现账号密码登录接口 `POST /api/auth/login`
  - 校验用户名和密码（bcrypt 比对）
  - 校验验证码（区分大小写，有效期 5 分钟）
  - 设置 Session
- 实现验证码生成接口 `GET /api/auth/captcha`
  - 生成 4-6 位数字/字母随机验证码
  - 存储在服务端 Session 中
  - 返回 SVG 格式验证码图片
- 实现账号注册接口 `POST /api/auth/register`
  - 校验用户名唯一性
  - 密码强度校验（最少 6 位）
  - bcrypt 加密存储密码
  - 创建用户记录
- 单 IP 限流：每分钟最多请求 5 次验证码

**Rationale:** 认证方式从 OAuth 改为自建账号体系

---

#### Story 1-6: 账号注册功能（新增）

**Section: 完整 Story**

**Description:**
As a 新用户,
I want 通过账号密码注册系统,
So that 我可以使用平台功能.

**Acceptance Criteria:**
- 注册页面包含：用户名、密码、确认密码、验证码
- 用户名唯一性校验（实时或提交时）
- 密码强度提示（最少 6 位）
- 验证码校验
- 注册成功后自动登录并跳转首页
- 注册失败时显示具体错误信息

**Technical Notes:**
- 复用登录页的验证码组件
- 密码使用 bcrypt 加密存储
- 注册接口复用 Story 1-2 的后端逻辑

---

### PRD 变更

#### PRD Section: Functional Requirements / 用户认证与管理

**FR1 修改：**

**OLD:**
- FR1: 用户可以通过微信扫码登录系统

**NEW:**
- FR1: 用户可以通过账号密码+验证码登录系统

---

#### PRD Section: Non-Functional Requirements / Security

**NFR7 修改 + NFR8 新增：**

**OLD:**
- NFR7: 不存储用户密码，仅存储微信 OpenID

**NEW:**
- NFR7: 用户密码使用 bcrypt 算法加密存储，不保存明文密码
- NFR8（新增）: 验证码有效期 5 分钟，单验证码最多允许 3 次验证失败

---

#### PRD Section: API Specification / 用户认证

**API 规范更新：**

**OLD:**
| 用户认证 | `GET /api/auth/wechat` | 微信扫码登录 |
| 用户认证 | `GET /api/auth/status` | 检查登录状态 |
| 用户认证 | `POST /api/auth/logout` | 退出登录 |

**NEW:**
| 用户认证 | `POST /api/auth/login` | 账号密码+验证码登录 |
| 用户认证 | `GET /api/auth/captcha` | 获取验证码图片 |
| 用户认证 | `POST /api/auth/register` | 账号注册 |
| 用户认证 | `GET /api/auth/status` | 检查登录状态 |
| 用户认证 | `POST /api/auth/logout` | 退出登录 |

---

### 架构变更

#### Architecture Section: Database / users 表

**数据模型更新：**

**OLD:**
- `openid` (string, unique)
- `unionid` (string, optional)
- `nickname` (string)
- `avatar` (string)
- `role` (enum: user/admin)

**NEW:**
- `username` (string, unique, 登录账号)
- `password_hash` (string, bcrypt 加密)
- `email` (string, optional)
- `nickname` (string)
- `avatar` (string, optional)
- `role` (enum: user/admin)
- `openid` (string, optional, 保留用于未来扩展微信绑定)

**Rationale:** 支持账号密码登录，保留 openid 作为未来可选绑定

---

#### Architecture Section: Technical Constraints & Dependencies

**认证依赖变更：**

**OLD:**
| 认证依赖 | 微信开放平台（需申请 AppID/AppSecret）|

**NEW:**
| 认证依赖 | 自建账号体系（bcrypt + Session + 验证码）|
| 验证码库 | svg-captcha（MVP 阶段使用）|

**Additional:**
- 密码加密：bcrypt (cost factor 10)
- 验证码存储：Session（MVP 阶段），未来可迁移到 Redis
- 防刷策略：单 IP 每分钟最多请求 5 次验证码

---

### UX 变更

#### UX Design Section: User Journey Flows / 登录流程

**登录页设计（新增）：**

```
┌─────────────────────────────────────┐
│  🔐 用户登录                          │
│                                     │
│  用户名                               │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  密码                                 │
│  ┌─────────────────────────────┐    │
│  │                             │ 👁  │
│  └─────────────────────────────┘    │
│                                     │
│  验证码                               │
│  ┌─────────────┐ ┌───────────┐     │
│  │  4位验证码   │ │ [AB12]    │     │
│  └─────────────┘ └───────────┘     │
│                                     │
│  [ ] 记住我                           │
│                                     │
│  ┌─────────────────────────────┐    │
│  │         登 录               │    │
│  └─────────────────────────────┘    │
│                                     │
│  还没有账号？立即注册                  │
└─────────────────────────────────────┘
```

---

## Section 5: Implementation Handoff

### 变更范围分类

**Moderate（中等范围）**

理由：
- 需要重新组织 backlog（Epic 1 状态回退，Story 重新创建）
- 需要 PO/SM 协调更新 sprint 计划
- 不涉及战略层面或 MVP 目标的重新定义

### 交接对象与职责

| 角色 | 职责 |
|------|------|
| **开发团队** | 执行 Story 1-1/1-2 重写、Story 1-6 新增；实现 bcrypt + 验证码机制 |
| **Scrum Master** | 更新 sprint-status.yaml、Epic 文件、重新编排 Sprint 计划 |
| **Product Owner** | 更新 PRD 需求文档、确认 MVP 范围未受影响 |
| **架构师** | 更新架构文档中的数据模型和认证依赖描述 |
| **UX 设计师** | 补充登录页/注册页的交互设计细节 |

### 实施顺序建议

1. **同步更新文档**：PRD、架构、UX 设计（0.5 天）
2. **数据库迁移**：新增 `username`/`password_hash` 字段（0.5 天）
3. **后端开发**：Story 1-2 重写（登录/注册/验证码 API）（2-3 天）
4. **前端开发**：Story 1-1 重写（登录页）+ Story 1-6（注册页）（2-3 天）
5. **联调与测试**：前后端联调 + 安全测试（1-2 天）

### 成功标准

- [ ] 用户可以通过账号密码+验证码成功登录
- [ ] 新用户可以成功注册账号
- [ ] 验证码正确校验（5 分钟有效期）
- [ ] 密码使用 bcrypt 加密存储，数据库中无明文密码
- [ ] 原有功能（登录状态、角色区分、退出登录）不受影响
- [ ] 单 IP 验证码请求限流生效

---

## Approval

**变更提案状态：** 已批准

**批准日期：** 2026-06-02

**下一步行动：**
1. Scrum Master 更新 sprint-status.yaml（将 Epic 1 回退至"进行中"）
2. 开发团队开始实施 Story 1-1/1-2 重写 + Story 1-6 新增
3. 同步更新 PRD/架构/UX 文档
