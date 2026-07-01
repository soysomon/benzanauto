import mongoose from 'mongoose'
import { env } from './env.js'
import { logger } from '../utils/logger.js'

let connectionPromise = null
let listenersRegistered = false
let lastConnectionAttemptAt = null
let lastConnectedAt = null
let lastDisconnectedAt = null
let lastConnectionError = null

const CONNECTION_STATE_LABELS = Object.freeze({
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
})

const databaseLogger = logger.child({ scope: 'database' })

function formatDate(value) {
  return value instanceof Date ? value.toISOString() : null
}

function normalizeError(error) {
  if (!error) return null

  return {
    name: error.name ?? 'Error',
    message: error.message ?? 'Unknown database error.',
  }
}

function registerConnectionListeners() {
  if (listenersRegistered) return
  listenersRegistered = true

  mongoose.connection.on('connected', () => {
    lastConnectedAt = new Date()
    lastConnectionError = null
    databaseLogger.info('database_connected', {
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    })
  })

  mongoose.connection.on('disconnected', () => {
    lastDisconnectedAt = new Date()
    databaseLogger.warn('database_disconnected', {
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    })
  })

  mongoose.connection.on('error', (error) => {
    lastConnectionError = normalizeError(error)
    databaseLogger.error('database_connection_error', {
      error,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    })
  })
}

export async function connectDatabase() {
  registerConnectionListeners()
  lastConnectionAttemptAt = new Date()

  if (mongoose.connection.readyState === 1) return mongoose.connection
  if (connectionPromise) return connectionPromise

  databaseLogger.info('database_connecting', {
    host: mongoose.connection.host || undefined,
  })

  connectionPromise = mongoose.connect(env.MONGODB_URI, {
    autoIndex: !['production'].includes(env.NODE_ENV),
    serverSelectionTimeoutMS: 10_000,
  })

  try {
    await connectionPromise
    return mongoose.connection
  } catch (error) {
    lastConnectionError = normalizeError(error)
    databaseLogger.error('database_connect_failed', {
      error,
    })
    throw error
  } finally {
    connectionPromise = null
  }
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState === 0) return
  await mongoose.disconnect()
}

export function getDatabaseHealth() {
  const readyState = mongoose.connection.readyState

  return {
    connected: readyState === 1,
    readyState,
    state: CONNECTION_STATE_LABELS[readyState] ?? 'unknown',
    lastConnectionAttemptAt: formatDate(lastConnectionAttemptAt),
    lastConnectedAt: formatDate(lastConnectedAt),
    lastDisconnectedAt: formatDate(lastDisconnectedAt),
    lastConnectionError,
  }
}
