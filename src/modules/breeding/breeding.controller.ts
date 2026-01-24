import { Request, Response } from 'express';
import { AuthRequest } from '../../types';
import { breedingService } from './breeding.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/responseHandler';
import { PregnancyStatus } from '../../types';

/**
 * @desc    Create new insemination record
 * @route   POST /api/v1/breeding
 * @access  Private
 */
export const createInsemination = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { animalId, inseminationDate, doctorName, semenType, breed, notes } = req.body;

  const insemination = await breedingService.create({
    animalId,
    inseminationDate: new Date(inseminationDate),
    doctorName,
    semenType,
    breed,
    notes,
    userEmail: req.user?.email, // Pass the logged-in user's email
  });

  sendCreated(res, insemination, 'Insemination record created successfully');
});

/**
 * @desc    Get all insemination records
 * @route   GET /api/v1/breeding
 * @access  Private
 */
export const getInseminations = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const animalId = req.query.animalId as string | undefined;
  const status = req.query.status as PregnancyStatus | undefined;
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

  const { inseminations, total } = await breedingService.getAll(
    { animalId, status, startDate, endDate },
    page,
    limit
  );

  sendPaginated(res, inseminations, { page, limit, total }, 'Insemination records fetched successfully');
});

/**
 * @desc    Get insemination record by ID
 * @route   GET /api/v1/breeding/:id
 * @access  Private
 */
export const getInsemination = asyncHandler(async (req: Request, res: Response) => {
  const insemination = await breedingService.getById(req.params.id);
  sendSuccess(res, insemination, 'Insemination record fetched successfully');
});

/**
 * @desc    Get insemination records by animal ID
 * @route   GET /api/v1/breeding/animal/:animalId
 * @access  Private
 */
export const getInseminationsByAnimal = asyncHandler(async (req: Request, res: Response) => {
  const inseminations = await breedingService.getByAnimalId(req.params.animalId);
  sendSuccess(res, inseminations, 'Insemination records fetched successfully');
});

/**
 * @desc    Update insemination record
 * @route   PUT /api/v1/breeding/:id
 * @access  Private
 */
export const updateInsemination = asyncHandler(async (req: Request, res: Response) => {
  const { inseminationDate, doctorName, semenType, breed, notes } = req.body;

  const insemination = await breedingService.update(req.params.id, {
    inseminationDate: inseminationDate ? new Date(inseminationDate) : undefined,
    doctorName,
    semenType,
    breed,
    notes,
  });

  sendSuccess(res, insemination, 'Insemination record updated successfully');
});

/**
 * @desc    Update pregnancy status
 * @route   PATCH /api/v1/breeding/:id/status
 * @access  Private
 */
export const updatePregnancyStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status, deliveryDate, notes } = req.body;

  const insemination = await breedingService.updateStatus(req.params.id, {
    status,
    deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
    notes,
  });

  sendSuccess(res, insemination, 'Pregnancy status updated successfully');
});

/**
 * @desc    Delete insemination record
 * @route   DELETE /api/v1/breeding/:id
 * @access  Private
 */
export const deleteInsemination = asyncHandler(async (req: Request, res: Response) => {
  const insemination = await breedingService.delete(req.params.id);
  sendSuccess(res, insemination, 'Insemination record deleted successfully');
});

/**
 * @desc    Get pending pregnancy checks
 * @route   GET /api/v1/breeding/pending-checks
 * @access  Private
 */
export const getPendingChecks = asyncHandler(async (_req: Request, res: Response) => {
  const inseminations = await breedingService.getPendingPregnancyChecks();
  sendSuccess(res, inseminations, 'Pending pregnancy checks fetched successfully');
});

/**
 * @desc    Get pregnancy statistics
 * @route   GET /api/v1/breeding/statistics
 * @access  Private
 */
export const getStatistics = asyncHandler(async (_req: Request, res: Response) => {
  const statistics = await breedingService.getStatistics();
  sendSuccess(res, statistics, 'Pregnancy statistics fetched successfully');
});
