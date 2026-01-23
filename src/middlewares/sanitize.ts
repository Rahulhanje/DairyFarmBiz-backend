import { Request, Response, NextFunction } from 'express';

/**
 * Sanitize input by removing potentially dangerous characters
 */
const sanitizeValue = (value: unknown): unknown => {
  if (typeof value === 'string') {
    // Remove null bytes
    let sanitized = value.replace(/\0/g, '');
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    // Remove MongoDB operators (prevent NoSQL injection)
    sanitized = sanitized.replace(/^\$/, '');
    
    return sanitized;
  }
  
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  
  if (value !== null && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      // Skip keys starting with $ (MongoDB operators)
      if (!key.startsWith('$')) {
        sanitized[key] = sanitizeValue(val);
      }
    }
    return sanitized;
  }
  
  return value;
};

/**
 * Input sanitization middleware
 * Sanitizes request body, query, and params
 */
export const sanitizeInput = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeValue(req.query) as typeof req.query;
  }
  
  if (req.params) {
    req.params = sanitizeValue(req.params) as typeof req.params;
  }
  
  next();
};

/**
 * Prevent parameter pollution
 * Ensures query parameters are not arrays when they shouldn't be
 */
export const preventParamPollution = (allowedDuplicates: string[] = []) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (req.query) {
      for (const [key, value] of Object.entries(req.query)) {
        if (Array.isArray(value) && !allowedDuplicates.includes(key)) {
          // Take only the last value
          req.query[key] = value[value.length - 1];
        }
      }
    }
    next();
  };
};
