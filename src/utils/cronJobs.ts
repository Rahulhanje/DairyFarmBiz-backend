import cron from 'node-cron';
import { notificationService } from '../modules/notification';
import { Notification } from '../modules/notification/notification.model';
import { Insemination } from '../modules/breeding';
import { Animal } from '../modules/animal';
import { emailService } from '../modules/notification/email.service';
import mongoose from 'mongoose';

class CronJobService {
  private isRunning = false;
  private hourlyJob: cron.ScheduledTask | null = null;

  /**
   * Initialize all cron jobs
   */
  initialize(): void {
    console.log('🕐 Initializing cron jobs...');

    // FOR TESTING: Run every minute to test automatic email sending
    // FOR PRODUCTION: Change to '0 * * * *' to run every hour
    this.hourlyJob = cron.schedule('* * * * *', async () => {
      await this.runDailyNotificationJob();
    });

    // Also run immediately on startup to catch any missed notifications
    setTimeout(() => {
      this.runDailyNotificationJob();
    }, 5000); // Wait 5 seconds after server start

    console.log('✅ Cron jobs initialized - Notification job runs EVERY MINUTE (testing mode)');
    console.log('⚠️  Remember to change back to hourly schedule for production!');
  }

  /**
   * Stop all cron jobs
   */
  stop(): void {
    if (this.hourlyJob) {
      this.hourlyJob.stop();
      console.log('🛑 Cron jobs stopped');
    }
  }

  /**
   * Run the daily notification job manually (useful for testing)
   */
  async runDailyNotificationJob(): Promise<{
    processed: number;
    sent: number;
    skipped: number;
    failed: number;
  }> {
    if (this.isRunning) {
      console.log('⏳ Daily notification job already running, skipping...');
      return { processed: 0, sent: 0, skipped: 0, failed: 0 };
    }

    this.isRunning = true;
    console.log('🚀 Starting daily notification job at', new Date().toISOString());

    const result = {
      processed: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
    };

    try {
      // First, create any new pregnancy check reminders
      await this.createPregnancyCheckNotifications();

      // Find all pending notifications that are due
      const now = new Date();
      const pendingNotifications = await Notification.find({
        status: 'pending',
        isSent: false,
        scheduledDate: { $lte: now },
      })
        .populate('animal')
        .populate('insemination');

      console.log(`📋 Found ${pendingNotifications.length} pending notification(s) to process`);

      for (const notification of pendingNotifications) {
        result.processed++;

        try {
          // Check if we should skip this notification
          const skipReason = await this.shouldSkipNotification(notification);

          if (skipReason) {
            console.log(`⏭️ Skipping notification ${notification._id}: ${skipReason}`);
            notification.status = 'cancelled';
            notification.lastError = skipReason;
            await notification.save();
            result.skipped++;
            continue;
          }

          // Send the notification based on channel
          if (notification.channel === 'email') {
            const sendResult = await this.sendEmailNotification(notification);

            if (sendResult.success) {
              notification.status = 'sent';
              notification.isSent = true;
              notification.sentAt = new Date();
              await notification.save();
              console.log(`✉️ Sent notification ${notification._id} to ${notification.recipientEmail}`);
              result.sent++;
            } else {
              notification.retryCount += 1;
              notification.lastError = sendResult.error;

              if (notification.retryCount >= notification.maxRetries) {
                notification.status = 'failed';
                console.log(`❌ Notification ${notification._id} failed after max retries`);
              }

              await notification.save();
              result.failed++;
            }
          } else {
            // For other channels (sms, push, in_app), mark as skipped for now
            console.log(`⏭️ Channel ${notification.channel} not implemented, skipping notification ${notification._id}`);
            result.skipped++;
          }
        } catch (error) {
          console.error(`❌ Error processing notification ${notification._id}:`, error);
          notification.retryCount += 1;
          notification.lastError = error instanceof Error ? error.message : 'Unknown error';

          if (notification.retryCount >= notification.maxRetries) {
            notification.status = 'failed';
          }

          await notification.save();
          result.failed++;
        }
      }

      console.log(`✅ Daily notification job completed:`, result);
    } catch (error) {
      console.error('❌ Daily notification job failed:', error);
    } finally {
      this.isRunning = false;
    }

    return result;
  }

