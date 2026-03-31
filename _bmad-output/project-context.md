---
project_name: 'Deployment'
user_name: 'maomaoyu'
date: '2026-03-31'
sections_completed:
  ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'quality_rules', 'workflow_rules', 'anti_patterns']
status: 'complete'
rule_count: 7
optimized_for_llm: true
---

# 项目上下文（AI 代理指南）

_本文件包含 AI 代理在实现代码时必须遵循的关键规则和模式。重点关注容易被忽略的细节。_

---

## 技术栈与版本

### 前端

| 技术 | 版本 | 用途 |
|-----|------|------|
| Vue | 3.x | 前端框架 |
| TypeScript | 5.x | 类型安全 |
| Vite | 5.x | 构建工具 |
| Element Plus | 最新 | UI 组件库 |
| Pinia | 最新 | 状态管理 |
| Vue Router | 4.x | 路由管理 |
| Axios | 最新 | HTTP 客户端 |

### 后端

| 技术 | 版本 | 用途 |
|-----|------|------|
| Express | 4.x | Web 框架 |
| TypeScript | 5.x | 类型安全 |
| mysql2 | 3.x | MySQL 驱动（支持 Promise + 连接池） |
| @anthropic-ai/sdk | 最新 | Claude AI 集成 |
| express-session | 最新 | Session 管理 |
| cors | 最新 | 跨域支持 |
| dotenv | 最新 | 环境变量 |

### 数据库

- **MySQL 8.x** — 主数据库

---

## 关键实现规则

### 语言特定规则

#### TypeScript 配置要求

```typescript
// tsconfig.json 关键配置
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,                    // 必须开启严格模式
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true                     // Vite 前端项目使用
  }
}
```

#### 导入/导出模式

```typescript
// ✅ 推荐：使用类型导入
import type { Ref } from 'vue'
import type { User, Content } from '@/types'

// ✅ 推荐：命名导出
export const useUserStore = defineStore('user', () => { ... })
export type { User, Content }

// ❌ 避免：默认导出（组件文件除外）
// export default ...
```

#### 错误处理模式

```typescript
// ✅ 后端 API 错误处理
import { Request, Response, NextFunction } from 'express'

// 统一错误响应格式
interface ApiError {
  code: string
  message: string
  details?: unknown
}

// 错误处理中间件
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error(err)
  res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: '服务器内部错误'
  })
}

// ✅ 前端 API 调用错误处理
try {
  const response = await api.get('/content')
  return response.data
} catch (error) {
  if (axios.isAxiosError(error)) {
    ElMessage.error(error.response?.data?.message || '请求失败')
  }
  throw error
}
```

### 框架特定规则

#### Vue 3 组合式 API 模式

```typescript
// ✅ 推荐：使用 <script setup> 语法
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const loading = ref(false)

// 响应式数据
const content = ref<Content | null>(null)

// 计算属性
const isEmpty = computed(() => !content.value)

// 生命周期
onMounted(async () => {
  loading.value = true
  content.value = await fetchContent()
  loading.value = false
})
</script>
```

#### Pinia 状态管理

```typescript
// ✅ 推荐：使用 setup store 语法
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useContentStore = defineStore('content', () => {
  // 状态
  const items = ref<Content[]>([])
  const loading = ref(false)

  // 计算属性
  const count = computed(() => items.value.length)

  // 方法
  async function fetchAll() {
    loading.value = true
    items.value = await api.getContents()
    loading.value = false
  }

  return { items, loading, count, fetchAll }
})
```

#### Vue Router 路由配置

```typescript
// ✅ 推荐：路由懒加载
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/content/:id',
    component: () => import('@/views/ContentDetail.vue'),
    props: true
  },
  {
    path: '/admin',
    component: () => import('@/views/admin/Layout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  }
]
```

#### Express 路由组织

```typescript
// ✅ 推荐：路由模块化
// routes/content.ts
import { Router } from 'express'
import { ContentController } from '@/controllers/content'

const router = Router()
const controller = new ContentController()

router.get('/', controller.list)
router.get('/:id', controller.getById)
router.post('/', controller.create)
router.put('/:id', controller.update)
router.delete('/:id', controller.delete)

export default router
```

#### Express 中间件模式

```typescript
// ✅ 推荐：认证中间件
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.session?.userId) {
    return res.status(401).json({
      code: 'UNAUTHORIZED',
      message: '请先登录'
    })
  }
  next()
}

// ✅ 推荐：管理员权限中间件
export const adminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = await getUserById(req.session.userId)
  if (!user || user.role !== 'admin') {
    return res.status(403).json({
      code: 'FORBIDDEN',
      message: '无权限访问'
    })
  }
  next()
}
```

