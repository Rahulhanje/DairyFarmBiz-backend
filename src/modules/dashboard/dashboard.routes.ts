import { Router } from 'express';
import {
  getDashboardSummary,
  getMilkTrends,
  getExpenseTrends,
  getProfitLossTrends,
  getCowMilkSummary,
  getBuffaloMilkSummary,
  getAnimalStats,
  getBreedingStats,
} from './dashboard.controller';
import { dashboardFilterValidation } from './dashboard.validation';
import { validate } from '../../middlewares/validate';
import { authenticate } from '../../middlewares/auth';

const router = Router();

// All routes are protected
router.use(authenticate);

// Dashboard routes
router.get('/summary', validate(dashboardFilterValidation), getDashboardSummary);
router.get('/milk-trends', validate(dashboardFilterValidation), getMilkTrends);
router.get('/expense-trends', validate(dashboardFilterValidation), getExpenseTrends);
router.get('/profit-loss-trends', validate(dashboardFilterValidation), getProfitLossTrends);
router.get('/cow-milk', validate(dashboardFilterValidation), getCowMilkSummary);
router.get('/buffalo-milk', validate(dashboardFilterValidation), getBuffaloMilkSummary);
router.get('/animal-stats', getAnimalStats);
router.get('/breeding-stats', validate(dashboardFilterValidation), getBreedingStats);

export default router;
