import { MilkCollection } from '../milk-collection';
import { Expense } from '../expense';
import { Animal } from '../animal';
import { Insemination } from '../breeding';
import mongoose from 'mongoose';

export type Period = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface MilkSummary {
  totalQuantity: number;
  totalAmount: number;
  avgRate: number;
  sessions: {
    morning: { quantity: number; amount: number };
    evening: { quantity: number; amount: number };
  };
}

export interface DashboardSummary {
  dateRange: DateRange;
  period: Period;
  milk: {
    cow: MilkSummary;
    buffalo: MilkSummary;
    total: {
      quantity: number;
      amount: number;
    };
  };
  expenses: {
    total: number;
    byCategory: Record<string, number>;
  };
  profitLoss: {
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
  };
  animals: {
    totalCows: number;
    totalBuffaloes: number;
    activeCows: number;
    activeBuffaloes: number;
    soldAnimals: number;
  };
  breeding: {
    totalInseminations: number;
    pendingChecks: number;
    confirmed: number;
    failed: number;
    delivered: number;
  };
}

class DashboardService {
  /**
   * Get date range based on period
   */
  getDateRange(period: Period, customStart?: Date, customEnd?: Date): DateRange {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    switch (period) {
      case 'daily':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;

      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
        startDate.setHours(0, 0, 0, 0);
        break;

      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        break;

      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        startDate.setHours(0, 0, 0, 0);
        break;

      case 'custom':
        if (!customStart || !customEnd) {
          // Default to last 30 days if no custom range provided
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 30);
          startDate.setHours(0, 0, 0, 0);
        } else {
          startDate = new Date(customStart);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(customEnd);
          endDate.setHours(23, 59, 59, 999);
        }
        break;

      default:
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
    }

