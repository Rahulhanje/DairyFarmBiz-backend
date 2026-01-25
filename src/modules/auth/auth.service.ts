import { User, IUser, UserRole } from './user.model';
import { generateToken } from '../../middlewares/auth';
import { BadRequestError, UnauthorizedError, ConflictError } from '../../utils/ApiError';
import { emailService } from '../../utils/emailService';
import bcrypt from 'bcryptjs';

export interface SignupData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  countryCode?: string;
  role?: UserRole;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  token: string;
}

class AuthService {
  /**
   * Register a new user
   */
  async signup(data: SignupData): Promise<AuthResponse> {
    const { name, email, password, phone, countryCode, role } = data;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Create new user (email not verified yet)
    const user = await User.create({
      name,
      email,
      passwordHash: password, // Will be hashed by pre-save hook
      phone,
      countryCode: countryCode || '+91',
      role: role || 'staff',
      isEmailVerified: false,
    });

    // Send verification OTP (non-blocking - don't fail signup if email fails)
    const otpResult = await emailService.createAndSendOTP(email, 'email_verification');
    
    // Log email status but don't block user registration
    if (!emailService.isServiceConfigured()) {
      console.warn('⚠️  Email service not configured. User registered but verification email not sent.');
    } else if (!otpResult.success) {
      console.warn('⚠️  Failed to send verification email:', otpResult.message);
      console.warn('User can resend verification email later.');
    } else {
      console.log('✅ Verification email sent successfully to:', email);
    }

    // Generate token
    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
    });

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  /**
   * Login user
   */
  async login(data: LoginData): Promise<AuthResponse> {
    const { email, password } = data;

    console.log('[DEBUG] Login attempt with email:', email);

    // Find user with password field
    const user = await User.findOne({ email, isActive: true }).select(
      '+passwordHash'
    );

    console.log('[DEBUG] User found:', user ? 'Yes' : 'No');

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    console.log('[DEBUG] Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate token
    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
    });

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<IUser | null> {
    return User.findById(userId);
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<Omit<IUser, 'passwordHash'> | null> {
    const user = await User.findById(userId);
    if (!user) {
      throw new BadRequestError('User not found');
    }
    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    data: { name?: string; phone?: string; countryCode?: string }
  ): Promise<Omit<IUser, 'passwordHash'>> {
    const user = await User.findById(userId);
    if (!user) {
      throw new BadRequestError('User not found');
    }

    if (data.name) user.name = data.name;
    if (data.phone !== undefined) user.phone = data.phone;
    if (data.countryCode !== undefined) user.countryCode = data.countryCode;

    await user.save();
    return user;
  }

  /**
   * Update password
   */
  async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) {
      throw new BadRequestError('User not found');
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Update password
    user.passwordHash = newPassword; // Will be hashed by pre-save hook
    await user.save();
  }

  /**
   * Send verification OTP to email
   */
  async sendVerificationOTP(email: string): Promise<{ success: boolean; message: string }> {
    console.log(`[AUTH] sendVerificationOTP called for email: ${email}`);
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`[AUTH] User not found for email: ${email}`);
      throw new BadRequestError('User not found');
    }

    console.log(`[AUTH] User found, isEmailVerified: ${user.isEmailVerified}`);

    if (user.isEmailVerified) {
      return {
        success: false,
        message: 'Email is already verified',
      };
    }

    // Check if email service is configured
    if (!emailService.isServiceConfigured()) {
      throw new BadRequestError('Email service is not configured. Please contact support.');
    }

    const result = await emailService.createAndSendOTP(email, 'email_verification');
    console.log(`[AUTH] OTP send result:`, result);
    
    if (!result.success) {
      throw new BadRequestError(result.message || 'Failed to send verification email');
    }
    
    return result;
  }

  /**
   * Verify email with OTP
   */
  async verifyEmail(email: string, otp: string): Promise<{ success: boolean; message: string }> {
    console.log(`[AUTH] verifyEmail called - Email: ${email}, OTP: ${otp}`);
    
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`[AUTH] User not found for email: ${email}`);
      throw new BadRequestError('User not found');
    }

    console.log(`[AUTH] User found, isEmailVerified: ${user.isEmailVerified}`);

    if (user.isEmailVerified) {
      return {
        success: false,
        message: 'Email is already verified',
      };
    }

    const otpResult = await emailService.verifyOTP(email, otp, 'email_verification');
    console.log(`[AUTH] OTP verification result:`, otpResult);
    
    if (!otpResult.valid) {
      return {
        success: false,
        message: otpResult.message,
      };
    }

    // Mark email as verified
    user.isEmailVerified = true;
    await user.save();
    console.log(`[AUTH] Email verified successfully for: ${email}`);

    return {
      success: true,
      message: 'Email verified successfully',
    };
  }

  /**
   * Send password reset OTP
   */
  async sendPasswordResetOTP(email: string): Promise<{ success: boolean; message: string }> {
    const user = await User.findOne({ email });
    if (!user) {
      // For security, don't reveal if email exists
      return {
        success: true,
        message: 'If the email exists, a password reset OTP has been sent',
      };
    }

    // Check if email service is configured
    if (!emailService.isServiceConfigured()) {
      throw new BadRequestError('Email service is not configured. Please contact support.');
    }

    const result = await emailService.createAndSendOTP(email, 'password_reset');
    
    if (!result.success) {
      throw new BadRequestError(result.message || 'Failed to send password reset email');
    }
    
    return result;
  }

  /**
   * Reset password with OTP
   */
  async resetPassword(
    email: string,
    otp: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      throw new BadRequestError('User not found');
    }

    const otpResult = await emailService.verifyOTP(email, otp, 'password_reset');
    if (!otpResult.valid) {
      return {
        success: false,
        message: otpResult.message,
      };
    }

    // Update password
    user.passwordHash = newPassword; // Will be hashed by pre-save hook
    await user.save();

    return {
      success: true,
      message: 'Password reset successfully',
    };
  }
}

export const authService = new AuthService();
