import { body, param, query } from 'express-validator';

export const createExpenseValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Expense name is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Name must be between 1 and 200 characters'),

  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),

  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid date'),

  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['feed', 'medicine', 'equipment', 'labor', 'maintenance', 'transport', 'other'])
    .withMessage('Invalid category'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
];

export const updateExpenseValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid expense ID'),

  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ min: 1, max: 200 })
    .withMessage('Name must be between 1 and 200 characters'),

  body('amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),

  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid date'),

  body('category')
    .optional()
    .isIn(['feed', 'medicine', 'equipment', 'labor', 'maintenance', 'transport', 'other'])
    .withMessage('Invalid category'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
];

export const getExpenseValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid expense ID'),
];

export const getExpensesFilterValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),

  query('category')
    .optional()
    .isIn(['feed', 'medicine', 'equipment', 'labor', 'maintenance', 'transport', 'other'])
    .withMessage('Invalid category'),
];
