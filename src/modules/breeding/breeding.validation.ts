import { body, param, query } from 'express-validator';

export const createInseminationValidation = [
  body('animalId')
    .notEmpty()
    .withMessage('Animal ID is required')
    .isMongoId()
    .withMessage('Invalid animal ID'),

  body('inseminationDate')
    .notEmpty()
    .withMessage('Insemination date is required')
    .isISO8601()
    .withMessage('Insemination date must be a valid date'),

  body('doctorName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Doctor name cannot exceed 100 characters'),

  body('semenType')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Semen type cannot exceed 100 characters'),

  body('breed')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Breed cannot exceed 100 characters'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
];

export const updateInseminationValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid insemination ID'),

  body('inseminationDate')
    .optional()
    .isISO8601()
    .withMessage('Insemination date must be a valid date'),

  body('doctorName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Doctor name cannot exceed 100 characters'),

  body('semenType')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Semen type cannot exceed 100 characters'),

  body('breed')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Breed cannot exceed 100 characters'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
];

export const updatePregnancyStatusValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid insemination ID'),

  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['check_pending', 'pregnant_confirmed', 'failed', 'delivered'])
    .withMessage('Invalid pregnancy status'),

  body('deliveryDate')
    .optional()
    .isISO8601()
    .withMessage('Delivery date must be a valid date'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
];

export const getInseminationValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid insemination ID'),
];

export const getInseminationsFilterValidation = [
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
