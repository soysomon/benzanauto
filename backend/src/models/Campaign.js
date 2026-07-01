import mongoose from 'mongoose'
import {
  CAMPAIGN_DISPLAY_TYPES,
  CAMPAIGN_FREQUENCY_RULES,
  CAMPAIGN_STATUSES,
  CAMPAIGN_TARGET_DEVICES,
} from '../types/campaign.js'

const campaignImageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  width: {
    type: Number,
    required: true,
    min: 1,
  },
  height: {
    type: Number,
    required: true,
    min: 1,
  },
  size: {
    type: Number,
    required: true,
    min: 1,
  },
  mimeType: {
    type: String,
    required: true,
    default: 'image/webp',
  },
  alt: {
    type: String,
    trim: true,
    maxlength: 180,
    default: '',
  },
}, {
  _id: false,
  timestamps: false,
})

const campaignSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 160,
    index: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1200,
  },
  image: {
    type: campaignImageSchema,
    default: null,
  },
  imageAlt: {
    type: String,
    trim: true,
    maxlength: 180,
    default: '',
  },
  ctaText: {
    type: String,
    trim: true,
    maxlength: 80,
    default: '',
  },
  ctaUrl: {
    type: String,
    trim: true,
    maxlength: 500,
    default: '',
  },
  status: {
    type: String,
    enum: CAMPAIGN_STATUSES,
    required: true,
    default: 'draft',
    index: true,
  },
  startAt: {
    type: Date,
    default: null,
    index: true,
  },
  endAt: {
    type: Date,
    default: null,
    index: true,
  },
  delaySeconds: {
    type: Number,
    min: 0,
    max: 120,
    default: 3,
  },
  frequencyRule: {
    type: String,
    enum: CAMPAIGN_FREQUENCY_RULES,
    required: true,
    default: 'session',
  },
  priority: {
    type: Number,
    min: 0,
    max: 1000,
    default: 100,
    index: true,
  },
  displayType: {
    type: String,
    enum: CAMPAIGN_DISPLAY_TYPES,
    required: true,
    default: 'modal',
  },
  targetRoutes: {
    type: [String],
    default: ['*'],
  },
  targetDevices: {
    type: [String],
    enum: CAMPAIGN_TARGET_DEVICES,
    default: [...CAMPAIGN_TARGET_DEVICES],
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
  activatedAt: {
    type: Date,
    default: null,
  },
  pausedAt: {
    type: Date,
    default: null,
  },
  archivedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
})

campaignSchema.index({
  status: 1,
  priority: -1,
  startAt: 1,
  endAt: 1,
  updatedAt: -1,
})

campaignSchema.index({
  title: 'text',
  description: 'text',
})

export const Campaign = mongoose.models.Campaign || mongoose.model('Campaign', campaignSchema)
