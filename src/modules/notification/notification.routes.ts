import { Router } from 'express';
import {
  createNotification,
  getNotificationById,
  updateNotification,
  cancelNotification,
  deleteNotification,
  getAllNotifications,
  sendNotification,
  processPendingNotifications,
  createPregnancyReminders,
  getStatistics,
  getEmailStatus,
  sendTestEmail,
  getCronStatus,
  runCronManually,
} from './notification.controller';
import {
  createNotificationValidation,
  updateNotificationValidation,
  getByIdValidation,
  getNotificationsValidation,
  sendTestEmailValidation,
} from './notification.validation';
import { validate } from '../../middlewares/validate';
import { authenticate } from '../../middlewares/auth';

const router = Router();

// All routes are protected
router.use(authenticate);

// Special routes (before dynamic routes)
router.get('/statistics', getStatistics);
router.get('/email-status', getEmailStatus);
router.get('/cron-status', getCronStatus);
router.post('/test-email', validate(sendTestEmailValidation), sendTestEmail);
router.post('/process-pending', processPendingNotifications);
router.post('/pregnancy-reminders', createPregnancyReminders);
router.post('/run-cron', runCronManually);

// CRUD routes
router.post('/', validate(createNotificationValidation), createNotification);
router.get('/', validate(getNotificationsValidation), getAllNotifications);
router.get('/:id', validate(getByIdValidation), getNotificationById);
router.put('/:id', validate(updateNotificationValidation), updateNotification);
router.delete('/:id', validate(getByIdValidation), deleteNotification);

// Action routes
router.patch('/:id/cancel', validate(getByIdValidation), cancelNotification);
router.post('/:id/send', validate(getByIdValidation), sendNotification);

export default router;
