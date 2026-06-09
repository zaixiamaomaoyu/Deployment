## Deferred from: code review of 3-4-步骤指南展示 (2026-06-09)

- **测试覆盖不足（代码块、复制按钮）** [frontend/src/views/__tests__/StepGuideView.spec.ts] — 功能未实现，待 Story 3-5 补全后补充测试
- **`vps-baota` 方案缺少 `externalUrl` 字段** [frontend/src/data/deployment-plans.ts] — 数据预存问题，非本变更引入
- **空数组/undefined 的防御性渲染** [frontend/src/views/StepGuideView.vue] — 数据已有类型约束保障

## Deferred from: code review of 3-2-决策树数据设计 (2026-06-03)

- **`depthOf`/`collectLeafDepths` 测试工具函数算法脆弱** [frontend/src/data/__tests__/decision-tree-data.spec.ts:9-30] — 每次递归 `new Set(visited)` 致环检测在工具函数内失效；测试内部辅助函数，且独立 dfs 用例已守护环检测不变量
- **环检测算法在 DAG（共享子树）场景下理论漏报** [frontend/src/data/__tests__/decision-tree-data.spec.ts:61-76] — 全局 `visited` 剪枝与 `path.includes` 判环在 DAG 中可能漏报；当前数据为纯树结构，AC #4 未要求支持 DAG
- **`useDecisionTree.estimateMaxDepth` 自环场景下 progress 估算失真** [frontend/src/composables/useDecisionTree.ts:19-29] — Story 3-1 既有逻辑，本 Story 数据校验测试已守护「无环」不变量，未引入新风险

## Deferred from: code review of 2-6-收藏列表页 (2026-06-03)

- **FavoritesModel.toggle 非事务 read-then-write 并发竞态** [backend/src/models/favorites.model.ts:80-99] — `isFavorited` 与 `add/remove` 之间无事务无锁，多端并发 TOCTOU。Story 2-5 遗留，需改原子 SQL 或事务；本 Story 2-6 改动未触及该函数主体
- **parsePositiveContentId 上限 2147483647 与 schema 不对齐** [backend/src/controllers/favorites.controller.ts:11] — 若 `contents.id` 为 `INT UNSIGNED`（max 4294967295），上限应同步放宽；需先核对 schema 后统一调整
- **FavoritesModel.getStats 未挂载路由但代码留存** [backend/src/models/favorites.model.ts:101-124] — 当前未暴露，未来若不小心暴露管理员路由会泄露全站统计；建议清理或加 `@adminOnly`

## Deferred from: code review of 2-5-内容收藏功能 (2026-06-02)

- 并发 toggle 唯一索引冲突 / `FavoritesModel.toggle` 非事务 [backend/src/models/favorites.model.ts:80-99] — FavoritesModel 在 story 开始前已就位，spec 明确禁止重新实现；并发 toggle 在 MySQL 唯一索引下偶发 500，需改用事务或 `INSERT ... ON DUPLICATE KEY UPDATE`
- 路由层缺鉴权中间件 [backend/src/routes/favorites.routes.ts] — 项目既有模式为 controller 内 `req.session?.userId` 检查（与 auth.controller 一致），抽出 `requireAuth` 中间件属全站重构
- CSRF 防护缺失 [backend/src/routes/favorites.routes.ts:7] — 全站写操作均依赖 cookie session，需统一引入 csurf 或 `SameSite=Strict`；非本 story 引入风险
- toggle 接口无速率限制 [backend/src/controllers/favorites.controller.ts:14-40] — 全站未对写接口做 per-user rate limit
- `FavoritesModel.add` 用 `error.message.includes('Duplicate entry')` 判重 [backend/src/models/favorites.model.ts:24-30] — 多语言 MySQL 不可靠；应改用 `error.code === 'ER_DUP_ENTRY'`（FavoritesModel 既有实现）
- `FavoritesModel.findByUser` 分页参数未校验 [backend/src/models/favorites.model.ts:54-75] — 属 Story 2-6 收藏列表页范围
- axios 实例分散在每个 API 文件 [frontend/src/api/favorites.ts:3-6] — contents.ts / auth.ts 同样模式；统一抽取 `src/api/http.ts` 属全局重构
- `isMounted` ref 模式 vs `AbortController` [frontend/src/views/ContentDetailView.vue:18] — Story 2-4 引入的既有模式，重构超出本 story 范围
- axios baseURL 生产构建回退到 `localhost:3000` [frontend/src/api/favorites.ts:4] — contents.ts 同样问题；属全站部署配置问题
- 路由顺序敏感（未来 `/favorites` 与 `/favorites/:contentId` 冲突） [backend/src/routes/favorites.routes.ts] — 当前只有两条路由无冲突，Story 2-6 扩展时再考虑

## Deferred from: code review of 2-1-知识内容列表页 (2026-05-29)

- ContentsModel JSON parse 无 try/catch [backend/src/models/contents.model.ts] — 非本次变更引入，数据库已有数据时若 JSON 字段损坏会导致查询 500 错误
- findAll 允许负 offset [backend/src/models/contents.model.ts] — 非本次变更引入，page=0 时 offset=-1 可能导致 SQL 错误
- search LIKE 通配符未转义 [backend/src/models/contents.model.ts] — 非本次变更引入，用户输入 `%` 或 `_` 会导致 LIKE 行为异常

## Deferred from: code review of 2-3-内容搜索功能 (2026-05-29)

- `<mark>` 元素缺少 `aria-label`，不利于无障碍访问 [frontend/src/components/HighlightText.vue:25] — 非 AC 要求
- `getContents` 使用多个位置参数，扩展性较差 [frontend/src/api/contents.ts:32-50] — Story 已指定该签名
- `loadData` 硬编码 `page=1`，后续引入分页状态时需调整 [frontend/src/views/ContentsView.vue:56-62] — 分页尚未实现
- 缺少特殊正则字符的端到端测试 [backend/src/controllers/__tests__/content.controller.test.ts] — 测试覆盖度问题
- 缺少 XSS payload 的显式安全测试 [backend/src/controllers/__tests__/content.controller.test.ts] — 测试覆盖度问题

## Deferred from: code review of 2-4-内容详情页 (2026-06-01)

- findNeighbors 查询未考虑内容可见性/权限 [backend/src/models/contents.model.ts] — 未过滤未发布/已删除内容，pre-existing 设计问题
- domainColors / domainLabels 映射多处重复定义 [frontend/src/views/ContentDetailView.vue] — ContentCard.vue 和 ContentDetailView.vue 中重复，pre-existing 代码重复

## Deferred from: code review of spec-auth-password-captcha-login (2026-06-02)

- **D4 + H6 — 生产 MemoryStore 改造为 Redis Store** [backend/src/app.ts:39] — 用户决策：推迟到 Epic 7 后台管理统一处理；MVP 阶段保持单实例并在文档中标注限制
- **M1（部分）— 注册接口主动暴露 USERNAME_EXISTS** [backend/src/controllers/auth.controller.ts:102-105] — 用户决策：保持 409 响应优先 UX，接受用户名可枚举风险；M1 时序攻击部分仍需修复
- **D1 — bcryptjs vs bcrypt** [backend/src/controllers/auth.controller.ts:2] — 用户决策：保留 bcryptjs，需同步更新 spec Design Notes
- **D3 — CSRF 防护** [backend/src/app.ts:39-49] — 用户决策：保持 sameSite=lax 现状，spec 未要求
