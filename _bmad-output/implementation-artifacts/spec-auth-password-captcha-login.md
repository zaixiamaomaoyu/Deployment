---
title: '重写认证模块：微信登录改为账号密码+验证码登录'
type: 'refactor'
created: '2026-06-02'
status: 'done'
baseline_commit: '9c995ebbaf581929bb36175d66eaabcc2d8225ab'
context:
  - '_bmad-output/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** 项目当前使用微信扫码登录（OAuth 2.0），需要改为账号密码+数字随机验证码的自主认证体系，以脱离对微信开放平台的依赖。

**Approach:** 重写前后端认证入口：前端替换为账号密码登录表单，后端替换为 bcrypt 密码校验+svg-captcha 验证码的 Session 认证 API，保留现有用户状态管理和角色区分逻辑。

## Boundaries & Constraints

**Always:**
- 密码必须使用 bcrypt 加密存储，禁止明文保存
- 验证码有效期 5 分钟，单验证码最多 3 次验证失败
- 单 IP 每分钟最多请求 5 次验证码
- 保留现有 `req.session.userId` 和 `/api/auth/me`、`/api/auth/logout` 的接口契约不变
- 保留现有路由守卫和权限中间件的判断逻辑

**Ask First:**
- 是否需要保留微信 OpenID 字段供未来绑定？（当前方案：保留但设为 optional）
- 是否需要密码找回功能？（当前方案：MVP 暂不实现）
- 现有微信用户数据如何迁移？（当前方案：MVP 允许重新注册，旧数据保留）

**Never:**
- 不使用 JWT 替代 Session（保持现有 Session 机制）
- 不修改非认证相关的业务逻辑（内容管理、AI 助手等）
- 不在 MVP 阶段实现滑动验证码（先用数字图片验证码）

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| 登录成功 | 正确用户名、密码、验证码 | 设置 session，返回用户信息，跳转首页 | N/A |
| 登录失败-密码错误 | 正确用户名、错误密码、正确验证码 | 返回 401，提示"用户名或密码错误" | 不泄露用户名是否存在 |
| 登录失败-验证码过期 | 正确凭据、过期验证码 | 返回 400，提示"验证码已过期，请刷新" | 拒绝登录 |
| 登录失败-验证码错误 | 正确凭据、错误验证码 | 返回 400，提示"验证码错误" | 记录该验证码失败次数，满3次失效 |
| 注册成功 | 唯一用户名、6位+密码、匹配确认密码、正确验证码 | 创建用户，自动登录，跳转首页 | N/A |
| 注册失败-用户名已存在 | 已存在用户名 | 返回 409，提示"用户名已被注册" | 阻止创建 |
| 注册失败-密码太短 | 密码少于6位 | 返回 400，提示"密码至少需要6位" | 阻止创建 |
| 验证码防刷 | 同一 IP 1分钟内第6次请求验证码 | 返回 429，提示"请求过于频繁，请稍后再试" | 拒绝生成新验证码 |

</frozen-after-approval>

## Code Map

- `frontend/src/views/Login.vue` -- 登录页面，需重写为账号密码表单
- `frontend/src/views/AuthCallback.vue` -- 微信回调页，需删除或重定向
- `frontend/src/components/WechatLoginButton.vue` -- 微信登录按钮，需删除
- `frontend/src/api/auth.ts` -- 认证 API 封装，需替换为 login/register/captcha
- `frontend/src/stores/user.ts` -- 用户状态管理，login 后调用逻辑不变，仅需更新 login 入口
- `frontend/src/router/index.ts` -- 路由守卫，无需修改（仍通过 /api/auth/me 判断登录状态）
- `backend/src/routes/auth.routes.ts` -- 认证路由定义，需新增 login/register/captcha 端点，删除 wechat 端点
- `backend/src/controllers/auth.controller.ts` -- 认证控制器，需重写 wechatCallback 为 login/register，新增 captcha
- `backend/src/models/users.model.ts` -- 用户 DAO，需新增 findByUsername、按用户名创建用户
- `backend/src/services/wechat.service.ts` -- 微信服务，需删除
- `backend/src/app.ts` -- Session 配置，无需修改
- `backend/scripts/database-init.sql` -- 数据库初始化，users 表需新增 username/password_hash
- `backend/.env` / `frontend/.env` -- 移除微信相关配置

