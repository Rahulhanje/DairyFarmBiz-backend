import { Expense, IExpense } from './expense.model';
import { ExpenseCategory } from '../../types';
import { NotFoundError } from '../../utils/ApiError';

export interface CreateExpenseData {
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
  async create(data: CreateExpenseData): Promise<IExpense> {
    const expenseDate = data.date ? new Date(data.date) : new Date();
    expenseDate.setHours(0, 0, 0, 0);

    const expense = await Expense.create({
      ...data,
      date: expenseDate,
    });

    return expense;
  }

  /**
   * Get all expenses with filters
   */
  async getAll(
    filter: ExpenseFilter = {},
    page = 1,
    limit = 10
  ): Promise<{ expenses: IExpense[]; total: number }> {
    const query: Record<string, unknown> = {};

    if (filter.startDate || filter.endDate) {
      query.date = {};
      if (filter.startDate) {
        const startDate = new Date(filter.startDate);
        startDate.setHours(0, 0, 0, 0);
        (query.date as Record<string, Date>).$gte = startDate;
      }
      if (filter.endDate) {
        const endDate = new Date(filter.endDate);
        endDate.setHours(23, 59, 59, 999);
        (query.date as Record<string, Date>).$lte = endDate;
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
  async getById(id: string): Promise<IExpense> {
    const expense = await Expense.findById(id);

    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    return expense;
  }

  /**
   * Update expense
   */
  async update(id: string, data: UpdateExpenseData): Promise<IExpense> {
    const expense = await Expense.findById(id);

    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    // Normalize date if provided
    if (data.date) {
      const expenseDate = new Date(data.date);
      expenseDate.setHours(0, 0, 0, 0);
      data.date = expenseDate;
    }

    const updatedExpense = await Expense.findByIdAndUpdate(
      id,
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
  async delete(id: string): Promise<IExpense> {
    const expense = await Expense.findById(id);

    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    await Expense.findByIdAndDelete(id);

    return expense;
  }

  /**
   * Get total expenses for a date range
   */
  async getTotalByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<{ total: number; count: number; byCategory: Record<string, number> }> {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const result = await Expense.aggregate([
      {
        $match: {
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
   * Get expenses summary by category
   */
  async getSummaryByCategory(): Promise<Array<{ category: string; total: number; count: number }>> {
    const result = await Expense.aggregate([
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
          total: 1,
          count: 1,
        },
      },
      {
        $sort: { total: -1 },
      },
    ]);

    return result;
  }
}

export const expenseService = new ExpenseService();
