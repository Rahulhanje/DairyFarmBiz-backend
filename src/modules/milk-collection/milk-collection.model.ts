import mongoose, { Document, Schema } from 'mongoose';
import { AnimalType, MilkSession } from '../../types';

export interface IMilkCollection extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  date: Date;
  session: MilkSession;
  animalType: AnimalType;
  totalMilk: number; // in liters
  rateApplied: number; // rate per liter (auto-fetched)
  totalAmount: number; // totalMilk * rateApplied (auto-calculated)
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const milkCollectionSchema = new Schema<IMilkCollection>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    session: {
      type: String,
      required: [true, 'Session is required'],
      enum: {
        values: ['morning', 'evening'],
        message: 'Session must be either morning or evening',
      },
    },
    animalType: {
      type: String,
      required: [true, 'Animal type is required'],
      enum: {
        values: ['cow', 'buffalo'],
        message: 'Animal type must be either cow or buffalo',
      },
    },
    totalMilk: {
      type: Number,
      required: [true, 'Total milk is required'],
      min: [0, 'Total milk cannot be negative'],
    },
    rateApplied: {
      type: Number,
      required: [true, 'Rate applied is required'],
      min: [0, 'Rate applied cannot be negative'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: only one entry per date + session + animalType
milkCollectionSchema.index(
  { date: 1, session: 1, animalType: 1 },
  { unique: true }
);

// Indexes for common queries
milkCollectionSchema.index({ date: -1 });
milkCollectionSchema.index({ animalType: 1, date: -1 });

export const MilkCollection = mongoose.model<IMilkCollection>(
  'MilkCollection',
  milkCollectionSchema
);
