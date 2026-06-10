import 'dotenv/config';
import { cleanEnv, str, port, url, num } from 'envalid';

export const env = cleanEnv(process.env, {
  // Database
  DB_HOST: str({ default: 'localhost' }),
  DB_PORT: port({ default: 3306 }),
  DB_NAME: str({ default: 'deployment_learning' }),
  DB_USER: str(),
  DB_PASSWORD: str(),

  // AI Provider（'claude' | 'kimi' | 'openai' | 'mock'）
  AI_PROVIDER: str({ default: 'mock' }),

  // OpenAI 兼容 API（智谱 GLM / Kimi / OpenAI）
  KIMI_API_KEY: str({ default: '' }),
  KIMI_API_URL: url({ default: 'https://open.bigmodel.cn/api/paas/v4' }),
  KIMI_MODEL: str({ default: 'glm-4-flash' }),

  // Claude API
  CLAUDE_API_KEY: str({ default: '' }),
  CLAUDE_API_URL: url({ default: 'https://api.anthropic.com/v1/messages' }),

  // Server
  PORT: port({ default: 3000 }),
  NODE_ENV: str({ choices: ['development', 'production', 'test'], default: 'development' }),

  // Session
  SESSION_SECRET: str(),
  SESSION_MAX_AGE: num({ default: 86400000 }),

  // CORS
  CORS_ORIGIN: str(),

  // Logging
  LOG_LEVEL: str({ choices: ['debug', 'info', 'warn', 'error'], default: 'info' }),
  LOG_FORMAT: str({ choices: ['dev', 'prod'], default: 'dev' })
});

export default env;