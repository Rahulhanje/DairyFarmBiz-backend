import { Router } from 'express';
import {
  createMilkRate,
  getRateByDate,
  getAllRates,
  getCurrentRates,
  getRateById,
} from './milk-rate.controller';
import {
  createMilkRateValidation,
  getRateByDateValidation,
} from './milk-rate.validation';
import { validate } from '../../middlewares/validate';
import { authenticate } from '../../middlewares/auth';

const router = Router();

// All routes are protected
router.use(authenticate);

// Get current rates (must be before /:id route)
router.get('/current', getCurrentRates);

// Get rate by date and animal type
router.get('/by-date', validate(getRateByDateValidation), getRateByDate);

// Create new rate (old rates cannot be updated)
router.post('/', validate(createMilkRateValidation), createMilkRate);

// Get all rates (optional filter by animalType)
router.get('/', getAllRates);

// Get rate by ID
router.get('/:id', getRateById);

export default router;
