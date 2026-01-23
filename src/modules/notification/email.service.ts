import nodemailer from 'nodemailer';
import { config } from '../../config';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    // Check if SMTP is configured
    if (!config.smtpHost || !config.smtpUser || !config.smtpPass) {
      console.warn('Email service not configured. Set SMTP environment variables.');
      this.isConfigured = false;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: config.smtpUser,
          pass: config.smtpPass,
        },
      });

      this.isConfigured = true;
      console.log('Email service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize email transporter:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Check if email service is properly configured
   */
  isReady(): boolean {
    return this.isConfigured && this.transporter !== null;
  }

  /**
   * Verify the transporter connection
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email transporter verification failed:', error);
      return false;
    }
  }

  /**
   * Send an email
   */
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    if (!this.isReady()) {
      return {
        success: false,
        error: 'Email service is not configured. Check SMTP settings.',
      };
    }

    try {
      const mailOptions = {
        from: `"${config.emailFromName}" <${config.emailFrom}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      const info = await this.transporter!.sendMail(mailOptions);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown email error';
      console.error('Failed to send email:', errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send pregnancy check reminder email
   */
  async sendPregnancyCheckReminder(
    recipientEmail: string,
    animalInfo: { serialNumber: string; nickName?: string; animalType: string },
    inseminationDate: Date,
    checkDate: Date
  ): Promise<EmailResult> {
    const animalName = animalInfo.nickName || animalInfo.serialNumber;
    const subject = `Pregnancy Check Reminder - ${animalName}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c5282;">🐄 Pregnancy Check Reminder</h2>
        <p>This is a reminder that a pregnancy check is due for the following animal:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f7fafc;">
            <td style="padding: 12px; border: 1px solid #e2e8f0;"><strong>Animal</strong></td>
            <td style="padding: 12px; border: 1px solid #e2e8f0;">${animalName}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #e2e8f0;"><strong>Serial Number</strong></td>
            <td style="padding: 12px; border: 1px solid #e2e8f0;">${animalInfo.serialNumber}</td>
          </tr>
          <tr style="background-color: #f7fafc;">
            <td style="padding: 12px; border: 1px solid #e2e8f0;"><strong>Type</strong></td>
            <td style="padding: 12px; border: 1px solid #e2e8f0;">${animalInfo.animalType}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #e2e8f0;"><strong>Insemination Date</strong></td>
            <td style="padding: 12px; border: 1px solid #e2e8f0;">${inseminationDate.toLocaleDateString()}</td>
          </tr>
          <tr style="background-color: #f7fafc;">
            <td style="padding: 12px; border: 1px solid #e2e8f0;"><strong>Check Due Date</strong></td>
            <td style="padding: 12px; border: 1px solid #e2e8f0;">${checkDate.toLocaleDateString()}</td>
          </tr>
        </table>
        
        <p style="color: #718096; font-size: 14px;">
          Please schedule a veterinary check to confirm pregnancy status.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        
        <p style="color: #a0aec0; font-size: 12px;">
          This is an automated message from Dairy Farm Management System.
        </p>
      </div>
    `;

    const text = `
Pregnancy Check Reminder

Animal: ${animalName}
Serial Number: ${animalInfo.serialNumber}
Type: ${animalInfo.animalType}
Insemination Date: ${inseminationDate.toLocaleDateString()}
Check Due Date: ${checkDate.toLocaleDateString()}

Please schedule a veterinary check to confirm pregnancy status.

This is an automated message from Dairy Farm Management System.
    `;

    return this.sendEmail({
      to: recipientEmail,
      subject,
      html,
      text,
    });
  }

  /**
   * Send general notification email
   */
  async sendGeneralNotification(
    recipientEmail: string,
    subject: string,
    message: string
  ): Promise<EmailResult> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c5282;">🐄 Dairy Farm Notification</h2>
        <div style="padding: 20px; background-color: #f7fafc; border-radius: 8px;">
          ${message.replace(/\n/g, '<br>')}
        </div>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="color: #a0aec0; font-size: 12px;">
          This is an automated message from Dairy Farm Management System.
        </p>
      </div>
    `;

    return this.sendEmail({
      to: recipientEmail,
      subject,
      html,
      text: message,
    });
  }
}

export const emailService = new EmailService();
