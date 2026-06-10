import { Response, Request } from 'express';
import { logger } from '../utils/logger';

/**
 * SSE（Server-Sent Events）辅助函数
 *
 * 提供 SSE 响应头设置、数据帧格式化、错误发送、结束信号等辅助功能
 */

/**
 * 设置 SSE 必需的响应头
 *
 * 必须在发送任何 SSE 数据之前调用
 *
 * @param res - Express Response 对象
 */
export function setSSEHeaders(res: Response): void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // Nginx 代理场景禁用缓冲
  });
}

/**
 * 发送 SSE 数据帧
 *
 * 格式化 JSON 数据为 SSE data: 格式
 *
 * @param res - Express Response 对象
 * @param data - 要发送的数据（将被 JSON 序列化）
 */
export function sendSSEData(res: Response, data: unknown): void {
  const json = typeof data === 'string' ? data : JSON.stringify(data);
  res.write(`data: ${json}\n\n`);
}

/**
 * 发送 SSE 错误事件
 *
 * @param res - Express Response 对象
 * @param message - 错误消息
 */
export function sendSSEError(res: Response, message: string): void {
  sendSSEData(res, { error: message });
}

/**
 * 发送 SSE 结束信号
 *
 * 发送 [DONE] 标记流结束，然后关闭连接
 *
 * @param res - Express Response 对象
 */
export function sendSSEEnd(res: Response): void {
  res.write('data: [DONE]\n\n');
  res.end();
}

/**
 * 注册客户端断连处理
 *
 * 当客户端断开连接时，调用 abortController 中止 Claude API 流
 *
 * @param req - Express Request 对象
 * @param abortController - 中止控制器
 */
export function registerClientDisconnect(
  req: Request,
  abortController: AbortController
): void {
  req.on('close', () => {
    logger.info('客户端断开连接，中止 Claude 流');
    abortController.abort();
  });
}
