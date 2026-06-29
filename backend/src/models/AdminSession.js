import mongoose from 'mongoose'

const adminSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  tokenId: {
    type: String,
    required: true,
    index: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  revokedAt: {
    type: Date,
    default: null,
  },
  revokedReason: {
    type: String,
    default: null,
  },
  ipAddress: {
    type: String,
    default: null,
    maxlength: 80,
  },
  userAgent: {
    type: String,
    default: null,
    maxlength: 300,
  },
  csrfToken: {
    type: String,
    default: null,
    maxlength: 128,
  },
  lastSeenAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
})

adminSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const AdminSession = mongoose.models.AdminSession || mongoose.model('AdminSession', adminSessionSchema)
