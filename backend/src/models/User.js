import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { ROLES } from '../types/roles.js'

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120,
  },
  username: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
    maxlength: 60,
    match: /^[a-z0-9._-]+$/,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 160,
    sparse: true,
    unique: true,
  },
  role: {
    type: String,
    enum: ROLES,
    required: true,
    default: 'viewer',
  },
  passwordHash: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  isBlocked: {
    type: Boolean,
    default: false,
    index: true,
  },
  failedLoginAttempts: {
    type: Number,
    default: 0,
    min: 0,
  },
  lockedUntil: {
    type: Date,
    default: null,
  },
  lastLoginAt: {
    type: Date,
    default: null,
  },
  passwordChangedAt: {
    type: Date,
    default: null,
  },
  mustChangePassword: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  deletedAt: {
    type: Date,
    default: null,
    index: true,
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  resetPasswordTokenHash: {
    type: String,
    default: null,
  },
  resetPasswordExpiresAt: {
    type: Date,
    default: null,
  },
  resetPasswordUsedAt: {
    type: Date,
    default: null,
  },
  resetPasswordRequestedAt: {
    type: Date,
    default: null,
  },
  mfaEnabled: {
    type: Boolean,
    default: false,
  },
  mfaSecret: {
    type: String,
    default: null,
  },
  recoveryCodesHash: {
    type: [String],
    default: [],
  },
  tokenVersion: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
})

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.passwordHash)
}

userSchema.methods.isTemporarilyLocked = function isTemporarilyLocked() {
  return this.lockedUntil instanceof Date && this.lockedUntil.getTime() > Date.now()
}

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    username: this.username,
    email: this.email || null,
    role: this.role,
    isActive: this.isActive,
    isBlocked: this.isBlocked,
    failedLoginAttempts: this.failedLoginAttempts ?? 0,
    lockedUntil: this.lockedUntil,
    lastLoginAt: this.lastLoginAt,
    passwordChangedAt: this.passwordChangedAt,
    mustChangePassword: this.mustChangePassword,
    deletedAt: this.deletedAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  }
}

userSchema.index({ role: 1, isActive: 1, deletedAt: 1 })

export const User = mongoose.models.User || mongoose.model('User', userSchema)
