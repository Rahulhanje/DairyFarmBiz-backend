import { body, param, query } from 'express-validator';

export const addStatusValidation = [
  body('inseminationId')
    .notEmpty()
    .withMessage('Insemination ID is required')
    .isMongoId()
    .withMessage('Invalid insemination ID'),

  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['check_pending', 'pregnant_confirmed', 'failed', 'delivered'])
    .withMessage('Invalid pregnancy status'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),

  body('deliveryDate')
    .optional()
    .isISO8601()
    .withMessage('Delivery date must be a valid date'),

  body('calfCount')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Calf count must be a non-negative integer'),

  body('calfDetails')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Calf details cannot exceed 500 characters'),
];

export const getHistoryByInseminationValidation = [
  param('inseminationId')
    .isMongoId()
    .withMessage('Invalid insemination ID'),
];

export const getHistoryByAnimalValidation = [
  param('animalId')
    .isMongoId()
    .withMessage('Invalid animal ID'),
];

export const getHistoryFilterValidation = [
  query('inseminationId')
    .optional()
    .isMongoId()
    .withMessage('Invalid insemination ID'),

  query('animalId')
    .optional()
    .isMongoId()
    .withMessage('Invalid animal ID'),

  query('status')
    .optional()
    .isIn(['check_pending', 'pregnant_confirmed', 'failed', 'delivered'])
    .withMessage('Invalid pregnancy status'),

  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
];
