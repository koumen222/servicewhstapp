import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document {
  email: string
  password: string
  name: string
  plan: string
  maxInstances: number
  isActive: boolean
  trialEndsAt?: Date
  hasPaid: boolean
  isPaidAccount: boolean
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    plan: {
      type: String,
      enum: ['basic', 'premium'],
      required: true,
    },
    maxInstances: {
      type: Number,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    trialEndsAt: {
      type: Date,
      required: false,
    },
    hasPaid: {
      type: Boolean,
      default: false,
    },
    isPaidAccount: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

export const User = mongoose.model<IUser>('User', userSchema)
