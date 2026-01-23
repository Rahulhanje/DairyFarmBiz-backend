import mongoose, { Document, Schema } from 'mongoose';
import { PregnancyStatus } from '../../types';

export interface IPregnancyStatusHistory extends Document {
  _id: mongoose.Types.ObjectId;
  insemination: mongoose.Types.ObjectId;
  animal: mongoose.Types.ObjectId;
  status: PregnancyStatus;
  previousStatus?: PregnancyStatus;
  changedAt: Date;
  changedBy?: string;
  notes?: string;
  // Additional data for specific statuses
  deliveryDate?: Date;
  calfCount?: number;
  calfDetails?: string;
  createdAt: Date;
  updatedAt: Date;
}

const pregnancyStatusHistorySchema = new Schema<IPregnancyStatusHistory>(
  {
    insemination: {
      type: Schema.Types.ObjectId,
      ref: 'Insemination',
      required: [true, 'Insemination reference is required'],
    },
    animal: {
      type: Schema.Types.ObjectId,
      ref: 'Animal',
      required: [true, 'Animal reference is required'],
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['check_pending', 'pregnant_confirmed', 'failed', 'delivered'],
        message: 'Invalid pregnancy status',
      },
    },
    previousStatus: {
      type: String,
      enum: {
        values: ['check_pending', 'pregnant_confirmed', 'failed', 'delivered'],
        message: 'Invalid previous status',
      },
    },
    changedAt: {
      type: Date,
      required: [true, 'Changed at date is required'],
      default: Date.now,
    },
    changedBy: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    // Delivery specific fields
    deliveryDate: {
      type: Date,
    },
    calfCount: {
      type: Number,
      min: [0, 'Calf count cannot be negative'],
    },
    calfDetails: {
      type: String,
      trim: true,
      maxlength: [500, 'Calf details cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
pregnancyStatusHistorySchema.index({ insemination: 1, changedAt: -1 });
pregnancyStatusHistorySchema.index({ animal: 1, changedAt: -1 });
pregnancyStatusHistorySchema.index({ status: 1 });

export const PregnancyStatusHistory = mongoose.model<IPregnancyStatusHistory>(
  'PregnancyStatusHistory',
  pregnancyStatusHistorySchema
);
