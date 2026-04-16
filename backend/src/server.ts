import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 后端服务器运行在端口 ${PORT}`);
  console.log(`🌐 健康检查: http://localhost:${PORT}/health`);
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ 未处理拒绝:', error);
  process.exit(1);
});