### 测试规则

#### 测试框架选择

| 层级 | 框架 | 用途 |
|-----|------|------|
| 前端单元测试 | Vitest | Vue 组件、工具函数测试 |
| 前端组件测试 | @vue/test-utils | Vue 组件渲染测试 |
| 后端单元测试 | Vitest | API、服务层测试 |
| E2E 测试 | Playwright | 端到端流程测试 |

#### 测试组织结构

```
frontend/
├── src/
│   ├── components/
│   │   └── __tests__/           # 组件测试就近放置
│   │       └── Button.spec.ts
│   └── utils/
│       └── __tests__/
│           └── format.spec.ts

backend/
├── src/
│   ├── services/
│   │   └── __tests__/
│   │       └── ai-service.spec.ts
│   └── controllers/
│       └── __tests__/
│           └── content.spec.ts
```

#### 测试编写模式

```typescript
// ✅ 推荐：前端组件测试
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import ContentCard from '@/components/ContentCard.vue'

describe('ContentCard', () => {
  it('renders content title correctly', () => {
    const wrapper = mount(ContentCard, {
      props: {
        content: { id: 1, title: '测试标题' }
      }
    })
    expect(wrapper.text()).toContain('测试标题')
  })
})

// ✅ 推荐：后端服务测试
import { describe, it, expect } from 'vitest'
import { AIService } from '@/services/ai-service'

describe('AIService', () => {
  it('returns streaming response', async () => {
    const service = new AIService()
    const chunks: string[] = []

    for await (const chunk of service.streamChat('测试问题')) {
      chunks.push(chunk)
    }

    expect(chunks.length).toBeGreaterThan(0)
  })
})
```

#### Mock 规则

```typescript
// ✅ 推荐：Mock 外部依赖
vi.mock('@/api/content', () => ({
  fetchContent: vi.fn().mockResolvedValue({ id: 1, title: 'Mock 内容' })
}))

// ✅ 推荐：Mock AI 服务（避免真实调用）
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      stream: vi.fn().mockImplementation(async function* () {
        yield { type: 'content_block_delta', delta: { text: 'Mock AI 响应' } }
      })
    }
  }))
}))
```

### 代码质量与风格规则

#### 文件命名约定

| 类型 | 命名规则 | 示例 |
|-----|---------|------|
| Vue 组件 | PascalCase | `ContentCard.vue`、`UserList.vue` |
| 组合式函数 | camelCase + use 前缀 | `useContent.ts`、`useAuth.ts` |
| Store | camelCase + Store 后缀 | `useUserStore.ts` |
| 工具函数 | camelCase | `formatDate.ts`、`validateInput.ts` |
| 类型定义 | camelCase | `user.ts`、`content.ts` |
| 测试文件 | 源文件名 + .spec | `ContentCard.spec.ts` |

#### 目录结构规范

```
frontend/
├── src/
│   ├── api/              # API 请求封装
│   ├── assets/           # 静态资源
│   ├── components/       # 公共组件
│   ├── composables/      # 组合式函数
│   ├── router/           # 路由配置
│   ├── stores/           # Pinia 状态管理
│   ├── types/            # TypeScript 类型定义
│   ├── utils/            # 工具函数
│   └── views/            # 页面组件

backend/
├── src/
│   ├── config/           # 配置文件
│   ├── controllers/      # 控制器
│   ├── middlewares/      # 中间件
│   ├── models/           # 数据模型
│   ├── routes/           # 路由定义
│   ├── services/         # 业务逻辑
│   ├── types/            # TypeScript 类型定义
│   └── utils/            # 工具函数
```

#### 注释规范

```typescript
// ✅ 推荐：复杂逻辑添加注释
/**
 * 计算用户的技能雷达图数据
 * @param progress 用户学习进度
 * @returns 6 个领域的技能等级数组
 */
export function calculateSkillRadar(progress: UserProgress): SkillLevel[] {
  // ...
}

// ✅ 推荐：TODO 注释格式
// TODO(maomaoyu): 添加缓存机制提升性能
// FIXME: 边界情况处理不完整

// ❌ 避免：无意义的注释
// 这是一个函数
function doSomething() {}
```

#### Element Plus 使用规范

```typescript
// ✅ 推荐：按需导入组件
import { ElMessage, ElMessageBox } from 'element-plus'

// ✅ 推荐：消息提示
ElMessage.success('操作成功')
ElMessage.error('操作失败')

// ✅ 推荐：确认对话框
ElMessageBox.confirm('确定删除吗？', '提示', {
  confirmButtonText: '确定',
  cancelButtonText: '取消',
  type: 'warning'
})
```

### 开发工作流规则

#### Git 分支命名