## Tasks & Acceptance

**Execution:**
- [x] `backend/scripts/database-init.sql` -- 修改 users 表结构：新增 `username VARCHAR(50) UNIQUE NOT NULL`、`password_hash VARCHAR(255) NOT NULL`，保留 `openid` 改为 optional，更新索引 -- 支持账号密码存储
- [x] `backend/package.json` -- 新增依赖 `bcrypt`、`svg-captcha`，移除 `@anthropic-ai/sdk` 无关项检查确认 -- 密码加密和验证码生成
- [x] `backend/src/models/users.model.ts` -- 新增 `findByUsername(username)`、`createUserWithPassword(userData)` 方法，修改 `create` 支持 username/password_hash -- 用户数据访问
- [x] `backend/src/controllers/auth.controller.ts` -- 删除 `wechatCallback`，新增 `login(req, res)`（校验用户名密码+bcrypt+验证码）、`register(req, res)`（唯一性校验+bcrypt加密+创建用户）、`getCaptcha(req, res)`（svg-captcha生成+存入session+返回图片） -- 核心认证逻辑
- [x] `backend/src/routes/auth.routes.ts` -- 删除 `/wechat/callback` 路由，新增 `POST /login`、`POST /register`、`GET /captcha`，保留 `/me` 和 `/logout` -- 路由暴露
- [x] `backend/src/services/wechat.service.ts` -- 删除整个文件及所有引用 -- 清理废弃服务
- [x] `backend/.env` / `backend/.env.example` -- 删除 `WECHAT_APP_ID`、`WECHAT_APP_SECRET`、`WECHAT_REDIRECT_URI` -- 清理环境变量
- [x] `frontend/package.json` -- 确认无需新增前端依赖（Element Plus 表单组件已内置） -- 前端依赖
- [x] `frontend/src/api/auth.ts` -- 替换为 `login(credentials)`、`register(data)`、`getCaptcha()`（返回图片 URL），保留 `getCurrentUser()` 和 `logout()` -- API 封装
- [x] `frontend/src/views/Login.vue` -- 重写为 Element Plus 表单：用户名输入、密码输入（可切换可见）、验证码输入+图片刷新、记住我复选框、登录按钮、注册入口链接 -- 登录页面
- [x] `frontend/src/views/Register.vue` -- 新建注册页面：用户名、密码、确认密码、验证码、注册按钮、返回登录链接 -- 注册页面
- [x] `frontend/src/router/index.ts` -- 新增 `/register` 路由（guestOnly），删除 `/auth/callback` 路由 -- 路由注册
- [x] `frontend/src/components/WechatLoginButton.vue` -- 删除组件及所有引用 -- 清理废弃组件
- [x] `frontend/src/views/AuthCallback.vue` -- 删除页面及路由引用 -- 清理废弃页面
- [x] `frontend/.env` / `frontend/.env.example` -- 删除 `VITE_WECHAT_APP_ID`、`VITE_WECHAT_REDIRECT_URI` -- 清理环境变量

**Acceptance Criteria:**
- Given 未登录用户访问登录页，当输入正确用户名密码和验证码后点击登录，则 session 建立并跳转到首页
- Given 未登录用户访问注册页，当输入唯一用户名、6位以上密码、匹配确认密码和正确验证码后点击注册，则创建用户并自动登录跳转到首页
- Given 用户输入错误密码，当点击登录时，则返回"用户名或密码错误"且不暴露用户名是否存在
- Given 验证码超过5分钟或错误3次，当用户提交时，则返回验证码失效提示
- Given 同一IP在1分钟内请求超过5次验证码，当第6次请求时，则返回429限流提示
- Given 已登录用户，当访问需要认证的路由（如 /favorites），则正常访问不受认证方式变更影响
- Given 已登录用户，当点击退出登录，则 session 销毁并跳转到登录页

