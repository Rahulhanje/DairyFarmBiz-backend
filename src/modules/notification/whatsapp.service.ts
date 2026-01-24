import axios from 'axios';
import { config } from '../../config';

// Development mode - log messages instead of sending
const DEV_MODE = process.env.NODE_ENV === 'development';

export interface WhatsAppOptions {
  to: string; // Phone number with country code (e.g., 919876543210 - without +)
  message: string;
}

export interface WhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class WhatsAppService {
  private isConfigured = false;
  private phoneNumberId: string = '';
  private accessToken: string = '';
  private apiVersion: string = 'v18.0';

  constructor() {
    this.initializeClient();
  }

  private initializeClient(): void {
    // Check if Meta Cloud API is configured
    if (!config.metaPhoneNumberId || !config.metaAccessToken) {
      console.warn('WhatsApp service not configured. Set META_PHONE_NUMBER_ID and META_ACCESS_TOKEN environment variables.');
      if (DEV_MODE) {
        console.log('📱 DEV MODE: WhatsApp messages will be logged to console instead of sent');
        this.isConfigured = true; // Allow in dev mode
      } else {
        this.isConfigured = false;
      }
      return;
    }

    try {
      this.phoneNumberId = config.metaPhoneNumberId;
      this.accessToken = config.metaAccessToken;
      this.isConfigured = true;
      console.log('WhatsApp service initialized successfully (Meta Cloud API)');
    } catch (error) {
      console.error('Failed to initialize WhatsApp client:', error);
      if (DEV_MODE) {
        console.log('📱 DEV MODE: WhatsApp messages will be logged to console instead of sent');
        this.isConfigured = true; // Allow in dev mode
      } else {
        this.isConfigured = false;
      }
    }
  }

  /**
   * Check if WhatsApp service is properly configured
   */
  isReady(): boolean {
    return this.isConfigured;
  }

  /**
   * Send a WhatsApp message using Meta Cloud API
   */
  async sendMessage(options: WhatsAppOptions): Promise<WhatsAppResult> {
    const { to, message } = options;

    // In dev mode without configuration, just log
    if (DEV_MODE && (!this.phoneNumberId || !this.accessToken)) {
      console.log('📱 [WhatsApp DEV] Would send to:', to);
      console.log('📱 [WhatsApp DEV] Message:', message);
      return { success: true, messageId: 'dev-mode-' + Date.now() };
    }

    if (!this.phoneNumberId || !this.accessToken) {
      return { success: false, error: 'WhatsApp service not configured' };
    }

    try {
      // Remove + from phone number if present (Meta expects number without +)
      const cleanNumber = to.replace(/^\+/, '');

      // Meta Cloud API endpoint
      const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;

      const response = await axios.post<{
        messages: Array<{ id: string }>;
      }>(
        url,
        {
          messaging_product: 'whatsapp',
          to: cleanNumber,
          type: 'text',
          text: {
            preview_url: false,
            body: message,
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const messageId = response.data.messages?.[0]?.id;
      console.log(`✅ WhatsApp message sent to ${to}. Message ID: ${messageId}`);
      return { success: true, messageId };
    } catch (error: any) {
      console.error('Failed to send WhatsApp message:', error);
      
      let errorMessage = 'Unknown error';
      if (error.response) {
        errorMessage = error.response?.data?.error?.message || error.message;
        console.error('Meta API Error:', error.response?.data);
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // In dev mode, log but return success for testing
      if (DEV_MODE) {
        console.log('📱 [WhatsApp DEV] Error occurred but continuing in dev mode');
        return { success: true, messageId: 'dev-error-' + Date.now() };
      }
      
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send pregnancy check reminder via WhatsApp
   */
  async sendPregnancyCheckReminder(
    to: string,
    animalInfo: { serialNumber: string; nickName?: string; animalType: string },
    inseminationDate: Date
  ): Promise<WhatsAppResult> {
    const animalName = animalInfo.nickName || animalInfo.serialNumber;
    const message = `🐄 *Pregnancy Check Reminder*\n\n` +
      `Animal: ${animalInfo.animalType} ${animalInfo.serialNumber}` +
      (animalInfo.nickName ? ` (${animalInfo.nickName})` : '') + `\n` +
      `Insemination Date: ${inseminationDate.toLocaleDateString()}\n\n` +
      `Pregnancy check is due today. Please schedule a pregnancy check.\n\n` +
      `_This is an automated reminder from Dairy Farm Management System_`;

    return this.sendMessage({ to, message });
  }

  /**
   * Send a general notification via WhatsApp
   */
  async sendGeneralNotification(to: string, title: string, body: string): Promise<WhatsAppResult> {
    const message = `*${title}*\n\n${body}\n\n_Dairy Farm Management System_`;
    return this.sendMessage({ to, message });
  }
}

export const whatsAppService = new WhatsAppService();
