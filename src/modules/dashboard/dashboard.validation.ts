import { query } from 'express-validator';

export const dashboardFilterValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),

  query('period')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'yearly', 'custom'])
    .withMessage('Invalid period. Valid values: daily, weekly, monthly, yearly, custom'),
];
