import mongoose from 'mongoose'

const auditLogSchema = new mongoose.Schema({
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  action: {
    type: String,
    required: true,
    trim: true,
    maxlength: 80,
    index: true,
  },
  ip: {
    type: String,
    default: null,
    maxlength: 80,
  },
  userAgent: {
    type: String,
    default: null,
    maxlength: 300,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
})

auditLogSchema.index({ createdAt: -1, action: 1 })

export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema)
