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
  passwordHash: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ROLES,
    required: true,
    default: 'viewer',
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  lastLoginAt: {
    type: Date,
    default: null,
  },
  passwordChangedAt: {
    type: Date,
    default: null,
  },
  tokenVersion: {
    type: Number,
    default: 0,
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
}, {
  timestamps: true,
})

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.passwordHash)
}

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    username: this.username,
    email: this.email || null,
    role: this.role,
    isActive: this.isActive,
    lastLoginAt: this.lastLoginAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  }
}

export const User = mongoose.models.User || mongoose.model('User', userSchema)

