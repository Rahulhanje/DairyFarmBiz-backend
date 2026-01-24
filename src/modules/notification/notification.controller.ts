import { Request, Response } from 'express';
import { notificationService } from './notification.service';
import { emailService } from './email.service';
import { AuthRequest } from '../../types';
import { cronJobService } from '../../utils/cronJobs';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated, sendPaginated, sendNoContent } from '../../utils/responseHandler';
import { NotificationStatus, NotificationType, NotificationChannel } from './notification.model';

/**
 * @desc    Create a new notification
 * @route   POST /api/v1/notifications
 * @access  Private
 */
export const createNotification = asyncHandler(async (req: Request, res: Response) => {
  const {
    animalId,
    inseminationId,
    type,
    channel,
    scheduledDate,
    message,
    subject,
    recipientEmail,
    recipientPhone,
  } = req.body;

  const notification = await notificationService.create({
    animalId,
    inseminationId,
    type,
    channel,
    scheduledDate: new Date(scheduledDate),
    message,
    subject,
    recipientEmail,
    recipientPhone,
  });

  sendCreated(res, notification, 'Notification created successfully');
});

/**
 * @desc    Get notification by ID
 * @route   GET /api/v1/notifications/:id
 * @access  Private
 */
export const getNotificationById = asyncHandler(async (req: Request, res: Response) => {
  const notification = await notificationService.getById(req.params.id);
  sendSuccess(res, notification, 'Notification fetched successfully');
});

/**
 * @desc    Update a notification
 * @route   PUT /api/v1/notifications/:id
 * @access  Private
 */
export const updateNotification = asyncHandler(async (req: Request, res: Response) => {
  const { scheduledDate, message, subject, recipientEmail, recipientPhone, status } = req.body;

  const notification = await notificationService.update(req.params.id, {
    scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
    message,
    subject,
    recipientEmail,
    recipientPhone,
    status,
  });

  sendSuccess(res, notification, 'Notification updated successfully');
});

/**
 * @desc    Cancel a notification
 * @route   PATCH /api/v1/notifications/:id/cancel
 * @access  Private
 */
export const cancelNotification = asyncHandler(async (req: Request, res: Response) => {
  const notification = await notificationService.cancel(req.params.id);
  sendSuccess(res, notification, 'Notification cancelled successfully');
});

/**
 * @desc    Delete a notification
 * @route   DELETE /api/v1/notifications/:id
 * @access  Private
 */
export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  await notificationService.delete(req.params.id);
  sendNoContent(res);
});

/**
 * @desc    Get all notifications with filters
 * @route   GET /api/v1/notifications
 * @access  Private
 */
export const getAllNotifications = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as NotificationStatus | undefined;
  const type = req.query.type as NotificationType | undefined;
  const channel = req.query.channel as NotificationChannel | undefined;
  const animalId = req.query.animalId as string | undefined;
  const inseminationId = req.query.inseminationId as string | undefined;
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

  const { notifications, total } = await notificationService.getAll(
    { status, type, channel, animalId, inseminationId, startDate, endDate },
    page,
    limit
  );

  sendPaginated(res, notifications, { page, limit, total }, 'Notifications fetched successfully');
});

/**
 * @desc    Send a notification immediately
 * @route   POST /api/v1/notifications/:id/send
 * @access  Private
 */
export const sendNotification = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Get the logged-in user's email from the request
  const userEmail = req.user?.email;
  console.log('[DEBUG] Sending notification to user email:', userEmail);
  const result = await notificationService.sendEmailNotification(req.params.id, userEmail);

  if (result.success) {
    sendSuccess(res, { sent: true }, 'Notification sent successfully');
  } else {
    sendSuccess(res, { sent: false, error: result.error }, 'Failed to send notification');
  }
});

/**
 * @desc    Process all pending due notifications
 * @route   POST /api/v1/notifications/process-pending
 * @access  Private
 */
export const processPendingNotifications = asyncHandler(async (_req: Request, res: Response) => {
  const result = await notificationService.processPendingNotifications();
  sendSuccess(res, result, 'Pending notifications processed');
});

/**
 * @desc    Create pregnancy check reminder notifications
 * @route   POST /api/v1/notifications/pregnancy-reminders
 * @access  Private
 */
export const createPregnancyReminders = asyncHandler(async (req: Request, res: Response) => {
  const { recipientEmail } = req.body;
  const created = await notificationService.createPregnancyCheckReminders(recipientEmail);
  sendSuccess(res, { created }, `Created ${created} pregnancy check reminder(s)`);
});

/**
 * @desc    Get notification statistics
 * @route   GET /api/v1/notifications/statistics
 * @access  Private
 */
export const getStatistics = asyncHandler(async (_req: Request, res: Response) => {
  const statistics = await notificationService.getStatistics();
  sendSuccess(res, statistics, 'Notification statistics fetched successfully');
});

/**
 * @desc    Check email service status
 * @route   GET /api/v1/notifications/email-status
 * @access  Private
 */
export const getEmailStatus = asyncHandler(async (_req: Request, res: Response) => {
  const isReady = emailService.isReady();
  const isConnected = isReady ? await emailService.verifyConnection() : false;

  sendSuccess(res, {
    configured: isReady,
    connected: isConnected,
  }, 'Email service status fetched');
});

/**
 * @desc    Send a test email
 * @route   POST /api/v1/notifications/test-email
 * @access  Private
 */
export const sendTestEmail = asyncHandler(async (req: Request, res: Response) => {
  const { to, subject, message } = req.body;

  const result = await emailService.sendGeneralNotification(
    to,
    subject || 'Test Email from Dairy Farm Management',
    message || 'This is a test email to verify email configuration.'
  );

  if (result.success) {
    sendSuccess(res, { sent: true, messageId: result.messageId }, 'Test email sent successfully');
  } else {
    sendSuccess(res, { sent: false, error: result.error }, 'Failed to send test email');
  }
});

/**
 * @desc    Get cron job status
 * @route   GET /api/v1/notifications/cron-status
 * @access  Private
 */
export const getCronStatus = asyncHandler(async (_req: Request, res: Response) => {
  const status = cronJobService.getStatus();
  sendSuccess(res, status, 'Cron job status fetched');
});

/**
 * @desc    Run cron job manually
 * @route   POST /api/v1/notifications/run-cron
 * @access  Private
 */
export const runCronManually = asyncHandler(async (_req: Request, res: Response) => {
  const result = await cronJobService.runDailyNotificationJob();
  sendSuccess(res, result, 'Cron job executed successfully');
});

/**
 * @desc    Create a test notification due immediately
 * @route   POST /api/v1/notifications/test-immediate
 * @access  Private
 */
export const createImmediateTestNotification = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userEmail = req.user?.email;
  
  if (!userEmail) {
    return sendSuccess(res, { error: 'User email not found' }, 'Failed to create test notification');
  }

  const notification = await notificationService.create({
    type: 'pregnancy_check',
    channel: 'email',
    scheduledDate: new Date(), // Schedule for right now
    message: `This is a test notification to verify automatic email system. Scheduled at ${new Date().toLocaleString()}.`,
    subject: 'Test Notification - Immediate Delivery',
    recipientEmail: userEmail,
  });

  sendCreated(res, notification, 'Test notification created and scheduled for immediate delivery. Wait for next cron cycle (runs every hour) or call /run-cron to send it now.');
});
