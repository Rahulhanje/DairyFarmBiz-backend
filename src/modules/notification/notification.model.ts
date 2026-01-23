import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType = 'pregnancy_check' | 'vaccination' | 'breeding_reminder' | 'general';
export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app';
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'cancelled';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  animal?: mongoose.Types.ObjectId;
  insemination?: mongoose.Types.ObjectId;
  type: NotificationType;
  channel: NotificationChannel;
  status: NotificationStatus;
  scheduledDate: Date;
  sentAt?: Date;
  isSent: boolean;
  message: string;
  subject?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    animal: {
      type: Schema.Types.ObjectId,
      ref: 'Animal',
    },
    insemination: {
      type: Schema.Types.ObjectId,
      ref: 'Insemination',
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: {
        values: ['pregnancy_check', 'vaccination', 'breeding_reminder', 'general'],
        message: 'Invalid notification type',
      },
    },
    channel: {
      type: String,
      required: [true, 'Notification channel is required'],
      enum: {
        values: ['email', 'sms', 'push', 'in_app'],
        message: 'Invalid notification channel',
      },
      default: 'email',
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['pending', 'sent', 'failed', 'cancelled'],
        message: 'Invalid notification status',
      },
      default: 'pending',
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required'],
    },
    sentAt: {
      type: Date,
    },
    isSent: {
      type: Boolean,
      default: false,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    subject: {
      type: String,
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    recipientEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    recipientPhone: {
      type: String,
      trim: true,
    },
    retryCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxRetries: {
      type: Number,
      default: 3,
      min: 0,
    },
    lastError: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
notificationSchema.index({ scheduledDate: 1, status: 1 });
notificationSchema.index({ animal: 1 });
notificationSchema.index({ insemination: 1 });
notificationSchema.index({ isSent: 1, scheduledDate: 1 });
notificationSchema.index({ type: 1, status: 1 });

export const Notification = mongoose.model<INotification>(
  'Notification',
  notificationSchema
);
