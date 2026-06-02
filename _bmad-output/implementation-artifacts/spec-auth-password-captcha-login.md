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
- 密码必须使用 bcrypt 加密存储，禁止明文保存（实现使用 `bcryptjs` 纯 JS 库）
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

### Review Findings

**2026-06-02 — Epic 1 全量代码审查（Blind Hunter + Edge Case Hunter + Acceptance Auditor 三层并行）**

#### Decision-Needed（已全部决策 — 2026-06-02）

- [x] [Review][Decision] **D1 — bcryptjs vs bcrypt** → **保留 bcryptjs，更新 spec**（同步 Design Notes）
- [x] [Review][Decision] **D2 — 注册接口暴露「用户名已被注册」** → **保持现状（409 USERNAME_EXISTS）**，接受枚举风险
- [x] [Review][Decision] **D3 — CSRF 防护** → **保持 sameSite=lax 现状**
- [x] [Review][Decision] **D4 — Session Store Redis** → **推迟到 Epic 7 后台管理统一处理**（与 H6 合并 defer）

#### Patch — HIGH（生产阻断或安全高风险，发布前必修）

- [ ] [Review][Patch] **H1 — 登录暴力破解防护缺失** [backend/src/controllers/auth.controller.ts:17, backend/src/app.ts:20]：登录端点未单独限流，全局 100/15min 过于宽松；验证码 attempts 可通过刷新重置。建议对 `/auth/login` 单独配置失败计数（按账号+IP），N 次后短时锁定。
- [x] [Review][Patch] **H2 — 限流可绕过 + Map 内存泄漏** [auth.controller.ts:8, 273-279]：`getClientIp` 直接信任 `X-Forwarded-For` 首段值，攻击者可任意伪造绕过限流；`captchaRateLimit` Map 永不清理过期条目，长期运行 OOM。建议使用 `req.ip` 配合 `app.set('trust proxy', 1)`，并用 `express-rate-limit` 替换自实现 Map。
- [x] [Review][Patch] **H3 — 生产 HTTPS 反代下 cookie 不下发** [backend/src/app.ts:43-48]：`secure: env.NODE_ENV === 'production'` 在反向代理终止 TLS（常见部署）时让浏览器永不接受 Set-Cookie，导致"登录成功后下一请求立即 401"。需 `app.set('trust proxy', 1)` 让 express 正确识别 `X-Forwarded-Proto`。
- [x] [Review][Patch] **H4 — NavBar.vue 缺失 ElMessage import** [frontend/src/components/NavBar.vue:18]：`handleLogout` 调用 `ElMessage.success('已退出登录')` 但 `<script setup>` 未导入，点击"退出登录"会抛 ReferenceError。补 `import { ElMessage } from 'element-plus'`。
- [ ] [Review][Patch] **H5 — 用户名/密码服务端校验缺失** [auth.controller.ts:18, 76-92]：(a) username 无长度/字符白名单，可注册超长（触发 `Data too long`）、含 Unicode/零宽字符（绕过唯一性）、`admin`/`system` 等敏感名；(b) 密码仅 6 位下限无复杂度；(c) 无最大长度限制，超长密码（1MB）触发 bcrypt 重复哈希 DoS。建议服务端加 username 正则 `^[a-zA-Z0-9_\-.]{3,50}$` + NFC normalize；password 上限 1024 字节。
- [ ] [Review][Patch] **H6 — 生产 MemoryStore 不可用** [backend/src/app.ts:39]：（与 D4 联动，已 defer 到 Epic 7）

#### Patch — MEDIUM（应修复，可分批）

