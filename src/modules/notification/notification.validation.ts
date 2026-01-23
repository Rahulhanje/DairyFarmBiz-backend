import { body, param, query } from 'express-validator';

export const createNotificationValidation = [
  body('animalId')
    .optional()
    .isMongoId()
    .withMessage('Invalid animal ID'),

  body('inseminationId')
    .optional()
    .isMongoId()
    .withMessage('Invalid insemination ID'),

  body('type')
    .notEmpty()
    .withMessage('Notification type is required')
    .isIn(['pregnancy_check', 'vaccination', 'breeding_reminder', 'general'])
    .withMessage('Invalid notification type'),

  body('channel')
    .optional()
    .isIn(['email', 'sms', 'push', 'in_app'])
    .withMessage('Invalid notification channel'),

  body('scheduledDate')
    .notEmpty()
    .withMessage('Scheduled date is required')
    .isISO8601()
    .withMessage('Scheduled date must be a valid date'),

  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Message cannot exceed 2000 characters'),

  body('subject')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Subject cannot exceed 200 characters'),

  body('recipientEmail')
    .optional()
    .isEmail()
    .withMessage('Invalid recipient email'),

  body('recipientPhone')
    .optional()
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage('Invalid phone number'),
];

export const updateNotificationValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid notification ID'),

  body('scheduledDate')
    .optional()
    .isISO8601()
    .withMessage('Scheduled date must be a valid date'),

  body('message')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Message cannot exceed 2000 characters'),

  body('subject')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Subject cannot exceed 200 characters'),

  body('recipientEmail')
    .optional()
    .isEmail()
    .withMessage('Invalid recipient email'),

  body('status')
    .optional()
    .isIn(['pending', 'sent', 'failed', 'cancelled'])
    .withMessage('Invalid notification status'),
];

export const getByIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid notification ID'),
];

export const getNotificationsValidation = [
  query('status')
    .optional()
    .isIn(['pending', 'sent', 'failed', 'cancelled'])
    .withMessage('Invalid notification status'),

  query('type')
    .optional()
    .isIn(['pregnancy_check', 'vaccination', 'breeding_reminder', 'general'])
    .withMessage('Invalid notification type'),

  query('channel')
    .optional()
    .isIn(['email', 'sms', 'push', 'in_app'])
    .withMessage('Invalid notification channel'),

  query('animalId')
    .optional()
    .isMongoId()
    .withMessage('Invalid animal ID'),

  query('inseminationId')
    .optional()
    .isMongoId()
    .withMessage('Invalid insemination ID'),

  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

export const sendTestEmailValidation = [
  body('to')
    .notEmpty()
    .withMessage('Recipient email is required')
    .isEmail()
    .withMessage('Invalid email address'),

  body('subject')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Subject cannot exceed 200 characters'),

  body('message')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Message cannot exceed 2000 characters'),
];
