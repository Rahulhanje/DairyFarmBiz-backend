import mongoose from 'mongoose';
import { Expense, IExpense } from './expense.model';
import { ExpenseCategory } from '../../types';
import { NotFoundError } from '../../utils/ApiError';

/**
 * Normalize a date to UTC midnight (start of day in UTC)
 */
const normalizeToUTCMidnight = (date: Date | string): Date => {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
};

/**
 * Get UTC end of day (23:59:59.999)
 */
const getUTCEndOfDay = (date: Date | string): Date => {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
};

export interface CreateExpenseData {
  userId: string;
  name: string;
  amount: number;
  date?: Date;
  category: ExpenseCategory;
  notes?: string;
}

export interface UpdateExpenseData {
  name?: string;
  amount?: number;
  date?: Date;
  category?: ExpenseCategory;
  notes?: string;
}

export interface ExpenseFilter {
  startDate?: Date;
  endDate?: Date;
  category?: ExpenseCategory;
  search?: string;
}

class ExpenseService {
  /**
   * Create a new expense
   */
  async create(userId: string, data: CreateExpenseData): Promise<IExpense> {
    const expenseDate = data.date ? normalizeToUTCMidnight(data.date) : normalizeToUTCMidnight(new Date());

    const expense = await Expense.create({
      ...data,
      userId,
      date: expenseDate,
    });

    return expense;
  }

  /**
   * Get all expenses with filters
   */
  async getAll(
    userId: string,
    filter: ExpenseFilter = {},
    page = 1,
    limit = 10
  ): Promise<{ expenses: IExpense[]; total: number }> {
    const query: Record<string, unknown> = { userId };

    if (filter.startDate || filter.endDate) {
      query.date = {};
      if (filter.startDate) {
        (query.date as Record<string, Date>).$gte = normalizeToUTCMidnight(filter.startDate);
      }
      if (filter.endDate) {
        (query.date as Record<string, Date>).$lte = getUTCEndOfDay(filter.endDate);
      }
    }

    if (filter.category) {
      query.category = filter.category;
    }

    if (filter.search) {
      query.name = { $regex: filter.search, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const [expenses, total] = await Promise.all([
      Expense.find(query)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Expense.countDocuments(query),
    ]);

    return { expenses, total };
  }

  /**
   * Get expense by ID
   */
  async getById(userId: string, id: string): Promise<IExpense> {
    const expense = await Expense.findOne({ _id: id, userId });

    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    return expense;
  }

  /**
   * Update expense
   */
  async update(userId: string, id: string, data: UpdateExpenseData): Promise<IExpense> {
    const expense = await Expense.findOne({ _id: id, userId });

    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    // Normalize date if provided
    if (data.date) {
      data.date = normalizeToUTCMidnight(data.date);
    }

    const updatedExpense = await Expense.findOneAndUpdate(
      { _id: id, userId },
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!updatedExpense) {
      throw new NotFoundError('Expense not found');
    }

    return updatedExpense;
  }

  /**
   * Delete expense
   */
  async delete(userId: string, id: string): Promise<IExpense> {
    const expense = await Expense.findOne({ _id: id, userId });

    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    await Expense.findOneAndDelete({ _id: id, userId });

    return expense;
  }

  /**
   * Get total expenses for a date range
   */
  async getTotalByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ total: number; count: number; byCategory: Record<string, number> }> {
    const start = normalizeToUTCMidnight(startDate);
    const end = getUTCEndOfDay(endDate);

    const result = await Expense.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const byCategory: Record<string, number> = {};
    let grandTotal = 0;
    let totalCount = 0;

    for (const item of result) {
      byCategory[item._id] = item.total;
      grandTotal += item.total;
      totalCount += item.count;
    }

    return {
      total: grandTotal,
      count: totalCount,
      byCategory,
    };
  }

  /**
   * Get expenses summary by category with optional filters
   */
  async getSummaryByCategory(
    userId: string,
    filter: ExpenseFilter = {}
  ): Promise<{ total: number; byCategory: Array<{ category: string; amount: number; count: number }> }> {
    const matchQuery: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(userId),
    };

    // Apply date filter if provided
    if (filter.startDate || filter.endDate) {
      matchQuery.date = {};
      if (filter.startDate) {
        (matchQuery.date as Record<string, Date>).$gte = normalizeToUTCMidnight(filter.startDate);
      }
      if (filter.endDate) {
        (matchQuery.date as Record<string, Date>).$lte = getUTCEndOfDay(filter.endDate);
      }
    }

    // Apply category filter if provided
    if (filter.category) {
      matchQuery.category = filter.category;
    }

    const result = await Expense.aggregate([
      {
        $match: matchQuery,
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          amount: '$total',
          count: 1,
        },
      },
      {
        $sort: { amount: -1 },
      },
    ]);

    // Calculate grand total
    const grandTotal = result.reduce((sum, item) => sum + item.amount, 0);

    return {
      total: grandTotal,
      byCategory: result,
    };
  }
}

export const expenseService = new ExpenseService();
