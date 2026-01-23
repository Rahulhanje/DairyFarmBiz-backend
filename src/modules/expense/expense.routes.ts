import { Router } from 'express';
import {
  createExpense,
  getExpenses,
  getExpense,
  updateExpense,
  deleteExpense,
  getExpensesTotal,
  getExpensesSummary,
} from './expense.controller';
import {
  createExpenseValidation,
  updateExpenseValidation,
  getExpenseValidation,
  getExpensesFilterValidation,
} from './expense.validation';
import { validate } from '../../middlewares/validate';
import { authenticate } from '../../middlewares/auth';

const router = Router();

// All routes are protected
router.use(authenticate);

// Special routes (must be before /:id)
router.get('/total', getExpensesTotal);
router.get('/summary', getExpensesSummary);

// CRUD routes
router.post('/', validate(createExpenseValidation), createExpense);
router.get('/', validate(getExpensesFilterValidation), getExpenses);
router.get('/:id', validate(getExpenseValidation), getExpense);
router.put('/:id', validate(updateExpenseValidation), updateExpense);
router.delete('/:id', validate(getExpenseValidation), deleteExpense);

export default router;
