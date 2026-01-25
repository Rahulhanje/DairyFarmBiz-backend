import { Notification, INotification, NotificationType, NotificationChannel, NotificationStatus } from './notification.model';
import { emailService } from './email.service';
import { breedingService } from '../breeding';
import { NotFoundError, BadRequestError } from '../../utils/ApiError';
import { config } from '../../config';
import mongoose from 'mongoose';

export interface CreateNotificationData {
  userId: string;
  animalId?: string;
  inseminationId?: string;
  type: NotificationType;
  channel?: NotificationChannel;
  scheduledDate: Date;
  message: string;
  subject?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateNotificationData {
  scheduledDate?: Date;
  message?: string;
  subject?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  status?: NotificationStatus;
}

export interface NotificationFilter {
  status?: NotificationStatus;
  type?: NotificationType;
  channel?: NotificationChannel;
  animalId?: string;
  inseminationId?: string;
  startDate?: Date;
  endDate?: Date;
  isSent?: boolean;
}

class NotificationService {
  /**
   * Create a new notification
   */
  async create(data: CreateNotificationData): Promise<INotification> {
    const notification = await Notification.create({
      userId: new mongoose.Types.ObjectId(data.userId),
      animal: data.animalId ? new mongoose.Types.ObjectId(data.animalId) : undefined,
      insemination: data.inseminationId ? new mongoose.Types.ObjectId(data.inseminationId) : undefined,
      type: data.type,
      channel: data.channel || 'email',
      scheduledDate: data.scheduledDate,
      message: data.message,
      subject: data.subject,
      recipientEmail: data.recipientEmail,
      recipientPhone: data.recipientPhone,
      metadata: data.metadata,
    });

    return notification.populate([
      { path: 'animal', select: 'serialNumber nickName animalType' },
      { path: 'insemination', select: 'inseminationDate pregnancyCheckDate' },
    ]);
  }

  /**
   * Get notification by ID
   */
  async getById(id: string, userId: string): Promise<INotification> {
    const notification = await Notification.findOne({ _id: id, userId: new mongoose.Types.ObjectId(userId) })
      .populate('animal', 'serialNumber nickName animalType')
      .populate('insemination', 'inseminationDate pregnancyCheckDate');

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    return notification;
  }

  /**
   * Update a notification (only if not sent)
   */
  async update(id: string, userId: string, data: UpdateNotificationData): Promise<INotification> {
    const notification = await Notification.findOne({ _id: id, userId: new mongoose.Types.ObjectId(userId) });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    if (notification.isSent && data.status !== 'cancelled') {
      throw new BadRequestError('Cannot update a sent notification');
    }

    const updated = await Notification.findOneAndUpdate(
      { _id: id, userId: new mongoose.Types.ObjectId(userId) },
      { $set: data },
      { new: true, runValidators: true }
    )
      .populate('animal', 'serialNumber nickName animalType')
      .populate('insemination', 'inseminationDate pregnancyCheckDate');

    return updated!;
  }

  /**
   * Cancel a notification
   */
  async cancel(id: string, userId: string): Promise<INotification> {
    const notification = await Notification.findOne({ _id: id, userId: new mongoose.Types.ObjectId(userId) });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    if (notification.isSent) {
      throw new BadRequestError('Cannot cancel a sent notification');
    }

    notification.status = 'cancelled';
    await notification.save();

    return notification;
  }

  /**
   * Delete a notification
   */
  async delete(id: string, userId: string): Promise<void> {
    const notification = await Notification.findOne({ _id: id, userId: new mongoose.Types.ObjectId(userId) });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    await Notification.findOneAndDelete({ _id: id, userId: new mongoose.Types.ObjectId(userId) });
  }

  /**
   * Get all notifications with filters
   */
  async getAll(
    userId: string,
    filter: NotificationFilter = {},
    page = 1,
    limit = 10
  ): Promise<{ notifications: INotification[]; total: number }> {
    const query: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(userId),
    };

    if (filter.status) {
      query.status = filter.status;
    }

    if (filter.type) {
      query.type = filter.type;
    }

    if (filter.channel) {
      query.channel = filter.channel;
    }

    if (filter.animalId) {
      query.animal = new mongoose.Types.ObjectId(filter.animalId);
    }

    if (filter.inseminationId) {
      query.insemination = new mongoose.Types.ObjectId(filter.inseminationId);
    }

    if (filter.isSent !== undefined) {
      query.isSent = filter.isSent;
    }

    if (filter.startDate || filter.endDate) {
      query.scheduledDate = {};
      if (filter.startDate) {
        (query.scheduledDate as Record<string, Date>).$gte = filter.startDate;
      }
      if (filter.endDate) {
        (query.scheduledDate as Record<string, Date>).$lte = filter.endDate;
      }
    }

    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .populate('animal', 'serialNumber nickName animalType')
        .populate('insemination', 'inseminationDate pregnancyCheckDate')
        .sort({ scheduledDate: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments(query),
    ]);

    return { notifications, total };
  }

  /**
   * Get pending notifications that are due
   */
  async getPendingDue(): Promise<INotification[]> {
    const now = new Date();

    return Notification.find({
      status: 'pending',
      isSent: false,
      scheduledDate: { $lte: now },
    })
      .populate('animal', 'serialNumber nickName animalType isSold')
      .populate('insemination', 'inseminationDate pregnancyCheckDate pregnancyStatus');
  }

