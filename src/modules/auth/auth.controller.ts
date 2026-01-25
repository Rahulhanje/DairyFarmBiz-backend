import { Request, Response } from 'express';
import { authService } from './auth.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../../utils/responseHandler';
import { AuthRequest } from '../../types';

/**
 * @desc    Register new user
 * @route   POST /api/v1/auth/signup
 * @access  Public
 */
export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, phone, countryCode, role } = req.body;

  const result = await authService.signup({
    name,
    email,
    password,
    phone,
    countryCode,
    role,
  });

  sendCreated(res, result, 'User registered successfully');
});

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const result = await authService.login({ email, password });

  sendSuccess(res, result, 'Login successful');
});

/**
 * @desc    Get current user profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return sendSuccess(res, null, 'User not found', 404);
  }

  const user = await authService.getProfile(userId);

  sendSuccess(res, user, 'Profile fetched successfully');
});

/**
 * @desc    Update user profile
 * @route   PUT /api/v1/auth/profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id!;
  const { name, phone, countryCode } = req.body;

  const user = await authService.updateProfile(userId, { name, phone, countryCode });

  sendSuccess(res, user, 'Profile updated successfully');
});

/**
 * @desc    Update password
 * @route   PUT /api/v1/auth/password
 * @access  Private
 */
export const updatePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id!;
  const { currentPassword, newPassword } = req.body;

  await authService.updatePassword(userId, currentPassword, newPassword);

  sendSuccess(res, null, 'Password updated successfully');
});

/**
 * @desc    Send verification OTP
 * @route   POST /api/v1/auth/send-verification-otp
 * @access  Public
 */
export const sendVerificationOTP = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const result = await authService.sendVerificationOTP(email);

  sendSuccess(res, result, result.message);
});

/**
 * @desc    Verify email with OTP
 * @route   POST /api/v1/auth/verify-email
 * @access  Public
 */
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  const result = await authService.verifyEmail(email, otp);

  if (!result.success) {
    return sendSuccess(res, result, result.message, 400);
  }

  sendSuccess(res, result, result.message);
});

/**
 * @desc    Send password reset OTP
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const result = await authService.sendPasswordResetOTP(email);

  sendSuccess(res, result, result.message);
});

/**
 * @desc    Reset password with OTP
 * @route   POST /api/v1/auth/reset-password
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;

  const result = await authService.resetPassword(email, otp, newPassword);

  if (!result.success) {
    return sendSuccess(res, result, result.message, 400);
  }

  sendSuccess(res, result, result.message);
});
