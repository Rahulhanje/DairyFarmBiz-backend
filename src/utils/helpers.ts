/**
 * Get start and end dates based on filter type
 */
export const getDateRange = (
  filterType: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom',
  customStartDate?: Date,
  customEndDate?: Date
): { startDate: Date; endDate: Date } => {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = new Date(now.setHours(23, 59, 59, 999));

  switch (filterType) {
    case 'daily':
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      break;

    case 'weekly':
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      break;

    case 'monthly':
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      startDate.setHours(0, 0, 0, 0);
      break;

    case 'yearly':
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
      startDate.setHours(0, 0, 0, 0);
      break;

    case 'custom':
      if (!customStartDate || !customEndDate) {
        throw new Error('Custom date range requires start and end dates');
      }
      startDate = new Date(customStartDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);
      break;

    default:
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
  }

  return { startDate, endDate };
};

/**
 * Calculate days between two dates
 */
export const daysBetween = (date1: Date, date2: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
};

/**
 * Add days to a date
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Format date to YYYY-MM-DD
 */
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Check if date is today
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Parse date string to Date object (handles YYYY-MM-DD format)
 */
export const parseDate = (dateString: string): Date => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date format');
  }
  return date;
};
