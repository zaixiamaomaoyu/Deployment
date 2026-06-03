# Test Automation Summary — Story 2-6 收藏列表页

生成时间：2026-06-03

## Generated Tests

### 后端 API 测试（Jest + Supertest）

#### 单元测试
- [x] `backend/src/controllers/__tests__/favorites.controller.test.ts` — Controller 单元测试（mock model 层）
  - toggle / getStatus / list 三方法共 **36 用例**
  - 覆盖 401 / 400 / 500 / 200 全分支 + 各种非法输入（0、-1、abc、1e2、0x10、空白、空字符串、数组）

#### 集成测试
- [x] `backend/src/routes/__tests__/favorites.routes.integration.test.ts` — 真实 Express 实例 + 路由 + 中间件链路
  - **17 用例**：未登录 401、默认参数、自定义 page/limit、9 种非法 query、数组 query、边界值 page=100&limit=100、model 抛错 500、响应字段断言

### 前端组件测试（Vitest + @vue/test-utils）

- [x] `frontend/src/views/__tests__/FavoritesView.spec.ts` — 组件级渲染 + 行为测试
  - **7 用例**：
    - 挂载后调用 listFavorites(page=1, limit=10, signal)
    - 空收藏渲染空状态文案（AC #4）
    - 点击「加载更多」递增 page 并追加合并（AC #8）
    - toggleFavorite removed 时从列表移除该卡片（AC #3）
    - 快速连续调用同一内容只触发一次（AC #9 防竞态）
    - API 401 触发 logout + 跳转登录页（AC #6）
    - handleCardClick 跳转到 /contents/:id（AC #2）

### E2E 测试（Playwright）

- [x] `tests/e2e/favorites.spec.ts` — 浏览器端到端流程（route 拦截模拟 API）
  - **6 用例**：
    - AC #4 空收藏列表显示空状态提示
    - AC #1 #2 已登录显示卡片列表（含标题/领域/层级/简介）
    - AC #3 点击取消收藏按钮移除卡片 + ElMessage 提示
    - AC #5 未登录用户访问 /favorites 重定向到登录页（携带 redirect query）
    - AC #8 收藏数 > limit 时显示「加载更多」按钮
    - AC #8 点击「加载更多」追加显示第二页（保留第一页）

## Coverage

### AC 覆盖矩阵

| AC | 单元测试 | 集成测试 | 组件测试 | E2E |
|----|---------|---------|---------|-----|
| #1 已登录显示收藏列表 | ✓ | ✓ | ✓ | ✓ |
| #2 卡片显示标题/领域/层级/简介 + 点击跳转 | — | — | ✓ (跳转) | ✓ |
| #3 点击取消收藏移除卡片 + ElMessage 提示 | — | — | ✓ | ✓ |
| #4 空状态 + 「去浏览内容」按钮 | — | — | ✓ | ✓ |
| #5 未登录重定向 + redirect query | — | — | — | ✓ |
| #6 401 Session 过期处理 | — | — | ✓ | — |
| #7 loading 状态 | — | — | — | — |
| #8 分页加载（>10 条） | — | — | ✓ | ✓ |
| #9 竞态防护 | — | — | ✓ | — |

### 文件覆盖

| 文件 | 测试覆盖 |
|------|---------|
| `backend/src/controllers/favorites.controller.ts` | 单元 + 集成 |
| `backend/src/routes/favorites.routes.ts` | 集成 |
| `backend/src/models/favorites.model.ts` | 单元（mock） |
| `frontend/src/views/FavoritesView.vue` | 组件 + E2E |
| `frontend/src/api/favorites.ts` | 组件（mock） |
| `frontend/src/router/index.ts` | E2E |

## 新增依赖

### 后端 (`backend/package.json` devDependencies)
- `supertest@^7.2.2` + `@types/supertest@^7.2.0`

### 前端 (`frontend/package.json` devDependencies)
- `vitest@^2`
- `@vue/test-utils`
- `jsdom@^22`

### 项目根 (`package.json` devDependencies)
- `@playwright/test`
- Chromium 浏览器（`npx playwright install chromium`）

### 配置文件
- `frontend/vitest.config.ts`
- `frontend/src/__tests__/setup.ts`（jsdom polyfill）
- `playwright.config.ts`

## 运行命令

```bash
# 后端测试（单元 + 集成）
cd backend && npx jest --testPathPatterns="favorites"

# 前端组件测试
cd frontend && npx vitest run

# E2E 测试（自动启动前端 dev server）
npx playwright test
```

## 测试发现的 Bug（已修复）

### ContentCard 缺失 `#extra` slot
- **严重度**: High（功能性）
- **现象**: FavoritesView 通过 `<template #extra>` 传入「取消收藏」按钮，但 ContentCard 模板中无对应命名 slot，按钮从未渲染到 DOM
- **发现方式**: Playwright E2E AC #3 测试无法找到「取消收藏」按钮（Vitest 组件测试因 stub ContentCard 而掩盖了此问题）
- **修复**: `frontend/src/components/ContentCard.vue` 在 `.card-footer` 中新增 `<slot name="extra" />`
- **教训**: 组件测试 stub 真实组件时，会跳过组件间的 slot 契约验证；E2E 测试能暴露此类集成缺陷

## Next Steps

- [ ] CI 集成：将三层测试加入 CI pipeline
- [ ] 测试数据 fixture：当前 E2E 用 page.route 拦截，未来可考虑建立 mock server 统一管理
- [ ] Story 2-7+ 复用：本 Story 建立的测试基础设施（vitest/playwright 配置）可直接复用
- [ ] 添加更多边界测试：网络断开、超时、并发请求场景
