import { connectDatabase, disconnectDatabase } from '../config/database.js'
import { Vehicle } from '../models/Vehicle.js'
import { logger } from '../utils/logger.js'

const indexLogger = logger.child({ scope: 'script:sync-indexes' })

function printDiff(diff) {
  const toCreate = Array.isArray(diff?.toCreate) ? diff.toCreate : []
  const toDrop = Array.isArray(diff?.toDrop) ? diff.toDrop : []

  indexLogger.info('vehicle_index_diff', {
    createCount: toCreate.length,
    dropCount: toDrop.length,
    toCreate,
    toDrop,
  })
}

async function run() {
  const shouldApply = process.argv.includes('--apply')

  await connectDatabase()

  try {
    const diff = await Vehicle.diffIndexes()
    printDiff(diff)

    if (!shouldApply) {
      indexLogger.info('vehicle_index_diff_dry_run')
      return
    }

    const result = await Vehicle.syncIndexes()
    indexLogger.info('vehicle_indexes_synced', {
      result,
    })
  } finally {
    await disconnectDatabase()
  }
}

run().catch((error) => {
  indexLogger.error('vehicle_index_sync_failed', {
    error,
  })
  process.exitCode = 1
})