  /**
   * Send a notification via email
   * @param notificationId - The notification to send
   * @param userEmail - The logged-in user's email (required for manual sends)
   * @param isAutomated - If true, uses config.notificationEmail instead of userEmail
   */
  async sendEmailNotification(notificationId: string, userEmail?: string, isAutomated = false): Promise<{ success: boolean; error?: string }> {
    const notification = await Notification.findById(notificationId)
      .populate('animal', 'serialNumber nickName animalType')
      .populate('insemination', 'inseminationDate pregnancyCheckDate');

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    if (notification.isSent) {
      throw new BadRequestError('Notification already sent');
    }

    if (notification.channel !== 'email') {
      throw new BadRequestError('Notification channel is not email');
    }

    // For automated notifications, use config email; for manual sends, use user's email
    let recipientEmail: string;
    if (isAutomated) {
      recipientEmail = notification.recipientEmail || config.notificationEmail;
    } else {
      // Manual send - always use the logged-in user's email
      if (!userEmail) {
        throw new BadRequestError('User email is required to send notification');
      }
      recipientEmail = userEmail;
    }
    
    if (!recipientEmail) {
      throw new BadRequestError('No recipient email available');
    }

    const result = await emailService.sendEmail({
      to: recipientEmail,
      subject: notification.subject || 'Dairy Farm Notification',
      text: notification.message,
    });

    if (result.success) {
      notification.status = 'sent';
      notification.isSent = true;
      notification.sentAt = new Date();
      await notification.save();

      return { success: true };
    } else {
      notification.retryCount += 1;
      notification.lastError = result.error;

      if (notification.retryCount >= notification.maxRetries) {
        notification.status = 'failed';
      }

      await notification.save();

      return { success: false, error: result.error };
    }
  }

  /**
   * Process all pending due notifications
   */
  async processPendingNotifications(): Promise<{ processed: number; sent: number; failed: number }> {
    const pendingNotifications = await this.getPendingDue();

    let sent = 0;
    let failed = 0;

    for (const notification of pendingNotifications) {
      // Skip if animal is sold
      const animal = notification.animal as unknown as { isSold?: boolean } | undefined;
      if (animal?.isSold) {
        notification.status = 'cancelled';
        await notification.save();
        continue;
      }

      // Skip pregnancy check reminders if status is no longer pending
      const insemination = notification.insemination as unknown as { pregnancyStatus?: string } | undefined;
      if (notification.type === 'pregnancy_check' && insemination) {
        if (insemination.pregnancyStatus !== 'check_pending') {
          notification.status = 'cancelled';
          await notification.save();
          continue;
        }
      }

      if (notification.channel === 'email') {
        // Automated processing - use isAutomated flag
        const result = await this.sendEmailNotification(notification._id.toString(), undefined, true);
        if (result.success) {
          sent++;
        } else {
          failed++;
        }
      }
    }

    return {
      processed: pendingNotifications.length,
      sent,
      failed,
    };
  }

  /**
   * Create pregnancy check reminder notifications
   */
  async createPregnancyCheckReminders(userId: string, recipientEmail: string): Promise<number> {
    const pendingChecks = await breedingService.getPendingPregnancyChecks(userId);
    let created = 0;

    for (const insemination of pendingChecks) {
      // Check if notification already exists for this insemination
      const existing = await Notification.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        insemination: insemination._id,
        type: 'pregnancy_check',
        status: { $in: ['pending', 'sent'] },
      });

      if (existing) {
        continue;
      }

      const animal = insemination.animal as unknown as {
        _id: mongoose.Types.ObjectId;
        serialNumber: string;
        nickName?: string;
        animalType: string;
      };

      const animalName = animal.nickName || animal.serialNumber;

      await this.create({
        userId,
        animalId: animal._id.toString(),
        inseminationId: insemination._id.toString(),
        type: 'pregnancy_check',
        channel: 'email',
        scheduledDate: insemination.pregnancyCheckDate,
        subject: `Pregnancy Check Reminder - ${animalName}`,
        message: `Pregnancy check is due for ${animalName} (${animal.serialNumber}). Insemination date: ${insemination.inseminationDate.toLocaleDateString()}. Please schedule a veterinary check.`,
        recipientEmail,
        metadata: {
          animalSerialNumber: animal.serialNumber,
          inseminationDate: insemination.inseminationDate,
          pregnancyCheckDate: insemination.pregnancyCheckDate,
        },
      });

      created++;
    }

    return created;
  }

  /**
   * Get notification statistics
   */
  async getStatistics(userId: string): Promise<{
    total: number;
    pending: number;
    sent: number;
    cancelled: number;
  }> {
    const userIdObj = new mongoose.Types.ObjectId(userId);
    
    const byStatusResult = await Notification.aggregate([
      { $match: { userId: userIdObj } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const byStatus: Record<string, number> = {};
    let total = 0;
    for (const item of byStatusResult) {
      byStatus[item._id] = item.count;
      total += item.count;
    }

    return { 
      total, 
      pending: byStatus['pending'] || 0,
      sent: byStatus['sent'] || 0,
      cancelled: byStatus['cancelled'] || 0,
    };
  }
}

export const notificationService = new NotificationService();
