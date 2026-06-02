import { env } from './env';
export { env } from './env';
export { default } from './env';

// Re-export commonly used environment variables for convenience
export const {
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  CLAUDE_API_KEY,
  CLAUDE_API_URL,
  PORT,
  NODE_ENV,
  SESSION_SECRET,
  SESSION_MAX_AGE,
  CORS_ORIGIN,
  LOG_LEVEL,
  LOG_FORMAT
} = env;