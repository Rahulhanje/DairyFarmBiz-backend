import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

interface RequestLog {
  method: string;
  url: string;
  ip: string;
  userId?: string;
  timestamp: Date;
  duration?: number;
  statusCode?: number;
}

/**
 * Request logger middleware
 * Logs all incoming requests with timing information
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  // Create initial log entry
  const logEntry: RequestLog = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    timestamp: new Date(),
  };

  // Log response when finished
  res.on('finish', () => {
    logEntry.duration = Date.now() - startTime;
    logEntry.statusCode = res.statusCode;

    // Color code based on status
    const statusColor = res.statusCode >= 500 ? '\x1b[31m' // Red
      : res.statusCode >= 400 ? '\x1b[33m' // Yellow
      : res.statusCode >= 300 ? '\x1b[36m' // Cyan
      : '\x1b[32m'; // Green

    const resetColor = '\x1b[0m';

    if (config.nodeEnv === 'development') {
      console.log(
        `${logEntry.method} ${logEntry.url} ${statusColor}${logEntry.statusCode}${resetColor} - ${logEntry.duration}ms`
      );
    }
  });

  next();
};
