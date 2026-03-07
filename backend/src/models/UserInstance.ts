import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IUserInstance extends Document {
  userId: Types.ObjectId
  instanceName: string
  customName: string
  evolutionInstanceId?: string
  instanceToken?: string
  status: string
  isActive: boolean
  profileName?: string
  profilePictureUrl?: string
  whatsappNumber?: string
  createdAt: Date
  updatedAt: Date
}

const userInstanceSchema = new Schema<IUserInstance>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    instanceName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customName: {
      type: String,
      required: true,
      trim: true,
    },
    evolutionInstanceId: {
      type: String,
      trim: true,
    },
    instanceToken: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['open', 'close', 'connecting', 'pending'],
      default: 'pending',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    profileName: {
      type: String,
      trim: true,
    },
    profilePictureUrl: {
      type: String,
      trim: true,
    },
    whatsappNumber: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

// Index pour rechercher rapidement les instances d'un utilisateur
userInstanceSchema.index({ userId: 1, isActive: 1 })

export const UserInstance = mongoose.model<IUserInstance>('UserInstance', userInstanceSchema)
