import { Router } from 'express';
import { signup, login, getMe } from './auth.controller';
import { signupValidation, loginValidation } from './auth.validation';
import { validate } from '../../middlewares/validate';
import { authenticate } from '../../middlewares/auth';
import { authRateLimiter } from '../../middlewares/rateLimiter';

const router = Router();

// Public routes (with stricter rate limiting)
router.post('/signup', authRateLimiter, validate(signupValidation), signup);
router.post('/login', authRateLimiter, validate(loginValidation), login);

// Protected routes
router.get('/me', authenticate, getMe);

export default router;
