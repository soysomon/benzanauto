import { verifyEmailTransport } from '../services/email.service.js'
import { logger } from '../utils/logger.js'

const verifyEmailLogger = logger.child({ scope: 'script:verify-email' })

async function run() {
  const result = await verifyEmailTransport({ force: true })

  if (result.skipped) {
    verifyEmailLogger.info('smtp_verification_skipped', {
      reason: 'provider_disabled',
    })
    return
  }

  verifyEmailLogger.info('smtp_verification_completed', {
    health: result.health,
  })
}

run().catch((error) => {
  verifyEmailLogger.error('smtp_verification_failed', {
    error,
  })
  process.exitCode = 1
})
