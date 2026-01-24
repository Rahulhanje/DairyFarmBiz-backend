import { Request } from 'express';

// Extend Express Request to include user
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

// Animal Types
export type AnimalType = 'cow' | 'buffalo';

// Milk Session Types
export type MilkSession = 'morning' | 'evening';

// Pregnancy Status Types
export type PregnancyStatus = 
  | 'check_pending' 
  | 'pregnant_confirmed' 
  | 'failed' 
  | 'delivered';

// Expense Categories
export type ExpenseCategory = 
  | 'feed' 
  | 'medicine' 
  | 'doctor' 
  | 'equipment' 
  | 'labor' 
  | 'maintenance' 
  | 'transport' 
  | 'other';

// Notification Types
export type NotificationType = 
  | 'pregnancy_check_reminder' 
  | 'delivery_reminder' 
  | 'general';

// Notification Status
export type NotificationStatus = 'pending' | 'sent' | 'failed';

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Date Filter Types
export type DateFilterType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export interface DateFilter {
  type: DateFilterType;
  startDate?: Date;
  endDate?: Date;
}

// Dashboard Types
export interface DashboardSummary {
  totalCowMilk: number;
  totalBuffaloMilk: number;
  totalMilk: number;
  totalMilkIncome: number;
  totalExpenses: number;
  profitOrLoss: number;
  animalCount: {
    cows: number;
    buffaloes: number;
    total: number;
  };
}
