import mongoose from 'mongoose'
import { env } from './env.js'

let connectionPromise = null

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) return mongoose.connection
  if (connectionPromise) return connectionPromise

  connectionPromise = mongoose.connect(env.MONGODB_URI, {
    autoIndex: !['production'].includes(env.NODE_ENV),
    serverSelectionTimeoutMS: 10_000,
  })

  try {
    await connectionPromise
    return mongoose.connection
  } finally {
    connectionPromise = null
  }
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState === 0) return
  await mongoose.disconnect()
}

