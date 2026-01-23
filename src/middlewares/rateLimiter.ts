import { Request, Response, NextFunction } from 'express';
import { TooManyRequestsError } from '../utils/ApiError';

interface RateLimitEntry {
  count: number;
  firstRequest: number;
}

const requestCounts = new Map<string, RateLimitEntry>();

interface RateLimitOptions {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  message?: string;      // Custom error message
}

const defaultOptions: RateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,          // 100 requests per window
  message: 'Too many requests, please try again later',
};

/**
 * Rate limiter middleware
 * Limits requests per IP address
 */
export const rateLimiter = (options: Partial<RateLimitOptions> = {}) => {
  const opts = { ...defaultOptions, ...options };

  // Cleanup old entries every minute
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of requestCounts.entries()) {
      if (now - value.firstRequest > opts.windowMs) {
        requestCounts.delete(key);
      }
    }
  }, 60 * 1000);

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    const entry = requestCounts.get(ip);

    if (!entry) {
      // First request from this IP
      requestCounts.set(ip, { count: 1, firstRequest: now });
      next();
      return;
    }

    // Check if window has expired
    if (now - entry.firstRequest > opts.windowMs) {
      // Reset counter
      requestCounts.set(ip, { count: 1, firstRequest: now });
      next();
      return;
    }

    // Increment counter
    entry.count++;

    // Check if limit exceeded
    if (entry.count > opts.maxRequests) {
      const retryAfter = Math.ceil((opts.windowMs - (now - entry.firstRequest)) / 1000);
      res.setHeader('Retry-After', retryAfter);
      res.setHeader('X-RateLimit-Limit', opts.maxRequests);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', new Date(entry.firstRequest + opts.windowMs).toISOString());
      
      next(new TooManyRequestsError(opts.message));
      return;
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', opts.maxRequests);
    res.setHeader('X-RateLimit-Remaining', opts.maxRequests - entry.count);
    res.setHeader('X-RateLimit-Reset', new Date(entry.firstRequest + opts.windowMs).toISOString());

    next();
  };
};

/**
 * Stricter rate limiter for auth routes
 */
export const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,           // 10 requests per window
  message: 'Too many authentication attempts, please try again after 15 minutes',
});

/**
 * General API rate limiter
 */
export const apiRateLimiter = rateLimiter({
  windowMs: 60 * 1000,  // 1 minute
  maxRequests: 60,       // 60 requests per minute
  message: 'Too many requests, please slow down',
});
