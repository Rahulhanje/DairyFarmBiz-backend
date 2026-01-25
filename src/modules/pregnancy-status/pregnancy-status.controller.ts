import { Response } from 'express';
import { pregnancyStatusService } from './pregnancy-status.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/responseHandler';
import { AuthRequest, PregnancyStatus } from '../../types';

/**
 * @desc    Add new status to timeline
 * @route   POST /api/v1/pregnancy-status
 * @access  Private
 */
export const addStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { inseminationId, status, notes, deliveryDate, calfCount, calfDetails } = req.body;

  const statusHistory = await pregnancyStatusService.addStatus({
    userId: req.user?.id!,
    inseminationId,
    status,
    notes,
    changedBy: req.user?.email,
    deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
    calfCount,
    calfDetails,
  });

  sendCreated(res, statusHistory, 'Status added to timeline successfully');
});

/**
 * @desc    Get status timeline for an insemination
 * @route   GET /api/v1/pregnancy-status/insemination/:inseminationId
 * @access  Private
 */
export const getTimelineByInsemination = asyncHandler(async (req: AuthRequest, res: Response) => {
  const timeline = await pregnancyStatusService.getTimelineByInsemination(
    req.user?.id!,
    req.params.inseminationId
  );
  sendSuccess(res, timeline, 'Status timeline fetched successfully');
});

/**
 * @desc    Get status history for an animal
 * @route   GET /api/v1/pregnancy-status/animal/:animalId
 * @access  Private
 */
export const getHistoryByAnimal = asyncHandler(async (req: AuthRequest, res: Response) => {
  const history = await pregnancyStatusService.getHistoryByAnimal(
    req.user?.id!,
    req.params.animalId
  );
  sendSuccess(res, history, 'Status history fetched successfully');
});

/**
 * @desc    Get all status history with filters
 * @route   GET /api/v1/pregnancy-status
 * @access  Private
 */
export const getAllHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const inseminationId = req.query.inseminationId as string | undefined;
  const animalId = req.query.animalId as string | undefined;
  const status = req.query.status as PregnancyStatus | undefined;
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

  const { history, total } = await pregnancyStatusService.getAll(
    req.user?.id!,
    { inseminationId, animalId, status, startDate, endDate },
    page,
    limit
  );

  sendPaginated(res, history, { page, limit, total }, 'Status history fetched successfully');
});

/**
 * @desc    Get current status for an insemination
 * @route   GET /api/v1/pregnancy-status/current/:inseminationId
 * @access  Private
 */
export const getCurrentStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await pregnancyStatusService.getCurrentStatus(
    req.user?.id!,
    req.params.inseminationId
  );
  sendSuccess(res, result, 'Current status fetched successfully');
});

/**
 * @desc    Get status change statistics
 * @route   GET /api/v1/pregnancy-status/statistics
 * @access  Private
 */
export const getStatistics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const statistics = await pregnancyStatusService.getStatistics(req.user?.id!);
  sendSuccess(res, statistics, 'Status statistics fetched successfully');
});

/**
 * @desc    Get available transitions for a status
 * @route   GET /api/v1/pregnancy-status/transitions/:status
 * @access  Private
 */
export const getAvailableTransitions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const status = req.params.status as PregnancyStatus;
  const transitions = pregnancyStatusService.getAvailableTransitions(status);
  sendSuccess(res, { currentStatus: status, availableTransitions: transitions }, 'Available transitions fetched successfully');
});
