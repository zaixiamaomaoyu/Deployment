## Deferred from: code review of 2-1-知识内容列表页 (2026-05-29)

- ContentsModel JSON parse 无 try/catch [backend/src/models/contents.model.ts] — 非本次变更引入，数据库已有数据时若 JSON 字段损坏会导致查询 500 错误
- findAll 允许负 offset [backend/src/models/contents.model.ts] — 非本次变更引入，page=0 时 offset=-1 可能导致 SQL 错误
- search LIKE 通配符未转义 [backend/src/models/contents.model.ts] — 非本次变更引入，用户输入 `%` 或 `_` 会导致 LIKE 行为异常
