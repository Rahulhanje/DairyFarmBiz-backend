import { Request, Response } from 'express';
import { milkRateService } from './milk-rate.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../../utils/responseHandler';
import { AnimalType } from '../../types';

/**
 * @desc    Create new milk rate
 * @route   POST /api/v1/milk-rates
 * @access  Private
 */
export const createMilkRate = asyncHandler(async (req: Request, res: Response) => {
  const { animalType, ratePerLiter, effectiveFrom } = req.body;

  const rate = await milkRateService.create({
    animalType,
    ratePerLiter,
    effectiveFrom: new Date(effectiveFrom),
  });

  sendCreated(res, rate, 'Milk rate created successfully');
});

/**
 * @desc    Get rate by date and animal type
 * @route   GET /api/v1/milk-rates/by-date
 * @access  Private
 */
export const getRateByDate = asyncHandler(async (req: Request, res: Response) => {
  const animalType = req.query.animalType as AnimalType;
  const date = new Date(req.query.date as string);

  const rate = await milkRateService.getRateByDate(animalType, date);

  sendSuccess(res, rate, 'Milk rate fetched successfully');
});

/**
 * @desc    Get all rates
 * @route   GET /api/v1/milk-rates
 * @access  Private
 */
export const getAllRates = asyncHandler(async (req: Request, res: Response) => {
  const animalType = req.query.animalType as AnimalType | undefined;

  let rates;
  if (animalType) {
    rates = await milkRateService.getAllByType(animalType);
  } else {
    rates = await milkRateService.getAll();
  }

  sendSuccess(res, rates, 'Milk rates fetched successfully');
});

/**
 * @desc    Get current applicable rates for cow and buffalo
 * @route   GET /api/v1/milk-rates/current
 * @access  Private
 */
export const getCurrentRates = asyncHandler(async (_req: Request, res: Response) => {
  const rates = await milkRateService.getCurrentRates();

  sendSuccess(res, rates, 'Current milk rates fetched successfully');
});

/**
 * @desc    Get rate by ID
 * @route   GET /api/v1/milk-rates/:id
 * @access  Private
 */
export const getRateById = asyncHandler(async (req: Request, res: Response) => {
  const rate = await milkRateService.getById(req.params.id);

  sendSuccess(res, rate, 'Milk rate fetched successfully');
});
