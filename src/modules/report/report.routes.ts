import { Router } from 'express';
import { authenticate } from '../../middlewares/auth';
import {
  downloadWeeklyReport,
  downloadMonthlyReport,
  downloadTotalReport,
  downloadCustomReport,
} from './report.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// @route   GET /api/v1/reports/weekly
// @desc    Download weekly report (last 7 days)
// @access  Private
router.get('/weekly', downloadWeeklyReport);

// @route   GET /api/v1/reports/monthly
// @desc    Download monthly report (current month)
// @access  Private
router.get('/monthly', downloadMonthlyReport);

// @route   GET /api/v1/reports/total
// @desc    Download total report (all time data)
// @access  Private
router.get('/total', downloadTotalReport);

// @route   GET /api/v1/reports/custom
// @desc    Download custom date range report
// @access  Private
// @query   startDate, endDate (ISO date strings)
router.get('/custom', downloadCustomReport);

export default router;
