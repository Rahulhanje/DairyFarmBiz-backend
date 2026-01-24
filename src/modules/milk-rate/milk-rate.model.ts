import mongoose, { Document, Schema } from 'mongoose';
import { AnimalType } from '../../types';

export interface IMilkRate extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  animalType: AnimalType;
  ratePerLiter: number;
  effectiveFrom: Date;
  createdAt: Date;
  updatedAt: Date;
}

const milkRateSchema = new Schema<IMilkRate>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    animalType: {
      type: String,
      required: [true, 'Animal type is required'],
      enum: {
        values: ['cow', 'buffalo'],
        message: 'Animal type must be either cow or buffalo',
      },
    },
    ratePerLiter: {
      type: Number,
      required: [true, 'Rate per liter is required'],
      min: [0, 'Rate per liter cannot be negative'],
    },
    effectiveFrom: {
      type: Date,
      required: [true, 'Effective from date is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: only one rate per animalType per effectiveFrom date
milkRateSchema.index({ animalType: 1, effectiveFrom: 1 }, { unique: true });

// Index for fetching rates by date
milkRateSchema.index({ animalType: 1, effectiveFrom: -1 });

export const MilkRate = mongoose.model<IMilkRate>('MilkRate', milkRateSchema);
