import { body, query } from 'express-validator';

export const createMilkRateValidation = [
  body('animalType')
    .notEmpty()
    .withMessage('Animal type is required')
    .isIn(['cow', 'buffalo'])
    .withMessage('Animal type must be either cow or buffalo'),

  body('ratePerLiter')
    .notEmpty()
    .withMessage('Rate per liter is required')
    .isFloat({ min: 0 })
    .withMessage('Rate per liter must be a positive number'),

  body('effectiveFrom')
    .notEmpty()
    .withMessage('Effective from date is required')
    .isISO8601()
    .withMessage('Effective from must be a valid date'),
];

export const getRateByDateValidation = [
  query('animalType')
    .notEmpty()
    .withMessage('Animal type is required')
    .isIn(['cow', 'buffalo'])
    .withMessage('Animal type must be either cow or buffalo'),

  query('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be a valid date'),
];
