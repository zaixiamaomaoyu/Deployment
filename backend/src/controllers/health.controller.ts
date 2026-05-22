import { Request, Response } from 'express';
import { env } from '../config/env';

export class HealthController {
  static check(req: Request, res: Response): void {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.NODE_ENV,
      version: '1.0.0'
    });
  }
}