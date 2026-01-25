import mongoose, { Document, Schema } from 'mongoose';
import { AnimalType } from '../../types';

export interface IAnimal extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  serialNumber: string;
  nickName: string;
  animalType: AnimalType;
  identificationTag?: string;
  breed?: string;
  dateOfBirth?: Date;
  gender: 'male' | 'female';
  // Purchase details
  purchaseDate?: Date;
  purchasePrice?: number;
  purchasePlace?: string;
  // Selling details
  isSold: boolean;
  soldDate?: Date;
  soldPrice?: number;
  soldTo?: string;
  soldNotes?: string;
  // Status
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const animalSchema = new Schema<IAnimal>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    serialNumber: {
      type: String,
      required: [true, 'Serial number is required'],
      trim: true,
    },
    nickName: {
      type: String,
      required: [true, 'Nick name is required'],
      trim: true,
      minlength: [1, 'Nick name cannot be empty'],
      maxlength: [100, 'Nick name cannot exceed 100 characters'],
    },
    animalType: {
      type: String,
      required: [true, 'Animal type is required'],
      enum: {
        values: ['cow', 'buffalo'],
        message: 'Animal type must be either cow or buffalo',
      },
    },
    identificationTag: {
      type: String,
      trim: true,
    },
    breed: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: {
        values: ['male', 'female'],
        message: 'Gender must be either male or female',
      },
      default: 'female',
    },
    // Purchase details
    purchaseDate: {
      type: Date,
    },
    purchasePrice: {
      type: Number,
      min: [0, 'Purchase price cannot be negative'],
    },
    purchasePlace: {
      type: String,
      trim: true,
    },
    // Selling details
    isSold: {
      type: Boolean,
      default: false,
    },
    soldDate: {
      type: Date,
    },
    soldPrice: {
      type: Number,
      min: [0, 'Sold price cannot be negative'],
    },
    soldTo: {
      type: String,
      trim: true,
    },
    soldNotes: {
      type: String,
      trim: true,
    },
    // Status
    isActive: {
      type: Boolean,
      default: true,
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

// Compound unique index: serialNumber must be unique per user per animalType
animalSchema.index({ userId: 1, serialNumber: 1, animalType: 1 }, { unique: true });

// Index for common queries
animalSchema.index({ userId: 1, animalType: 1 });
animalSchema.index({ userId: 1, isSold: 1 });
animalSchema.index({ userId: 1, isActive: 1 });

export const Animal = mongoose.model<IAnimal>('Animal', animalSchema);
