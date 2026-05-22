import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  logger.info(`🚀 后端服务器运行在端口 ${PORT}`);
  logger.info(`🌐 健康检查: http://localhost:${PORT}/health`);
});

// 处理端口绑定错误
server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`❌ 端口 ${PORT} 已被占用，尝试使用端口 ${PORT + 1}`);
    const newServer = app.listen(PORT + 1, () => {
      logger.info(`🚀 后端服务器运行在端口 ${PORT + 1}`);
      logger.info(`🌐 健康检查: http://localhost:${PORT + 1}/health`);
    });

    newServer.on('error', (newError) => {
      logger.error('❌ 无法绑定到任何端口:', newError);
      process.exit(1);
    });
  } else {
    logger.error('❌ 服务器启动错误:', error);
    process.exit(1);
  }
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  logger.error('❌ 未捕获异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.error('❌ 未处理拒绝:', error);
  process.exit(1);
});

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('SIGTERM 收到，开始优雅关闭');
  server.close(() => {
    logger.info('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT 收到，开始优雅关闭');
  server.close(() => {
    logger.info('服务器已关闭');
    process.exit(0);
  });
});