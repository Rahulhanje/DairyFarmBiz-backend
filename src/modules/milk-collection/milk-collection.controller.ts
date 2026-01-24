import { Request, Response } from 'express';
import { milkCollectionService } from './milk-collection.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/responseHandler';
import { AnimalType, MilkSession } from '../../types';

/**
 * @desc    Create new milk collection entry
 * @route   POST /api/v1/milk-collection
 * @access  Private
 */
export const createMilkCollection = asyncHandler(async (req: Request, res: Response) => {
  const { date, session, animalType, totalMilk, notes } = req.body;

  const collection = await milkCollectionService.create({
    date: new Date(date),
    session,
    animalType,
    totalMilk,
    notes,
  });

  sendCreated(res, collection, 'Milk collection entry created successfully');
});

/**
 * @desc    Get all milk collection entries
 * @route   GET /api/v1/milk-collection
 * @access  Private
 */
export const getMilkCollections = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  // Use limit=0 to fetch all records (when filters are applied)
  const limitParam = req.query.limit as string;
  const limit = limitParam !== undefined ? parseInt(limitParam) : 10;
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
  const animalType = req.query.animalType as AnimalType | undefined;
  const session = req.query.session as MilkSession | undefined;

  const { collections, total } = await milkCollectionService.getAll(
    { startDate, endDate, animalType, session },
    page,
    limit
  );

  sendPaginated(res, collections, { page, limit, total }, 'Milk collections fetched successfully');
});

/**
 * @desc    Get milk collection entry by ID
 * @route   GET /api/v1/milk-collection/:id
 * @access  Private
 */
export const getMilkCollection = asyncHandler(async (req: Request, res: Response) => {
  const collection = await milkCollectionService.getById(req.params.id);
  sendSuccess(res, collection, 'Milk collection entry fetched successfully');
});

/**
 * @desc    Update milk collection entry
 * @route   PUT /api/v1/milk-collection/:id
 * @access  Private
 */
export const updateMilkCollection = asyncHandler(async (req: Request, res: Response) => {
  const { date, session, animalType, totalMilk, notes } = req.body;

  const collection = await milkCollectionService.update(req.params.id, {
    date: date ? new Date(date) : undefined,
    session,
    animalType,
    totalMilk,
    notes,
  });

  sendSuccess(res, collection, 'Milk collection entry updated successfully');
});

/**
 * @desc    Delete milk collection entry
 * @route   DELETE /api/v1/milk-collection/:id
 * @access  Private
 */
export const deleteMilkCollection = asyncHandler(async (req: Request, res: Response) => {
  const collection = await milkCollectionService.delete(req.params.id);
  sendSuccess(res, collection, 'Milk collection entry deleted successfully');
});

/**
 * @desc    Get daily summary
 * @route   GET /api/v1/milk-collection/daily-summary
 * @access  Private
 */
export const getDailySummary = asyncHandler(async (req: Request, res: Response) => {
  const date = req.query.date ? new Date(req.query.date as string) : new Date();

  const summary = await milkCollectionService.getDailySummary(date);

  sendSuccess(res, summary, 'Daily summary fetched successfully');
});

/**
 * @desc    Get entries for a specific date
 * @route   GET /api/v1/milk-collection/by-date
 * @access  Private
 */
export const getByDate = asyncHandler(async (req: Request, res: Response) => {
  const date = req.query.date ? new Date(req.query.date as string) : new Date();

  const collections = await milkCollectionService.getByDate(date);

  sendSuccess(res, collections, 'Milk collections fetched successfully');
});
