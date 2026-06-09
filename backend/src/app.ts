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
import contentRoutes from './routes/content.routes';
import favoritesRoutes from './routes/favorites.routes';
import aiRoutes from './routes/ai.routes';

const app = express();

// 信任反向代理（生产环境必需，让 req.ip / req.protocol 正确识别客户端）
app.set('trust proxy', 1);

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));

// 速率限制（dev 环境放宽以避免开发期间误触；prod 保持严格）
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: env.NODE_ENV === 'production' ? 100 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 'RATE_LIMITED', message: '请求过于频繁，请稍后再试' }
});
app.use(limiter);

// 启用Gzip压缩
app.use(compression());

// 基础中间件
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

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
app.use('/api', contentRoutes);
app.use('/api', favoritesRoutes);
app.use('/api', aiRoutes);

// 404 处理
app.use(notFoundHandler);

// 错误处理中间件（必须放在最后）
app.use(errorHandler);

logger.info('✅ Express应用初始化完成');

export default app;