import { Router } from 'express';
import {
  addStatus,
  getTimelineByInsemination,
  getHistoryByAnimal,
  getAllHistory,
  getCurrentStatus,
  getStatistics,
  getAvailableTransitions,
} from './pregnancy-status.controller';
import {
  addStatusValidation,
  getHistoryByInseminationValidation,
  getHistoryByAnimalValidation,
  getHistoryFilterValidation,
} from './pregnancy-status.validation';
import { validate } from '../../middlewares/validate';
import { authenticate } from '../../middlewares/auth';

const router = Router();

// All routes are protected
router.use(authenticate);

// Special routes (must be before dynamic routes)
router.get('/statistics', getStatistics);
router.get('/transitions/:status', getAvailableTransitions);
router.get('/current/:inseminationId', validate(getHistoryByInseminationValidation), getCurrentStatus);
router.get('/insemination/:inseminationId', validate(getHistoryByInseminationValidation), getTimelineByInsemination);
router.get('/animal/:animalId', validate(getHistoryByAnimalValidation), getHistoryByAnimal);

// Main routes
router.post('/', validate(addStatusValidation), addStatus);
router.get('/', validate(getHistoryFilterValidation), getAllHistory);

export default router;
