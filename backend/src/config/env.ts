import 'dotenv/config';
import { cleanEnv, str, port, url, num } from 'envalid';

export const env = cleanEnv(process.env, {
  // Database
  DB_HOST: str({ default: 'localhost' }),
  DB_PORT: port({ default: 3306 }),
  DB_NAME: str({ default: 'deployment_learning' }),
  DB_USER: str(),
  DB_PASSWORD: str(),

  // WeChat
  WECHAT_APP_ID: str(),
  WECHAT_APP_SECRET: str(),
  WECHAT_REDIRECT_URI: url(),

  // Claude API
  CLAUDE_API_KEY: str(),
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