import { describe, test, expect } from '@jest/globals';
import { env } from './env';

describe('Environment Variables', () => {
  test('should validate required environment variables', () => {
    // Mock process.env for testing
    const originalEnv = process.env;

    process.env = {
      ...originalEnv,
      DB_USER: 'test_user',
      DB_PASSWORD: 'test_password',
      WECHAT_APP_ID: 'test_app_id',
      WECHAT_APP_SECRET: 'test_secret',
      WECHAT_REDIRECT_URI: 'http://localhost:3000/callback',
      CLAUDE_API_KEY: 'test_claude_key',
      SESSION_SECRET: 'test_session_secret',
      CORS_ORIGIN: 'http://localhost:5173'
    };

    expect(() => {
      // This should not throw if all required env vars are set
      const testEnv = require('./env').env;
      expect(testEnv.DB_USER).toBe('test_user');
      expect(testEnv.DB_PASSWORD).toBe('test_password');
      expect(testEnv.WECHAT_APP_ID).toBe('test_app_id');
      expect(testEnv.CLAUDE_API_KEY).toBe('test_claude_key');
    }).not.toThrow();

    // Restore original env
    process.env = originalEnv;
  });

  test('should use default values for optional variables', () => {
    expect(env.DB_HOST).toBe('localhost');
    expect(env.DB_PORT).toBe(3306);
    expect(env.PORT).toBe(3000);
    expect(env.NODE_ENV).toBe('development');
    expect(env.LOG_LEVEL).toBe('info');
  });

  test('should validate NODE_ENV choices', () => {
    const originalEnv = process.env.NODE_ENV;

    process.env.NODE_ENV = 'invalid';
    expect(() => {
      const { cleanEnv, str } = require('envalid');
      cleanEnv(process.env, {
        NODE_ENV: str({ choices: ['development', 'production', 'test'] })
      });
    }).toThrow();

    process.env.NODE_ENV = originalEnv;
  });
});