  /**
   * Check if notification should be skipped
   */
  private async shouldSkipNotification(notification: any): Promise<string | null> {
    // Check if animal is sold
    if (notification.animal) {
      const animal = await Animal.findById(notification.animal._id || notification.animal);
      if (animal?.isSold) {
        return 'Animal has been sold';
      }
      if (!animal?.isActive) {
        return 'Animal is not active';
      }
    }

    // Check pregnancy status for pregnancy_check notifications
    if (notification.type === 'pregnancy_check' && notification.insemination) {
      const insemination = await Insemination.findById(
        notification.insemination._id || notification.insemination
      );

      if (insemination) {
        // Skip if pregnancy already confirmed
        if (insemination.pregnancyStatus === 'pregnant_confirmed') {
          return 'Pregnancy already confirmed';
        }

        // Skip if pregnancy failed
        if (insemination.pregnancyStatus === 'failed') {
          return 'Pregnancy status is failed';
        }

        // Skip if already delivered
        if (insemination.pregnancyStatus === 'delivered') {
          return 'Animal has already delivered';
        }
      }
    }

    // Check if no recipient email for email channel
    if (notification.channel === 'email' && !notification.recipientEmail) {
      return 'No recipient email specified';
    }

    return null;
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(notification: any): Promise<{ success: boolean; error?: string }> {
    if (!emailService.isReady()) {
      return { success: false, error: 'Email service is not configured' };
    }

    try {
      // For pregnancy check notifications, use the formatted template
      if (notification.type === 'pregnancy_check' && notification.animal && notification.insemination) {
        const animal = await Animal.findById(notification.animal._id || notification.animal);
        const insemination = await Insemination.findById(notification.insemination._id || notification.insemination);

        if (animal && insemination) {
          return emailService.sendPregnancyCheckReminder(
            notification.recipientEmail,
            {
              serialNumber: animal.serialNumber,
              nickName: animal.nickName,
              animalType: animal.animalType,
            },
            insemination.inseminationDate,
            insemination.pregnancyCheckDate
          );
        }
      }

      // For other notifications, use generic email
      return emailService.sendGeneralNotification(
        notification.recipientEmail,
        notification.subject || 'Dairy Farm Notification',
        notification.message
      );
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email',
      };
    }
  }

  /**
   * Create pregnancy check notifications for pending inseminations
   * This checks for inseminations that have passed their pregnancy check date
   * and don't have a notification yet
   */
  private async createPregnancyCheckNotifications(): Promise<number> {
    try {
      const now = new Date();

      // Find inseminations that need pregnancy check reminder
      const pendingInseminations = await Insemination.find({
        pregnancyStatus: 'check_pending',
        pregnancyCheckDate: { $lte: now },
        notificationSent: { $ne: true },
      }).populate('animal', 'serialNumber nickName animalType isSold isActive');

      let created = 0;

      for (const insemination of pendingInseminations) {
        const animal = insemination.animal as unknown as {
          _id: mongoose.Types.ObjectId;
          serialNumber: string;
          nickName?: string;
          animalType: string;
          isSold: boolean;
          isActive: boolean;
        };

        // Skip if animal is sold or inactive
        if (animal.isSold || !animal.isActive) {
          continue;
        }

        // Check if notification already exists
        const existingNotification = await Notification.findOne({
          insemination: insemination._id,
          type: 'pregnancy_check',
          status: { $in: ['pending', 'sent'] },
        });

        if (existingNotification) {
          continue;
        }

        // Create notification - use a default email or skip if none configured
        const recipientEmail = process.env.NOTIFICATION_EMAIL || process.env.SMTP_USER;

        if (!recipientEmail) {
          console.warn('⚠️ No NOTIFICATION_EMAIL or SMTP_USER configured, skipping notification creation');
          continue;
        }

        const animalName = animal.nickName || animal.serialNumber;

        await Notification.create({
          animal: animal._id,
          insemination: insemination._id,
          type: 'pregnancy_check',
          channel: 'email',
          scheduledDate: now,
          subject: `Pregnancy Check Reminder - ${animalName}`,
          message: `Pregnancy check is due for ${animalName} (${animal.serialNumber}). Insemination date: ${insemination.inseminationDate.toLocaleDateString()}. Please schedule a veterinary check.`,
          recipientEmail,
          metadata: {
            animalSerialNumber: animal.serialNumber,
            inseminationDate: insemination.inseminationDate,
            pregnancyCheckDate: insemination.pregnancyCheckDate,
          },
        });

        // Mark insemination as notification sent
        await Insemination.findByIdAndUpdate(insemination._id, {
          $set: { notificationSent: true },
        });

        created++;
      }

      if (created > 0) {
        console.log(`📬 Created ${created} pregnancy check notification(s)`);
      }

      return created;
    } catch (error) {
      console.error('❌ Error creating pregnancy check notifications:', error);
      return 0;
    }
  }

  /**
   * Get cron job status
   */
  getStatus(): { isRunning: boolean; nextRun: Date | null } {
    return {
      isRunning: this.isRunning,
      nextRun: this.hourlyJob ? new Date(Date.now() + this.getTimeUntilNextRun()) : null,
    };
  }

  /**
   * Calculate time until next hourly run
   */
  private getTimeUntilNextRun(): number {
    const now = new Date();
    const next = new Date(now);
    next.setMinutes(0, 0, 0);
    next.setHours(next.getHours() + 1);

    return next.getTime() - now.getTime();
  }
}

export const cronJobService = new CronJobService();
