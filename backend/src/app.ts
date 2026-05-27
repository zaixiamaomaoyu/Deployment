import express from 'express';
import cors from 'cors';
import session from 'express-session';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';

const app = express();

// 安全中间件
app.use(helmet());

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 100个请求
  message: { error: '请求过于频繁，请稍后再试' }
});
app.use(limiter);

// 启用Gzip压缩
app.use(compression());

// 基础中间件
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session 配置
app.use(session({
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: env.SESSION_MAX_AGE
  }
}));

// 路由
app.use('/api', healthRoutes);
app.use('/api', authRoutes);

// 404 处理
app.use(notFoundHandler);

// 错误处理中间件（必须放在最后）
app.use(errorHandler);

logger.info('✅ Express应用初始化完成');

export default app;