- [x] [Review][Patch] **M1 — 用户名枚举（时序攻击）** [auth.controller.ts:33-44]：用户不存在时立即返回，用户存在时执行 bcrypt（~100ms），时间差可枚举用户名。建议用户不存在时也执行一次假 `bcrypt.compare` 抹平时序。
- [x] [Review][Patch] **M2 — session 持久化竞态** [auth.controller.ts:47-54, 122-129, 260-264]：`regenerate` 后立即赋值 `userId` 并响应，未显式 `req.session.save()`，store 异步写入失败时登录态丢失；`attempts` 修改同样依赖响应结束自动 save。建议在响应前显式 `await new Promise((r,j)=>req.session.save(err=>err?j(err):r()))`。
- [x] [Review][Patch] **M3 — 第3次验证码错误语义偏差** [auth.controller.ts:259-264]：第 3 次输错时立即返回"验证码已过期"，与 spec I/O Matrix 描述（"验证码错误 + 计入失败次数，满3次失效"）不符。建议 `attempts += 1` 后本次仍返回"验证码错误"，仅当"下次进入 validateCaptcha"且 `attempts >= 3` 才提示失效。
- [x] [Review][Patch] **M4 — /me 与 /logout 500 文案不统一** [auth.controller.ts:213-219, 227-233]：违反 spec Change Log 修复要求。`/me` 返回 `'获取用户信息失败'`，`/logout` 返回 `'退出登录失败'`，应统一为 `'服务器内部错误'`。
- [x] [Review][Patch] **M5 — 并发注册竞态** [auth.controller.ts:102-113]：两个请求同时通过 `findByUsername` 检查后第二个 INSERT 触发 `uk_username` 报错，被 catch 返回 500 而非 409。建议捕获 mysql2 `ER_DUP_ENTRY` 错误码转为 `USERNAME_EXISTS`。
- [x] [Review][Patch] **M6 — bcrypt.compare 对非法 hash 抛错** [auth.controller.ts:40]：当 `password_hash` 为空字符串或非 bcrypt 格式（如历史 MD5 数据）时，`bcrypt.compare` 抛 `Not a valid BCrypt hash`，用户彻底无法登录且日志显示通用 500。建议调用前校验 hash 以 `$2` 开头且长度 ≥ 60，非法时返回 `INVALID_CREDENTIALS`。
- [x] [Review][Patch] **M7 — getCaptcha 覆盖 attempts 让 3 次限制形同虚设** [auth.controller.ts:176-180]：每次刷新验证码重置 `attempts=0` 并覆盖 text，攻击者可 3 次错误后立即刷新继续暴力。建议 getCaptcha 不重置 attempts，或将登录失败计数与验证码解耦。
- [x] [Review][Patch] **M8 — 登录后冗余 fetchUserInfo 可能覆盖状态** [Login.vue:58-59, Register.vue:86-87, stores/user.ts:16-24]：登录/注册接口已返回完整 user，紧接着又调用 `/auth/me`；若该次请求失败（网络/会话未生效），`userInfo` 被置 null，用户看到"登录成功"提示但实际未登录。建议删除冗余 `fetchUserInfo` 调用，直接信任 `setUser(user)`。
- [x] [Review][Patch] **M9 — router.beforeEach 网络错误强踢登录页** [router/index.ts:55-75, stores/user.ts:16-24]：`fetchUserInfo` catch 不区分 401 与网络/500 错误，任何失败都置 null；已登录用户在网络抖动时被踢到 `/login`。建议根据 axios 错误状态码区分，非 401 不清空状态。
- [ ] [Review][Patch] **M10 — req.body 类型校验缺失** [auth.controller.ts:18, 77, 259]：客户端发送 `{username: {$gt: ""}, captcha: ["a","b","c","d"]}` 等非字符串 payload 时行为不可预测。建议入口统一 `String(...)` 转换或引入 zod/joi。
- [ ] [Review][Patch] **M11 — Unicode/全角字符绕过唯一性** [auth.controller.ts:102, users.model.ts:56-60]：`admin` 与 `admin​`（零宽空格）数据库视为不同但视觉相同，可造成账号伪装。建议 username NFC normalize + 正则白名单（与 H5 合并实现）。
- [x] [Review][Patch] **M12 — 全局 rate limit 与 captcha 限流响应字段不一致** [app.ts:20-25]：全局 limiter 返回 `{error: '...'}`，captcha 限流返回 `{code: 'RATE_LIMITED', message: '...'}`，前端错误处理需兼容两种结构。建议统一为 `{code, message}` 或在 `/auth/captcha` 上 `skip` 全局限流。
- [x] [Review][Patch] **M13 — session.userId 设置后未显式 save**（与 M2 合并处理）

#### Patch — LOW（建议修复）

