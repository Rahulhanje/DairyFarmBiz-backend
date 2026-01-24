import mongoose, { Document, Schema } from 'mongoose';
import { ExpenseCategory } from '../../types';

export interface IExpense extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  amount: number;
  date: Date;
  category: ExpenseCategory;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    name: {
      type: String,
      required: [true, 'Expense name is required'],
      trim: true,
      minlength: [1, 'Name cannot be empty'],
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
      },
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['feed', 'medicine', 'doctor', 'equipment', 'labor', 'maintenance', 'transport', 'other'],
        message: 'Invalid category',
      },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ date: -1, category: 1 });

export const Expense = mongoose.model<IExpense>('Expense', expenseSchema);
