import { Request, Response } from 'express';
import { dashboardService, Period } from './dashboard.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/responseHandler';

/**
 * @desc    Get dashboard summary
 * @route   GET /api/v1/dashboard/summary
 * @access  Private
 */
export const getDashboardSummary = asyncHandler(async (req: Request, res: Response) => {
  const period = (req.query.period as Period) || 'monthly';
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

  const summary = await dashboardService.getDashboardSummary(period, startDate, endDate);
  sendSuccess(res, summary, 'Dashboard summary fetched successfully');
});

/**
 * @desc    Get milk collection trends
 * @route   GET /api/v1/dashboard/milk-trends
 * @access  Private
 */
export const getMilkTrends = asyncHandler(async (req: Request, res: Response) => {
  const period = (req.query.period as Period) || 'monthly';
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

  const trends = await dashboardService.getMilkTrends(period, startDate, endDate);
  sendSuccess(res, trends, 'Milk trends fetched successfully');
});

/**
 * @desc    Get expense trends
 * @route   GET /api/v1/dashboard/expense-trends
 * @access  Private
 */
export const getExpenseTrends = asyncHandler(async (req: Request, res: Response) => {
  const period = (req.query.period as Period) || 'monthly';
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

  const trends = await dashboardService.getExpenseTrends(period, startDate, endDate);
  sendSuccess(res, trends, 'Expense trends fetched successfully');
});

/**
 * @desc    Get profit/loss trends
 * @route   GET /api/v1/dashboard/profit-loss-trends
 * @access  Private
 */
export const getProfitLossTrends = asyncHandler(async (req: Request, res: Response) => {
  const period = (req.query.period as Period) || 'monthly';
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

  const trends = await dashboardService.getProfitLossTrends(period, startDate, endDate);
  sendSuccess(res, trends, 'Profit/loss trends fetched successfully');
});

/**
 * @desc    Get cow milk summary
 * @route   GET /api/v1/dashboard/cow-milk
 * @access  Private
 */
export const getCowMilkSummary = asyncHandler(async (req: Request, res: Response) => {
  const period = (req.query.period as Period) || 'monthly';
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

  const dateRange = dashboardService.getDateRange(period, startDate, endDate);
  const summary = await dashboardService.getMilkSummary('cow', dateRange);
  sendSuccess(res, { dateRange, ...summary }, 'Cow milk summary fetched successfully');
});

/**
 * @desc    Get buffalo milk summary
 * @route   GET /api/v1/dashboard/buffalo-milk
 * @access  Private
 */
export const getBuffaloMilkSummary = asyncHandler(async (req: Request, res: Response) => {
  const period = (req.query.period as Period) || 'monthly';
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

  const dateRange = dashboardService.getDateRange(period, startDate, endDate);
  const summary = await dashboardService.getMilkSummary('buffalo', dateRange);
  sendSuccess(res, { dateRange, ...summary }, 'Buffalo milk summary fetched successfully');
});

/**
 * @desc    Get animal statistics
 * @route   GET /api/v1/dashboard/animal-stats
 * @access  Private
 */
export const getAnimalStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await dashboardService.getAnimalStats();
  sendSuccess(res, stats, 'Animal statistics fetched successfully');
});

/**
 * @desc    Get breeding statistics
 * @route   GET /api/v1/dashboard/breeding-stats
 * @access  Private
 */
export const getBreedingStats = asyncHandler(async (req: Request, res: Response) => {
  const period = (req.query.period as Period) || 'monthly';
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

  const dateRange = dashboardService.getDateRange(period, startDate, endDate);
  const stats = await dashboardService.getBreedingStats(dateRange);
  sendSuccess(res, { dateRange, ...stats }, 'Breeding statistics fetched successfully');
});
