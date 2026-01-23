import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { ValidationError } from '../utils/ApiError';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);

    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = errors.array().map((err) => {
      if (err.type === 'field') {
        return { field: err.path, message: err.msg };
      }
      return { message: err.msg };
    });

    const errorMessage = extractedErrors
      .map((e) => ('field' in e ? `${e.field}: ${e.message}` : e.message))
      .join(', ');

    next(new ValidationError(errorMessage));
  };
};