- [x] [Review][Patch] **L1 — blob URL 未 revoke** [api/auth.ts:49-54, Login.vue:37-43, Register.vue:65-71]：每次刷新验证码创建新 blob URL，旧的从未释放，SPA 长期停留持续泄露。建议刷新前 `URL.revokeObjectURL(captchaUrl.value)`，组件卸载时也 revoke。
- [x] [Review][Patch] **L2 — logout 未清理客户端 cookie** [auth.controller.ts:226-235]：`session.destroy` 仅删服务端数据，浏览器保留无效 `connect.sid`。建议 `res.clearCookie('connect.sid', { path: '/' })`。
- [x] [Review][Patch] **L3 — logout 未检查登录态** [auth.controller.ts:226-235]：未登录用户调用 `/auth/logout` 也得到 SUCCESS。建议先检查 `req.session?.userId`，未登录返回 401。
- [x] [Review][Patch] **L4 — 验证码 SVG 未禁缓存** [auth.controller.ts:182-183]：未设置 `Cache-Control: no-store`，浏览器或反代可能缓存旧 SVG 与 session 不一致。建议补全缓存控制头。
- [x] [Review][Patch] **L5 — captcha 全角字符 normalize** [auth.controller.ts:259]：用户输入全角字母（如 `Ａ`）`toLowerCase` 不变，比较失败。建议 `String(inputCaptcha).normalize('NFKC').toLowerCase()`。
- [x] [Review][Patch] **L6 — 前端 UserInfo 类型缺 username 字段** [api/auth.ts:8-14]：后端返回 username 但前端 UserInfo 接口未定义，NavBar.vue 显示 `nickname || username || '用户'` 时 username 实际为 undefined。建议补 `username: string`。
- [ ] [Review][Patch] **L7 — UsersModel.create 旧方法残留** [users.model.ts:41-51]：旧 `create` 方法 SQL 中无 `username/password_hash`（NOT NULL），调用必失败。建议删除或重写为新结构。
- [ ] [Review][Patch] **L8 — logout destroy 失败前端已清空** [stores/user.ts:30-36]：`finally` 块无条件清空 userInfo，后端 destroy 失败时前端认为已登出但 session 仍有效。建议失败时给出提示并保留状态。
- [x] [Review][Patch] **L9 — /me 用户被删除时未清理 session** [auth.controller.ts:199-204]：用户被管理员删除后 session 仍有效，下次请求 `/me` 返回 401 但 cookie 残留。建议 catch 中显式 `req.session.destroy`。
- [x] [Review][Patch] **L10 — express.json 全局 10MB 过大** [app.ts:35-36]：认证接口实际 < 1KB，攻击者可发 10MB JSON 占用内存。建议全局改 1MB 或对 auth 路由单独设 4KB。
- [x] [Review][Patch] **L11 — helmet CSP 默认配置可能阻断 blob 验证码** [app.ts:17]：默认 `img-src 'self'` 不允许 `blob:`，生产环境若同源托管前端会阻断验证码图片。建议显式配置 `img-src 'self' blob: data:`。
- [ ] [Review][Patch] **L12 — CORS 仅支持单 origin** [config/env.ts:25, app.ts:31-34]：`CORS_ORIGIN` 为 `str()`，多前端域名场景受限。建议改为数组或函数式校验。
- [x] [Review][Patch] **L13 — 已登录用户可调用 getCaptcha** [auth.controller.ts:151-184]：已登录态下仍生成并覆盖 session.captcha，无业务意义且可能被滥用。建议已登录态返回 403。
- [x] [Review][Patch] **L14 — SELECT \* 取出 password_hash** [users.model.ts:56-60, 95-99]：每次 `/me` 请求都把 hash 取到内存，若日志意外打印 user 对象则泄露。建议显式列出字段。
- [x] [Review][Patch] **L15 — svg-captcha 异常未捕获** [auth.controller.ts:167-184]：库内部异常（字体加载失败等）会冒泡到 errorHandler 返回 500。建议 try-catch 包裹并返回 503。

#### Dismissed（噪音或非 finding）

- Auditor #8 — `express.d.ts` 字段一致性（无偏差）
- Auditor #12 — Login/Register 未导入 ElMessage（实际已导入，撤回）
- Auditor #14 — regenerate 失败时 captcha 状态（行为合理，无 bug）
- Auditor #15 — `getStats` SUM 类型（不在 Epic 1 范围）
- Blind #19 — CORS 单 origin（已并入 L12）
- Blind #20 — helmet CSP（已并入 L11）

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

bcrypt 配置：使用 `bcryptjs`（纯 JS 实现，零编译依赖），调用异步 `bcrypt.hash(password, 10)` 和 `bcrypt.compare(password, hash)`。**注：2026-06-02 审查后决定保留 bcryptjs 替代原生 bcrypt，二者 API 与安全性等价，性能差异在 MVP 阶段可接受。**

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
