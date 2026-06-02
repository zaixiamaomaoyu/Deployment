import 'express-session';

declare module 'express-session' {
  interface CaptchaData {
    text: string;
    expires: number;
    attempts: number;
  }

  interface SessionData {
    userId?: number;
    captcha?: CaptchaData;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        role: 'user' | 'admin';
      };
    }
  }
}

export {};