| 分支类型 | 命名规则 | 示例 |
|---------|---------|------|
| 功能分支 | feature/功能描述 | `feature/ai-assistant` |
| 修复分支 | fix/问题描述 | `fix/login-error` |
| 热修复分支 | hotfix/问题描述 | `hotfix/session-expire` |

#### 提交信息格式

```
<类型>: <简短描述>

[可选：详细描述]

类型列表：
- feat: 新功能
- fix: 修复 bug
- docs: 文档更新
- style: 代码格式调整（不影响功能）
- refactor: 重构
- test: 测试相关
- chore: 构建/工具相关
```

**示例：**
```
feat: 添加 AI 助手流式响应功能

- 实现 SSE 流式输出
- 添加对话历史记录
- 集成 Claude API
```

#### 环境配置

```bash
# 后端 .env 配置
PORT=3000
NODE_ENV=development

# 数据库
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=deployment_learning

# 微信 OAuth
WECHAT_APP_ID=
WECHAT_APP_SECRET=

# Claude API
ANTHROPIC_API_KEY=

# Session
SESSION_SECRET=your-session-secret
```

#### API 响应格式

```typescript
// ✅ 成功响应
{
  "code": "SUCCESS",
  "data": { ... },
  "message": "操作成功"
}

// ✅ 错误响应
{
  "code": "VALIDATION_ERROR",
  "message": "参数验证失败",
  "details": { ... }
}

// ✅ 分页响应
{
  "code": "SUCCESS",
  "data": {
    "items": [ ... ],
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}
```

### 关键避坑规则

#### 反模式（必须避免）

```typescript
// ❌ 避免：直接修改 props
props: ['content'],
mounted() {
  this.content.title = '新标题'  // 错误！
}

// ✅ 正确：使用 emit 或本地副本
const localContent = ref({ ...props.content })

// ❌ 避免：在 template 中使用复杂表达式
<div>{{ items.filter(i => i.active).map(i => i.name).join(', ') }}</div>

// ✅ 正确：使用计算属性
const activeNames = computed(() =>
  items.value.filter(i => i.active).map(i => i.name).join(', ')
)
```

#### 边界情况处理

```typescript
// ✅ 处理空值
const content = ref<Content | null>(null)
const title = computed(() => content.value?.title ?? '未命名')

// ✅ 处理数组边界
const firstItem = items.value[0] ?? null
const lastItem = items.value.at(-1) ?? null

// ✅ 处理 API 超时
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 5000)

try {
  const response = await api.get('/content', {
    signal: controller.signal
  })
} finally {
  clearTimeout(timeoutId)
}
```

#### 安全规则

```typescript
// ❌ 避免：直接拼接 SQL
const query = `SELECT * FROM users WHERE id = ${userId}`

// ✅ 正确：使用参数化查询
const [rows] = await pool.execute(
  'SELECT * FROM users WHERE id = ?',
  [userId]
)

// ❌ 避免：直接渲染用户输入
<div v-html="userInput"></div>

// ✅ 正确：使用文本插值
<div>{{ userInput }}</div>

// ✅ 敏感数据处理：不记录密码、密钥等敏感信息
console.log('User logged in:', { id: user.id })  // 不输出 token
```

#### 性能陷阱

```typescript
// ❌ 避免：在循环中调用 API
for (const id of ids) {
  await api.get(`/content/${id}`)
}

// ✅ 正确：批量请求
const contents = await api.post('/content/batch', { ids })

// ❌ 避免：不必要的响应式数据
const hugeList = ref(largeArray)  // 整个数组变成响应式

// ✅ 正确：使用 shallowRef 或 markRaw
const hugeList = shallowRef(largeArray)

// ❌ 避免：重复计算
items.value.filter(...).filter(...)  // 每次渲染都重新计算

// ✅ 正确：缓存计算结果
const filteredItems = computed(() => items.value.filter(...))
```

#### AI 流式输出陷阱

```typescript
// ❌ 避免：不处理流中断
for await (const chunk of stream) {
  res.write(chunk)
}

// ✅ 正确：处理流中断和错误
try {
  for await (const chunk of stream) {
    res.write(chunk)
  }
  res.end()
} catch (error) {
  console.error('Stream error:', error)
  res.write('\n[错误：AI 服务暂时不可用]')
  res.end()
}
```

---

## 使用指南

### AI 代理使用

- 实现代码前必须阅读此文件
- 严格遵守所有规则
- 存疑时，选择更严格的方案
- 发现新模式时更新此文件

### 维护指南

- 保持文件精简，专注于代理需求
- 技术栈变更时及时更新
- 每季度审查并移除过时规则
- 移除逐渐变得显而易见的规则

**最后更新：** 2026-03-31

