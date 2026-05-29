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