    return { startDate, endDate };
  }

  /**
   * Get milk collection summary by animal type
   */
  async getMilkSummary(
    animalType: 'cow' | 'buffalo',
    dateRange: DateRange
  ): Promise<MilkSummary> {
    const matchStage = {
      animalType,
      date: {
        $gte: dateRange.startDate,
        $lte: dateRange.endDate,
      },
    };

    const [totalResult, sessionResult] = await Promise.all([
      // Total aggregation
      MilkCollection.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalQuantity: { $sum: '$quantity' },
            totalAmount: { $sum: '$totalAmount' },
            avgRate: { $avg: '$ratePerLiter' },
          },
        },
      ]),

      // Session-wise aggregation
      MilkCollection.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$session',
            quantity: { $sum: '$quantity' },
            amount: { $sum: '$totalAmount' },
          },
        },
      ]),
    ]);

    const total = totalResult[0] || { totalQuantity: 0, totalAmount: 0, avgRate: 0 };

    const sessions = {
      morning: { quantity: 0, amount: 0 },
      evening: { quantity: 0, amount: 0 },
    };

    for (const session of sessionResult) {
      if (session._id === 'morning') {
        sessions.morning = { quantity: session.quantity, amount: session.amount };
      } else if (session._id === 'evening') {
        sessions.evening = { quantity: session.quantity, amount: session.amount };
      }
    }

    return {
      totalQuantity: total.totalQuantity,
      totalAmount: total.totalAmount,
      avgRate: Math.round(total.avgRate * 100) / 100 || 0,
      sessions,
    };
  }

  /**
   * Get expense summary
   */
  async getExpenseSummary(dateRange: DateRange): Promise<{
    total: number;
    byCategory: Record<string, number>;
  }> {
    const result = await Expense.aggregate([
      {
        $match: {
          date: {
            $gte: dateRange.startDate,
            $lte: dateRange.endDate,
          },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
        },
      },
    ]);

    const byCategory: Record<string, number> = {};
    let total = 0;

    for (const item of result) {
      byCategory[item._id] = item.total;
      total += item.total;
    }

    return { total, byCategory };
  }

  /**
   * Get animal statistics
   */
  async getAnimalStats(): Promise<{
    totalCows: number;
    totalBuffaloes: number;
    activeCows: number;
    activeBuffaloes: number;
    soldAnimals: number;
  }> {
    const result = await Animal.aggregate([
      {
        $group: {
          _id: {
            animalType: '$animalType',
            isSold: '$isSold',
            isActive: '$isActive',
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = {
      totalCows: 0,
      totalBuffaloes: 0,
      activeCows: 0,
      activeBuffaloes: 0,
      soldAnimals: 0,
    };

    for (const item of result) {
      const { animalType, isSold, isActive } = item._id;

      if (animalType === 'cow') {
        stats.totalCows += item.count;
        if (!isSold && isActive) {
          stats.activeCows += item.count;
        }
      } else if (animalType === 'buffalo') {
        stats.totalBuffaloes += item.count;
        if (!isSold && isActive) {
          stats.activeBuffaloes += item.count;
        }
      }

      if (isSold) {
        stats.soldAnimals += item.count;
      }
    }

    return stats;
  }

  /**
   * Get breeding statistics
   */
  async getBreedingStats(dateRange: DateRange): Promise<{
    totalInseminations: number;
    pendingChecks: number;
    confirmed: number;
    failed: number;
    delivered: number;
  }> {
    const result = await Insemination.aggregate([
      {
        $match: {
          inseminationDate: {
            $gte: dateRange.startDate,
            $lte: dateRange.endDate,
          },
        },
      },
      {
        $group: {
          _id: '$pregnancyStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = {
      totalInseminations: 0,
      pendingChecks: 0,
      confirmed: 0,
      failed: 0,
      delivered: 0,
    };

    for (const item of result) {
      stats.totalInseminations += item.count;

      switch (item._id) {
        case 'check_pending':
          stats.pendingChecks = item.count;
          break;
        case 'pregnant_confirmed':
          stats.confirmed = item.count;
          break;
        case 'failed':
          stats.failed = item.count;
          break;
        case 'delivered':
          stats.delivered = item.count;
          break;
      }
    }

    return stats;
  }

  /**
   * Get complete dashboard summary
   */
  async getDashboardSummary(
    period: Period = 'monthly',
    customStart?: Date,
    customEnd?: Date
  ): Promise<DashboardSummary> {
    const dateRange = this.getDateRange(period, customStart, customEnd);

    const [cowMilk, buffaloMilk, expenses, animalStats, breedingStats] = await Promise.all([
      this.getMilkSummary('cow', dateRange),
      this.getMilkSummary('buffalo', dateRange),
      this.getExpenseSummary(dateRange),
      this.getAnimalStats(),
      this.getBreedingStats(dateRange),
    ]);

    const totalIncome = cowMilk.totalAmount + buffaloMilk.totalAmount;
    const totalExpenses = expenses.total;
    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    return {
      dateRange,
      period,
      milk: {
        cow: cowMilk,
        buffalo: buffaloMilk,
        total: {
          quantity: cowMilk.totalQuantity + buffaloMilk.totalQuantity,
          amount: cowMilk.totalAmount + buffaloMilk.totalAmount,
        },
      },
      expenses: expenses,
      profitLoss: {
        totalIncome,
        totalExpenses,
        netProfit,
        profitMargin: Math.round(profitMargin * 100) / 100,
      },
      animals: animalStats,
      breeding: breedingStats,
    };
  }

  /**
   * Get milk collection trends
   */
  async getMilkTrends(
    period: Period = 'monthly',
    customStart?: Date,
    customEnd?: Date
  ): Promise<{
    dateRange: DateRange;
    trends: Array<{
      date: string;
      cow: { quantity: number; amount: number };
      buffalo: { quantity: number; amount: number };
      total: { quantity: number; amount: number };
    }>;
  }> {
    const dateRange = this.getDateRange(period, customStart, customEnd);

    let groupBy: Record<string, unknown>;
    let dateFormat: string;

    switch (period) {
      case 'daily':
      case 'weekly':
        groupBy = {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' },
        };
        dateFormat = 'day';
        break;
      case 'monthly':
        groupBy = {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' },
        };
        dateFormat = 'day';
        break;
      case 'yearly':
        groupBy = {
          year: { $year: '$date' },
          month: { $month: '$date' },
        };
        dateFormat = 'month';
        break;
      default:
        groupBy = {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' },
        };
        dateFormat = 'day';
    }

    const result = await MilkCollection.aggregate([
      {
        $match: {
          date: {
            $gte: dateRange.startDate,
            $lte: dateRange.endDate,
          },
        },
      },
      {
        $group: {
          _id: {
            ...groupBy,
            animalType: '$animalType',
          },
          quantity: { $sum: '$quantity' },
          amount: { $sum: '$totalAmount' },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
      },
    ]);

    // Group by date
    const trendMap = new Map<
      string,
      {
        cow: { quantity: number; amount: number };
        buffalo: { quantity: number; amount: number };
      }
    >();

    for (const item of result) {
      let dateKey: string;
      if (dateFormat === 'day') {
        dateKey = `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`;
      } else {
        dateKey = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
      }

      if (!trendMap.has(dateKey)) {
        trendMap.set(dateKey, {
          cow: { quantity: 0, amount: 0 },
          buffalo: { quantity: 0, amount: 0 },
        });
      }

      const entry = trendMap.get(dateKey)!;
      if (item._id.animalType === 'cow') {
        entry.cow = { quantity: item.quantity, amount: item.amount };
      } else {
        entry.buffalo = { quantity: item.quantity, amount: item.amount };
      }
    }

    const trends = Array.from(trendMap.entries()).map(([date, data]) => ({
      date,
      cow: data.cow,
      buffalo: data.buffalo,
      total: {
        quantity: data.cow.quantity + data.buffalo.quantity,
        amount: data.cow.amount + data.buffalo.amount,
      },
    }));

    return { dateRange, trends };
  }

  /**
   * Get expense trends
   */
  async getExpenseTrends(
    period: Period = 'monthly',
    customStart?: Date,
    customEnd?: Date
  ): Promise<{
    dateRange: DateRange;
    trends: Array<{
      date: string;
      total: number;
      byCategory: Record<string, number>;
    }>;
  }> {
    const dateRange = this.getDateRange(period, customStart, customEnd);

    let groupBy: Record<string, unknown>;
    let dateFormat: string;

    if (period === 'yearly') {
      groupBy = {
        year: { $year: '$date' },
        month: { $month: '$date' },
      };
      dateFormat = 'month';
    } else {
      groupBy = {
        year: { $year: '$date' },
        month: { $month: '$date' },
        day: { $dayOfMonth: '$date' },
      };
      dateFormat = 'day';
    }

    const result = await Expense.aggregate([
      {
        $match: {
          date: {
            $gte: dateRange.startDate,
            $lte: dateRange.endDate,
          },
        },
      },
      {
        $group: {
          _id: {
            ...groupBy,
            category: '$category',
          },
          total: { $sum: '$amount' },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
      },
    ]);

    // Group by date
    const trendMap = new Map<
      string,
      { total: number; byCategory: Record<string, number> }
    >();

    for (const item of result) {
      let dateKey: string;
      if (dateFormat === 'day') {
        dateKey = `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`;
      } else {
        dateKey = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
      }

      if (!trendMap.has(dateKey)) {
        trendMap.set(dateKey, { total: 0, byCategory: {} });
      }

      const entry = trendMap.get(dateKey)!;
      entry.total += item.total;
      entry.byCategory[item._id.category] = item.total;
    }

    const trends = Array.from(trendMap.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));

    return { dateRange, trends };
  }

  /**
   * Get profit/loss trends
   */
  async getProfitLossTrends(
    period: Period = 'monthly',
    customStart?: Date,
    customEnd?: Date
  ): Promise<{
    dateRange: DateRange;
    trends: Array<{
      date: string;
      income: number;
      expenses: number;
      profit: number;
    }>;
  }> {
    const [milkTrends, expenseTrends] = await Promise.all([
      this.getMilkTrends(period, customStart, customEnd),
      this.getExpenseTrends(period, customStart, customEnd),
    ]);

    // Create a map of all dates
    const allDates = new Set<string>();
    for (const item of milkTrends.trends) {
      allDates.add(item.date);
    }
    for (const item of expenseTrends.trends) {
      allDates.add(item.date);
    }

    // Create milk map for quick lookup
    const milkMap = new Map<string, number>();
    for (const item of milkTrends.trends) {
      milkMap.set(item.date, item.total.amount);
    }

    // Create expense map for quick lookup
    const expenseMap = new Map<string, number>();
    for (const item of expenseTrends.trends) {
      expenseMap.set(item.date, item.total);
    }

    // Combine into profit/loss trends
    const trends = Array.from(allDates)
      .sort()
      .map((date) => {
        const income = milkMap.get(date) || 0;
        const expenses = expenseMap.get(date) || 0;
        return {
          date,
          income,
          expenses,
          profit: income - expenses,
        };
      });

    return { dateRange: milkTrends.dateRange, trends };
  }
}

export const dashboardService = new DashboardService();
