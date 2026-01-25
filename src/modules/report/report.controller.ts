import { Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { reportService, ReportType } from './report.service';
import { ApiError } from '../../utils/ApiError';
import { AuthRequest } from '../../types';

/**
 * @route   GET /api/v1/reports/weekly
 * @desc    Download weekly report (last 7 days)
 * @access  Private
 */
export const downloadWeeklyReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  
  const workbook = await reportService.generateExcel(userId, 'weekly');
  const filename = reportService.generateFilename('weekly');
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  
  await workbook.xlsx.write(res);
  res.end();
});

/**
 * @route   GET /api/v1/reports/monthly
 * @desc    Download monthly report (current month)
 * @access  Private
 */
export const downloadMonthlyReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  
  const workbook = await reportService.generateExcel(userId, 'monthly');
  const filename = reportService.generateFilename('monthly');
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  
  await workbook.xlsx.write(res);
  res.end();
});

/**
 * @route   GET /api/v1/reports/total
 * @desc    Download total report (all data)
 * @access  Private
 */
export const downloadTotalReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  
  const workbook = await reportService.generateExcel(userId, 'total');
  const filename = reportService.generateFilename('total');
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  
  await workbook.xlsx.write(res);
  res.end();
});

/**
 * @route   GET /api/v1/reports/custom
 * @desc    Download custom date range report
 * @access  Private
 */
export const downloadCustomReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    throw new ApiError(400, 'Start date and end date are required');
  }
  
  const start = startDate.toString();
  const end = endDate.toString();
  
  // Validate dates
  const startDateObj = new Date(start);
  const endDateObj = new Date(end);
  
  if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
    throw new ApiError(400, 'Invalid date format');
  }
  
  if (startDateObj > endDateObj) {
    throw new ApiError(400, 'Start date must be before end date');
  }
  
  const workbook = await reportService.generateExcel(userId, 'custom', start, end);
  const filename = reportService.generateFilename('custom', start, end);
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  
  await workbook.xlsx.write(res);
  res.end();
});
