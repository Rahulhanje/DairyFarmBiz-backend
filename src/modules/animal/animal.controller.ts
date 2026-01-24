import { Response } from 'express';
import { AuthRequest } from '../../types';
import { animalService } from './animal.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/responseHandler';
import { AnimalType } from '../../types';

/**
 * @desc    Create new animal
 * @route   POST /api/v1/animals
 * @access  Private
 */
export const createAnimal = asyncHandler(async (req: AuthRequest, res: Response) => {
  const animal = await animalService.create({
    ...req.body,
    userId: req.user?.id,
  });
  sendCreated(res, animal, 'Animal created successfully');
});

/**
 * @desc    Get all animals
 * @route   GET /api/v1/animals
 * @access  Private
 */
export const getAnimals = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const animalType = req.query.animalType as AnimalType | undefined;
  const isSold = req.query.isSold === 'true' ? true : req.query.isSold === 'false' ? false : undefined;
  const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
  const search = req.query.search as string | undefined;

  const { animals, total } = await animalService.getAll(
    req.user?.id!,
    { animalType, isSold, isActive, search },
    page,
    limit
  );

  sendPaginated(res, animals, { page, limit, total }, 'Animals fetched successfully');
});

/**
 * @desc    Get animal by ID
 * @route   GET /api/v1/animals/:id
 * @access  Private
 */
export const getAnimal = asyncHandler(async (req: AuthRequest, res: Response) => {
  const animal = await animalService.getById(req.params.id, req.user?.id!);
  sendSuccess(res, animal, 'Animal fetched successfully');
});

/**
 * @desc    Update animal
 * @route   PUT /api/v1/animals/:id
 * @access  Private
 */
export const updateAnimal = asyncHandler(async (req: AuthRequest, res: Response) => {
  const animal = await animalService.update(req.params.id, req.user?.id!, req.body);
  sendSuccess(res, animal, 'Animal updated successfully');
});

/**
 * @desc    Sell animal
 * @route   PATCH /api/v1/animals/:id/sell
 * @access  Private
 */
export const sellAnimal = asyncHandler(async (req: AuthRequest, res: Response) => {
  const animal = await animalService.sell(req.params.id, req.user?.id!, req.body);
  sendSuccess(res, animal, 'Animal marked as sold successfully');
});

/**
 * @desc    Delete animal (soft delete)
 * @route   DELETE /api/v1/animals/:id
 * @access  Private
 */
export const deleteAnimal = asyncHandler(async (req: AuthRequest, res: Response) => {
  const animal = await animalService.delete(req.params.id, req.user?.id!);
  sendSuccess(res, animal, 'Animal deleted successfully');
});

/**
 * @desc    Get animal counts
 * @route   GET /api/v1/animals/counts
 * @access  Private
 */
export const getAnimalCounts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const counts = await animalService.getCounts(req.user?.id!);
  sendSuccess(res, counts, 'Animal counts fetched successfully');
});

/**
 * @desc    Get active animals by type
 * @route   GET /api/v1/animals/active/:animalType
 * @access  Private
 */
export const getActiveAnimalsByType = asyncHandler(async (req: AuthRequest, res: Response) => {
  const animalType = req.params.animalType as AnimalType;
  const animals = await animalService.getActiveByType(animalType, req.user?.id!);
  sendSuccess(res, animals, `Active ${animalType}s fetched successfully`);
});
