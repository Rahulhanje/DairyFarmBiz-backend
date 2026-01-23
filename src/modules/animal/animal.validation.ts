import { body, param } from 'express-validator';

export const createAnimalValidation = [
  body('serialNumber')
    .trim()
    .notEmpty()
    .withMessage('Serial number is required'),

  body('nickName')
    .trim()
    .notEmpty()
    .withMessage('Nick name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Nick name must be between 1 and 100 characters'),

  body('animalType')
    .notEmpty()
    .withMessage('Animal type is required')
    .isIn(['cow', 'buffalo'])
    .withMessage('Animal type must be either cow or buffalo'),

  body('identificationTag')
    .optional()
    .trim(),

  body('breed')
    .optional()
    .trim(),

  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Date of birth must be a valid date'),

  body('gender')
    .optional()
    .isIn(['male', 'female'])
    .withMessage('Gender must be either male or female'),

  body('purchaseDate')
    .optional()
    .isISO8601()
    .withMessage('Purchase date must be a valid date'),

  body('purchasePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Purchase price must be a positive number'),

  body('purchasePlace')
    .optional()
    .trim(),

  body('notes')
    .optional()
    .trim(),
];

export const updateAnimalValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid animal ID'),

  body('serialNumber')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Serial number cannot be empty'),

  body('nickName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Nick name cannot be empty')
    .isLength({ min: 1, max: 100 })
    .withMessage('Nick name must be between 1 and 100 characters'),

  body('animalType')
    .optional()
    .isIn(['cow', 'buffalo'])
    .withMessage('Animal type must be either cow or buffalo'),

  body('identificationTag')
    .optional()
    .trim(),

  body('breed')
    .optional()
    .trim(),

  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Date of birth must be a valid date'),

  body('gender')
    .optional()
    .isIn(['male', 'female'])
    .withMessage('Gender must be either male or female'),

  body('purchaseDate')
    .optional()
    .isISO8601()
    .withMessage('Purchase date must be a valid date'),

  body('purchasePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Purchase price must be a positive number'),

  body('purchasePlace')
    .optional()
    .trim(),

  body('notes')
    .optional()
    .trim(),
];

export const sellAnimalValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid animal ID'),

  body('soldDate')
    .optional()
    .isISO8601()
    .withMessage('Sold date must be a valid date'),

  body('soldPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Sold price must be a positive number'),

  body('soldTo')
    .optional()
    .trim(),

  body('soldNotes')
    .optional()
    .trim(),
];

export const getAnimalValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid animal ID'),
];
