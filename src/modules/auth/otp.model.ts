import mongoose, { Document, Schema } from 'mongoose';

export type OTPPurpose = 'email_verification' | 'password_reset';

export interface IOTP extends Document {
  email: string;
  otp: string;
  purpose: OTPPurpose;
  expiresAt: Date;
  verified: boolean;
  createdAt: Date;
}

const otpSchema = new Schema<IOTP>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ['email_verification', 'password_reset'],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index - MongoDB will automatically delete expired docs
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for faster queries
otpSchema.index({ email: 1, purpose: 1 });

export const OTP = mongoose.model<IOTP>('OTP', otpSchema);
