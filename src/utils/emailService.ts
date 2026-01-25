import nodemailer from 'nodemailer';
import { OTP, OTPPurpose } from '../modules/auth/otp.model';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
      console.warn('⚠️  Email service not configured. Email features will be disabled.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT),
        secure: parseInt(SMTP_PORT) === 465,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });

      this.isConfigured = true;
      console.log('✅ Email service configured successfully');
    } catch (error) {
      console.error('❌ Failed to configure email service:', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.warn('Email service not configured. Skipping email send.');
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      console.log(`✅ Email sent successfully to ${options.to}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async createAndSendOTP(email: string, purpose: OTPPurpose): Promise<{ success: boolean; message: string }> {
    try {
      // Normalize email to lowercase
      const normalizedEmail = email.toLowerCase().trim();
      
      // Delete any existing OTPs for this email and purpose
      await OTP.deleteMany({ email: normalizedEmail, purpose });

      // Generate new OTP
      const otpCode = this.generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      console.log(`[OTP] Creating OTP for ${normalizedEmail}, purpose: ${purpose}, code: ${otpCode}, expires: ${expiresAt}`);

      // Save OTP to database
      const otpDoc = await OTP.create({
        email: normalizedEmail,
        otp: otpCode,
        purpose,
        expiresAt,
        verified: false,
      });

      console.log(`[OTP] OTP created successfully with ID: ${otpDoc._id}`);

      // Verify it was saved
      const savedOtp = await OTP.findById(otpDoc._id);
      console.log(`[OTP] Verification - OTP exists in DB:`, !!savedOtp);

      // Send email
      const subject =
        purpose === 'email_verification'
          ? 'Verify Your Email - Dairy Farm Manager'
          : 'Reset Your Password - Dairy Farm Manager';

      const html =
        purpose === 'email_verification'
          ? this.getEmailVerificationTemplate(otpCode)
          : this.getPasswordResetTemplate(otpCode);

      const emailSent = await this.sendEmail({
        to: email,
        subject,
        html,
        text: `Your OTP is: ${otpCode}. It will expire in 10 minutes.`,
      });

      if (!emailSent) {
        return {
          success: false,
          message: 'Failed to send email. Please check email configuration.',
        };
      }

      return {
        success: true,
        message: `OTP sent successfully to ${email}`,
      };
    } catch (error) {
      console.error('Error creating and sending OTP:', error);
      return {
        success: false,
        message: 'Failed to send OTP. Please try again.',
      };
    }
  }

  async verifyOTP(email: string, otp: string, purpose: OTPPurpose): Promise<{ valid: boolean; message: string }> {
    try {
      // Normalize email to lowercase
      const normalizedEmail = email.toLowerCase().trim();
      const now = new Date();

      console.log(`[OTP] Verifying OTP - Email: ${normalizedEmail}, OTP: ${otp}, Purpose: ${purpose}, Current time: ${now}`);

      // Check all OTPs for this email
      const allOtps = await OTP.find({ email: normalizedEmail, purpose });
      console.log(`[OTP] All OTPs found for ${normalizedEmail}:`, allOtps.map(o => ({
        otp: o.otp,
        verified: o.verified,
        expiresAt: o.expiresAt,
        isExpired: o.expiresAt < now
      })));

      const otpDoc = await OTP.findOne({
        email: normalizedEmail,
        otp,
        purpose,
        verified: false,
        expiresAt: { $gt: now },
      });

      console.log(`[OTP] OTP document found:`, !!otpDoc);

      if (!otpDoc) {
        return {
          valid: false,
          message: 'Invalid or expired OTP',
        };
      }

      // Mark OTP as verified
      otpDoc.verified = true;
      await otpDoc.save();

      return {
        valid: true,
        message: 'OTP verified successfully',
      };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return {
        valid: false,
        message: 'Failed to verify OTP',
      };
    }
  }

  private getEmailVerificationTemplate(otp: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .otp-box { background: white; border: 2px dashed #4CAF50; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🐄 Dairy Farm Manager</h1>
          </div>
          <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Thank you for registering with Dairy Farm Manager! Please use the following OTP to verify your email address:</p>
            <div class="otp-box">${otp}</div>
            <p><strong>This OTP will expire in 10 minutes.</strong></p>
            <p>If you didn't request this verification, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 Dairy Farm Manager. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getPasswordResetTemplate(otp: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #FF5722; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .otp-box { background: white; border: 2px dashed #FF5722; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset</h1>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>You requested to reset your password. Please use the following OTP to proceed:</p>
            <div class="otp-box">${otp}</div>
            <p><strong>This OTP will expire in 10 minutes.</strong></p>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong> If you didn't request a password reset, please ignore this email and ensure your account is secure.
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2026 Dairy Farm Manager. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  isServiceConfigured(): boolean {
    return this.isConfigured;
  }
}

export const emailService = new EmailService();
