import { Router } from 'express';
import {
  createInsemination,
  getInseminations,
  getInsemination,
  getInseminationsByAnimal,
  updateInsemination,
  updatePregnancyStatus,
  deleteInsemination,
  getPendingChecks,
  getStatistics,
} from './breeding.controller';
import {
  createInseminationValidation,
  updateInseminationValidation,
  updatePregnancyStatusValidation,
  getInseminationValidation,
  getInseminationsFilterValidation,
} from './breeding.validation';
import { validate } from '../../middlewares/validate';
import { authenticate } from '../../middlewares/auth';

const router = Router();

// All routes are protected
router.use(authenticate);

// Special routes (must be before /:id)
router.get('/pending-checks', getPendingChecks);
router.get('/statistics', getStatistics);
router.get('/animal/:animalId', getInseminationsByAnimal);

// CRUD routes
router.post('/', validate(createInseminationValidation), createInsemination);
router.get('/', validate(getInseminationsFilterValidation), getInseminations);
router.get('/:id', validate(getInseminationValidation), getInsemination);
router.put('/:id', validate(updateInseminationValidation), updateInsemination);
router.delete('/:id', validate(getInseminationValidation), deleteInsemination);

// Status update
router.patch('/:id/status', validate(updatePregnancyStatusValidation), updatePregnancyStatus);

export default router;
