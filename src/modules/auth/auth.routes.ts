import { Router } from 'express';
import { 
  signup, 
  login, 
  getMe, 
  updateProfile, 
  updatePassword,
  sendVerificationOTP,
  verifyEmail,
  forgotPassword,
  resetPassword
} from './auth.controller';
import { 
  signupValidation, 
  loginValidation, 
  updateProfileValidation, 
  updatePasswordValidation,
  sendOTPValidation,
  verifyEmailValidation,
  resetPasswordValidation
} from './auth.validation';
import { validate } from '../../middlewares/validate';
import { authenticate } from '../../middlewares/auth';
import { authRateLimiter } from '../../middlewares/rateLimiter';

const router = Router();

// Public routes (with stricter rate limiting)
router.post('/signup', authRateLimiter, validate(signupValidation), signup);
router.post('/login', authRateLimiter, validate(loginValidation), login);
router.post('/send-verification-otp', authRateLimiter, validate(sendOTPValidation), sendVerificationOTP);
router.post('/verify-email', authRateLimiter, validate(verifyEmailValidation), verifyEmail);
router.post('/forgot-password', authRateLimiter, validate(sendOTPValidation), forgotPassword);
router.post('/reset-password', authRateLimiter, validate(resetPasswordValidation), resetPassword);

// Protected routes
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, validate(updateProfileValidation), updateProfile);
router.put('/password', authenticate, validate(updatePasswordValidation), updatePassword);

export default router;
