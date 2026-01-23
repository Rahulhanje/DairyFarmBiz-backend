import { Router } from 'express';
import {
  createAnimal,
  getAnimals,
  getAnimal,
  updateAnimal,
  sellAnimal,
  deleteAnimal,
  getAnimalCounts,
  getActiveAnimalsByType,
} from './animal.controller';
import {
  createAnimalValidation,
  updateAnimalValidation,
  sellAnimalValidation,
  getAnimalValidation,
} from './animal.validation';
import { validate } from '../../middlewares/validate';
import { authenticate } from '../../middlewares/auth';

const router = Router();

// All routes are protected
router.use(authenticate);

// Get animal counts (must be before /:id route)
router.get('/counts', getAnimalCounts);

// Get active animals by type
router.get('/active/:animalType', getActiveAnimalsByType);

// CRUD routes
router.post('/', validate(createAnimalValidation), createAnimal);
router.get('/', getAnimals);
router.get('/:id', validate(getAnimalValidation), getAnimal);
router.put('/:id', validate(updateAnimalValidation), updateAnimal);
router.delete('/:id', validate(getAnimalValidation), deleteAnimal);

// Sell animal
router.patch('/:id/sell', validate(sellAnimalValidation), sellAnimal);

export default router;
