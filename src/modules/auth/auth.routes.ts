import { Router } from 'express';
import { signup, login, getMe } from './auth.controller';
import { signupValidation, loginValidation } from './auth.validation';
import { validate } from '../../middlewares/validate';
import { authenticate } from '../../middlewares/auth';

const router = Router();

// Public routes
router.post('/signup', validate(signupValidation), signup);
router.post('/login', validate(loginValidation), login);

// Protected routes
router.get('/me', authenticate, getMe);

export default router;
