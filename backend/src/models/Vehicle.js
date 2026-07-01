import mongoose from 'mongoose'
import {
  BODY_TYPES,
  FUEL_TYPES,
  TRANSMISSIONS,
  VEHICLE_CONDITIONS,
  VEHICLE_CURRENCIES,
  VEHICLE_STATUSES,
} from '../types/vehicle.js'

const imageSchema = new mongoose.Schema({
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
  order: {
    type: Number,
    required: true,
    default: 0,
  },
  isMain: {
    type: Boolean,
    default: false,
  },
  alt: {
    type: String,
    default: '',
    maxlength: 180,
  },
}, {
  _id: true,
  timestamps: true,
})

const vehicleSchema = new mongoose.Schema({
  legacyId: {
    type: Number,
    sparse: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 180,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 220,
  },
  brand: {
    type: String,
    required: true,
    trim: true,
    maxlength: 80,
    index: true,
  },
  model: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120,
    index: true,
  },
  year: {
    type: Number,
    required: true,
    min: 1900,
    max: 2100,
    index: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    index: true,
  },
  currency: {
    type: String,
    enum: VEHICLE_CURRENCIES,
    required: true,
    default: 'USD',
  },
  mileage: {
    type: Number,
    required: true,
    min: 0,
  },
  transmission: {
    type: String,
    enum: TRANSMISSIONS,
    required: true,
  },
  fuelType: {
    type: String,
    enum: FUEL_TYPES,
    required: true,
    index: true,
  },
  bodyType: {
    type: String,
    enum: BODY_TYPES,
    required: true,
    index: true,
  },
  drivetrain: {
    type: String,
    trim: true,
    maxlength: 40,
    default: '',
  },
  color: {
    type: String,
    required: true,
    trim: true,
    maxlength: 60,
  },
  condition: {
    type: String,
    enum: VEHICLE_CONDITIONS,
    required: true,
    index: true,
  },
  vin: {
    type: String,
    trim: true,
    uppercase: true,
    maxlength: 17,
    default: '',
  },
  location: {
    type: String,
    required: true,
    trim: true,
    maxlength: 160,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000,
  },
  features: {
    type: [String],
    default: [],
  },
  specs: {
    type: Map,
    of: String,
    default: {},
  },
  images: {
    type: [imageSchema],
    default: [],
  },
  mainImage: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: VEHICLE_STATUSES,
    required: true,
    default: 'draft',
    index: true,
  },
  featured: {
    type: Boolean,
    default: false,
    index: true,
  },
  badge: {
    type: String,
    trim: true,
    maxlength: 40,
    default: '',
  },
  views: {
    type: Number,
    default: 0,
    min: 0,
  },
  contactCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  seoTitle: {
    type: String,
    trim: true,
    maxlength: 70,
    default: '',
  },
  seoDescription: {
    type: String,
    trim: true,
    maxlength: 160,
    default: '',
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
  publishedAt: {
    type: Date,
    default: null,
  },
  soldAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
})

vehicleSchema.index({
  title: 'text',
  brand: 'text',
  model: 'text',
  description: 'text',
  features: 'text',
})

vehicleSchema.index({
  status: 1,
  brand: 1,
  price: 1,
})

vehicleSchema.index(
  {
    status: 1,
    publishedAt: -1,
    createdAt: -1,
  },
  {
    name: 'vehicle_public_recent_idx',
    partialFilterExpression: { status: 'published' },
  },
)

vehicleSchema.index(
  {
    status: 1,
    featured: -1,
    publishedAt: -1,
    createdAt: -1,
  },
  {
    name: 'vehicle_public_featured_recent_idx',
    partialFilterExpression: { status: 'published' },
  },
)

vehicleSchema.index(
  {
    status: 1,
    brand: 1,
    featured: -1,
    publishedAt: -1,
    createdAt: -1,
  },
  {
    name: 'vehicle_public_brand_recent_idx',
    partialFilterExpression: { status: 'published' },
  },
)

export const Vehicle = mongoose.models.Vehicle || mongoose.model('Vehicle', vehicleSchema)
