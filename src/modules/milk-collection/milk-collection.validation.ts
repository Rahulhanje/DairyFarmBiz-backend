import { body, param, query } from 'express-validator';

export const createMilkCollectionValidation = [
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be a valid date'),

  body('session')
    .notEmpty()
    .withMessage('Session is required')
    .isIn(['morning', 'evening'])
    .withMessage('Session must be either morning or evening'),

  body('animalType')
    .notEmpty()
    .withMessage('Animal type is required')
    .isIn(['cow', 'buffalo'])
    .withMessage('Animal type must be either cow or buffalo'),

  body('totalMilk')
    .notEmpty()
    .withMessage('Total milk is required')
    .isFloat({ min: 0 })
    .withMessage('Total milk must be a positive number'),

  body('notes')
    .optional()
    .trim(),
];

export const updateMilkCollectionValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid milk collection ID'),

  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid date'),

  body('session')
    .optional()
    .isIn(['morning', 'evening'])
    .withMessage('Session must be either morning or evening'),

  body('animalType')
    .optional()
    .isIn(['cow', 'buffalo'])
    .withMessage('Animal type must be either cow or buffalo'),

  body('totalMilk')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total milk must be a positive number'),

  body('notes')
    .optional()
    .trim(),
];

export const getMilkCollectionValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid milk collection ID'),
];

export const getMilkCollectionsByDateValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),

  query('animalType')
    .optional()
    .isIn(['cow', 'buffalo'])
    .withMessage('Animal type must be either cow or buffalo'),

  query('session')
    .optional()
    .isIn(['morning', 'evening'])
    .withMessage('Session must be either morning or evening'),
];