## Spec Change Log

**2026-06-02 — Acceptance Auditor 审查后修复**

- **触发发现**：Session Fixation 风险（登录/注册后未重新生成 session ID）；500 错误将内部 error.message 返回给客户端；UserInfo.openid 仍为必填但后端不再返回
- **修改内容**：
  - `AuthController.login` / `register`：设置 `req.session.userId` 前调用 `req.session.regenerate()` 重新生成 session ID
  - `AuthController.login` / `register` / `me` catch 块：500 错误统一返回 `message: '服务器内部错误'`，详细错误仅记录日志
  - `frontend/src/api/auth.ts` 和 `frontend/src/stores/user.ts`：`UserInfo.openid` 改为可选 `openid?: string`
- **避免的已知不良状态**：Session Fixation 攻击可利用固定 session ID；内部数据库错误详情泄露给客户端可能帮助攻击者
- **KEEP 指令**：验证码校验逻辑（5分钟过期+3次尝试）和限流逻辑保持不变

## Design Notes

验证码存储策略（MVP）：使用 express-session 存储验证码文本和过期时间，无需 Redis。session 中字段：
```typescript
req.session.captcha = { text: 'AB12', expires: Date.now() + 5*60*1000, attempts: 0 }
```

bcrypt 配置：使用异步 `bcrypt.hash(password, 10)` 和 `bcrypt.compare(password, hash)`。

## Verification

**Commands:**
- `cd backend && npm install` -- expected: bcrypt 和 svg-captcha 安装成功
- `cd backend && npx ts-node -e "console.log('TypeScript OK')"` -- expected: 无类型错误
- `cd frontend && npm install` -- expected: 依赖无冲突

**Manual checks:**
- 访问 `GET /api/auth/captcha` 应返回 SVG 图片且响应头 Content-Type 为 image/svg+xml
- 查看数据库 users 表应包含 username 和 password_hash 字段
- 登录成功后浏览器应存在名为 `connect.sid` 的 cookie

## Suggested Review Order

**认证核心逻辑**

- 登录入口：校验验证码 → bcrypt 比对密码 → regenerate session
  [`auth.controller.ts:17`](../../backend/src/controllers/auth.controller.ts#L17)

- 注册入口：唯一性校验 → bcrypt 哈希 → 自动登录
  [`auth.controller.ts:69`](../../backend/src/controllers/auth.controller.ts#L69)

- 验证码生成：svg-captcha + Session 存储 + IP 限流
  [`auth.controller.ts:137`](../../backend/src/controllers/auth.controller.ts#L137)

- 验证码校验：5分钟过期 + 3次错误上限
  [`auth.controller.ts:225`](../../backend/src/controllers/auth.controller.ts#L225)

**数据模型**

- 用户接口：新增 username/password_hash，openid 改为 optional
  [`users.model.ts:4`](../../backend/src/models/users.model.ts#L4)

- 按用户名查找 + 带密码创建用户
  [`users.model.ts:50`](../../backend/src/models/users.model.ts#L50)

- 数据库表结构变更
  [`database-init.sql`](../../backend/scripts/database-init.sql)

**前端界面**

- 登录页：Element Plus 表单 + 验证码图片刷新
  [`Login.vue:1`](../../frontend/src/views/Login.vue#L1)

- 注册页：密码强度提示 + 确认密码校验
  [`Register.vue:1`](../../frontend/src/views/Register.vue#L1)

- API 封装：login/register/captcha
  [`auth.ts:16`](../../frontend/src/api/auth.ts#L16)

**路由与类型**

- 后端认证路由：替换微信端点为自建端点
  [`auth.routes.ts:6`](../../backend/src/routes/auth.routes.ts#L6)

- Session 类型扩展：新增 CaptchaData
  [`express.d.ts:4`](../../backend/src/types/express.d.ts#L4)

- 前端路由：新增 /register，移除 /auth/callback
  [`index.ts`](../../frontend/src/router/index.ts)

- UserInfo 类型：openid 改为可选
  [`user.ts:4`](../../frontend/src/stores/user.ts#L4)
