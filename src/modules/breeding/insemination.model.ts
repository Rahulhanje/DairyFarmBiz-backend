import mongoose, { Document, Schema } from 'mongoose';
import { PregnancyStatus } from '../../types';

export interface IInsemination extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  animal: mongoose.Types.ObjectId;
  inseminationDate: Date;
  doctorName?: string;
  semenType?: string;
  breed?: string;
  pregnancyCheckDate: Date; // Auto-calculated: inseminationDate + 90 days
  pregnancyStatus: PregnancyStatus;
  statusUpdatedAt?: Date;
  deliveryDate?: Date;
  notes?: string;
  notificationSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const inseminationSchema = new Schema<IInsemination>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    animal: {
      type: Schema.Types.ObjectId,
      ref: 'Animal',
      required: [true, 'Animal is required'],
    },
    inseminationDate: {
      type: Date,
      required: [true, 'Insemination date is required'],
    },
    doctorName: {
      type: String,
      trim: true,
      maxlength: [100, 'Doctor name cannot exceed 100 characters'],
    },
    semenType: {
      type: String,
      trim: true,
      maxlength: [100, 'Semen type cannot exceed 100 characters'],
    },
    breed: {
      type: String,
      trim: true,
      maxlength: [100, 'Breed cannot exceed 100 characters'],
    },
    pregnancyCheckDate: {
      type: Date,
      required: [true, 'Pregnancy check date is required'],
    },
    pregnancyStatus: {
      type: String,
      enum: {
        values: ['check_pending', 'pregnant_confirmed', 'failed', 'delivered'],
        message: 'Invalid pregnancy status',
      },
      default: 'check_pending',
    },
    statusUpdatedAt: {
      type: Date,
    },
    deliveryDate: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    notificationSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
inseminationSchema.index({ animal: 1 });
inseminationSchema.index({ inseminationDate: -1 });
inseminationSchema.index({ pregnancyCheckDate: 1 });
inseminationSchema.index({ pregnancyStatus: 1 });
inseminationSchema.index({ notificationSent: 1, pregnancyStatus: 1 });

// Pre-save hook to auto-calculate pregnancy check date
inseminationSchema.pre('save', function (next) {
  if (this.isModified('inseminationDate') || this.isNew) {
    const checkDate = new Date(this.inseminationDate);
    checkDate.setDate(checkDate.getDate() + 90);
    this.pregnancyCheckDate = checkDate;
  }
  next();
});

export const Insemination = mongoose.model<IInsemination>('Insemination', inseminationSchema);
