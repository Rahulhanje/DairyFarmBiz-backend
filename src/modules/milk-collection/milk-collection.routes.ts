import { Router } from 'express';
import {
  createMilkCollection,
  getMilkCollections,
  getMilkCollection,
  updateMilkCollection,
  deleteMilkCollection,
  getDailySummary,
  getByDate,
} from './milk-collection.controller';
import {
  createMilkCollectionValidation,
  updateMilkCollectionValidation,
  getMilkCollectionValidation,
  getMilkCollectionsByDateValidation,
} from './milk-collection.validation';
import { validate } from '../../middlewares/validate';
import { authenticate } from '../../middlewares/auth';

const router = Router();

// All routes are protected
router.use(authenticate);

// Special routes (must be before /:id)
router.get('/daily-summary', getDailySummary);
router.get('/by-date', getByDate);

// CRUD routes
router.post('/', validate(createMilkCollectionValidation), createMilkCollection);
router.get('/', validate(getMilkCollectionsByDateValidation), getMilkCollections);
router.get('/:id', validate(getMilkCollectionValidation), getMilkCollection);
router.put('/:id', validate(updateMilkCollectionValidation), updateMilkCollection);
router.delete('/:id', validate(getMilkCollectionValidation), deleteMilkCollection);

export default router;
