import { Request, Response } from 'express';
import { expenseService } from './expense.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/responseHandler';
import { ExpenseCategory } from '../../types';

/**
 * @desc    Create new expense
 * @route   POST /api/v1/expenses
 * @access  Private
 */
export const createExpense = asyncHandler(async (req: Request, res: Response) => {
  const { name, amount, date, category, notes } = req.body;

  const expense = await expenseService.create({
    name,
    amount,
    date: date ? new Date(date) : undefined,
    category,
    notes,
  });

  sendCreated(res, expense, 'Expense created successfully');
});

/**
 * @desc    Get all expenses
 * @route   GET /api/v1/expenses
 * @access  Private
 */
export const getExpenses = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
  const category = req.query.category as ExpenseCategory | undefined;
  const search = req.query.search as string | undefined;

  const { expenses, total } = await expenseService.getAll(
    { startDate, endDate, category, search },
    page,
    limit
  );

  sendPaginated(res, expenses, { page, limit, total }, 'Expenses fetched successfully');
});

/**
 * @desc    Get expense by ID
 * @route   GET /api/v1/expenses/:id
 * @access  Private
 */
export const getExpense = asyncHandler(async (req: Request, res: Response) => {
  const expense = await expenseService.getById(req.params.id);
  sendSuccess(res, expense, 'Expense fetched successfully');
});

/**
 * @desc    Update expense
 * @route   PUT /api/v1/expenses/:id
 * @access  Private
 */
export const updateExpense = asyncHandler(async (req: Request, res: Response) => {
  const { name, amount, date, category, notes } = req.body;

  const expense = await expenseService.update(req.params.id, {
    name,
    amount,
    date: date ? new Date(date) : undefined,
    category,
    notes,
  });

  sendSuccess(res, expense, 'Expense updated successfully');
});

/**
 * @desc    Delete expense
 * @route   DELETE /api/v1/expenses/:id
 * @access  Private
 */
export const deleteExpense = asyncHandler(async (req: Request, res: Response) => {
  const expense = await expenseService.delete(req.params.id);
  sendSuccess(res, expense, 'Expense deleted successfully');
});

/**
 * @desc    Get expenses total by date range
 * @route   GET /api/v1/expenses/total
 * @access  Private
 */
export const getExpensesTotal = asyncHandler(async (req: Request, res: Response) => {
  const startDate = req.query.startDate 
    ? new Date(req.query.startDate as string) 
    : new Date(new Date().setMonth(new Date().getMonth() - 1));
  const endDate = req.query.endDate 
    ? new Date(req.query.endDate as string) 
    : new Date();

  const result = await expenseService.getTotalByDateRange(startDate, endDate);

  sendSuccess(res, result, 'Expenses total fetched successfully');
});

/**
 * @desc    Get expenses summary by category
 * @route   GET /api/v1/expenses/summary
 * @access  Private
 */
export const getExpensesSummary = asyncHandler(async (_req: Request, res: Response) => {
  const summary = await expenseService.getSummaryByCategory();
  sendSuccess(res, summary, 'Expenses summary fetched successfully');
});
