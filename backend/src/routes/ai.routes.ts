import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AIController } from '../controllers/ai.controller';

const router = Router();

/**
 * AI 接口独立速率限制
 * 每分钟 20 次请求，比全局限制更严格
 */
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 分钟
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 'RATE_LIMITED',
    message: '请求过于频繁，请稍后再试',
  },
});

// POST /ai/chat - AI 对话（SSE 流式响应）
router.post('/ai/chat', aiLimiter, AIController.chat);

// GET /ai/history - 获取对话历史（不加 aiLimiter，非 AI 生成调用）
router.get('/ai/history', AIController.getHistory);

// DELETE /ai/history - 清空对话历史（不加 aiLimiter，非 AI 生成调用）
router.delete('/ai/history', AIController.clearHistory);

export default router;
