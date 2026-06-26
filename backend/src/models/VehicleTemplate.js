import mongoose from 'mongoose'

const vehicleTemplateSchema = new mongoose.Schema(
  {
    cacheKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['makes', 'models', 'trims', 'vin'],
      required: true,
    },
    source: {
      type: String,
      enum: ['carquery', 'nhtsa', 'local'],
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
  },
  { timestamps: true },
)

export default mongoose.model('VehicleTemplate', vehicleTemplateSchema)
