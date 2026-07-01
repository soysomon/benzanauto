import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { MongoMemoryServer } from 'mongodb-memory-server'
import sharp from 'sharp'
import request from 'supertest'

async function run() {
  const mongo = await MongoMemoryServer.create()
  const smokeSecret = crypto.randomBytes(24).toString('hex')
  const smokeUserSuffix = crypto.randomBytes(4).toString('hex')
  const smokePassword = `Smoke-${crypto.randomBytes(8).toString('hex')}-A1!`
  const csrfHeaderName = 'x-csrf-token'

  process.env.NODE_ENV = 'test'
  process.env.PORT = '4010'
  process.env.MONGODB_URI = mongo.getUri('benzan-smoke')
  process.env.JWT_SECRET = smokeSecret
  process.env.JWT_EXPIRES_IN = '12h'
  process.env.FRONTEND_URL = 'http://localhost:5173'
  process.env.FRONTEND_ADMIN_URL = 'http://localhost:5173/admin'
  process.env.STORAGE_DRIVER = 'local'
  process.env.EMAIL_PROVIDER = 'disabled'
  process.env.SUPERADMIN_NAME = 'Smoke Admin'
  process.env.SUPERADMIN_USERNAME = `smokeadmin_${smokeUserSuffix}`
  process.env.SUPERADMIN_EMAIL = `smoke_${smokeUserSuffix}@example.com`
  process.env.SUPERADMIN_PASSWORD = smokePassword

  const [
    { logger },
    { connectDatabase, disconnectDatabase },
    { createApp },
    { createInitialSuperAdmin },
    { Campaign },
    { Vehicle },
    { clearSentEmailsForTesting, getSentEmailsForTesting },
  ] = await Promise.all([
    import('../utils/logger.js'),
    import('../config/database.js'),
    import('../app.js'),
    import('../services/auth.service.js'),
    import('../models/Campaign.js'),
    import('../models/Vehicle.js'),
    import('../services/email.service.js'),
  ])
  const smokeLogger = logger.child({ scope: 'script:smoke-test' })

  try {
    await connectDatabase()
    await createInitialSuperAdmin({
      name: process.env.SUPERADMIN_NAME,
      username: process.env.SUPERADMIN_USERNAME,
      email: process.env.SUPERADMIN_EMAIL,
      password: process.env.SUPERADMIN_PASSWORD,
    })

    const app = createApp()
    const adminAgent = request.agent(app)

    const loginResponse = await adminAgent
      .post('/api/admin/auth/login')
      .send({
        username: process.env.SUPERADMIN_USERNAME,
        password: process.env.SUPERADMIN_PASSWORD,
      })

    assert.equal(loginResponse.status, 200)
    assert.equal(loginResponse.body.token, undefined)
    assert.ok(loginResponse.body.csrfToken)
    assert.ok(
      loginResponse.headers['set-cookie']?.some((header) => header.startsWith('benzan_admin_session=')),
      'Expected secure admin session cookie to be set on login.',
    )

    const csrfToken = loginResponse.body.csrfToken

    const meResponse = await adminAgent.get('/api/admin/auth/me')
    assert.equal(meResponse.status, 200)
    assert.equal(meResponse.body.user.username, process.env.SUPERADMIN_USERNAME)
    assert.equal(meResponse.body.csrfToken, csrfToken)

    clearSentEmailsForTesting()

    const managedUserResponse = await adminAgent
      .post('/api/admin/users')
      .set(csrfHeaderName, csrfToken)
      .send({
        name: 'Smoke Editor',
        username: `editor_${smokeUserSuffix}`,
        email: `editor_${smokeUserSuffix}@example.com`,
        password: `Editor-${crypto.randomBytes(8).toString('hex')}-A1!`,
        role: 'editor',
        isActive: true,
        mustChangePassword: true,
      })

    assert.equal(managedUserResponse.status, 201)
    const managedUserId = managedUserResponse.body.user.id
    clearSentEmailsForTesting()

    const forgotPasswordResponse = await request(app)
      .post('/api/admin/auth/forgot-password')
      .send({
        identifier: `editor_${smokeUserSuffix}`,
      })

    assert.equal(forgotPasswordResponse.status, 200)
    const sentEmails = getSentEmailsForTesting()
    assert.equal(sentEmails.length, 1)

    const resetUrl = sentEmails[0].text.match(/https?:\/\/\S+/)?.[0]
    assert.ok(resetUrl)
    const resetToken = new URL(resetUrl).searchParams.get('token')
    assert.ok(resetToken)

    const validateResetResponse = await request(app)
      .post('/api/admin/auth/reset-password/validate')
      .send({ token: resetToken })

    assert.equal(validateResetResponse.status, 200)
    assert.equal(validateResetResponse.body.valid, true)

    const updatedManagedPassword = `EditorReset-${crypto.randomBytes(8).toString('hex')}-A1!`
    const resetPasswordResponse = await request(app)
      .post('/api/admin/auth/reset-password')
      .send({
        token: resetToken,
        newPassword: updatedManagedPassword,
        confirmPassword: updatedManagedPassword,
      })

    assert.equal(resetPasswordResponse.status, 200)

    const managedLoginResponse = await request(app)
      .post('/api/admin/auth/login')
      .send({
        identifier: `editor_${smokeUserSuffix}`,
        password: updatedManagedPassword,
      })

    assert.equal(managedLoginResponse.status, 200)
    assert.equal(managedLoginResponse.body.token, undefined)
    assert.equal(managedLoginResponse.body.user.role, 'editor')

    const auditLogResponse = await adminAgent
      .get('/api/admin/audit')

    assert.equal(auditLogResponse.status, 200)
    assert.ok(auditLogResponse.body.data.some((entry) => entry.action === 'user_created'))
    assert.ok(auditLogResponse.body.data.some((entry) => entry.action === 'password_reset_completed'))

    const blockUserResponse = await adminAgent
      .patch(`/api/admin/users/${managedUserId}/block`)
      .set(csrfHeaderName, csrfToken)

    assert.equal(blockUserResponse.status, 200)

    const unblockUserResponse = await adminAgent
      .patch(`/api/admin/users/${managedUserId}/unblock`)
      .set(csrfHeaderName, csrfToken)

    assert.equal(unblockUserResponse.status, 200)

    const createVehicleResponse = await adminAgent
      .post('/api/admin/vehicles')
      .set(csrfHeaderName, csrfToken)
      .send({
        title: 'Toyota Prado VX 2025',
        brand: 'Toyota',
        model: 'Prado VX',
        year: 2025,
        price: 86000,
        currency: 'USD',
        mileage: 0,
        transmission: 'Automático',
        fuelType: 'Diesel',
        bodyType: 'SUV',
        drivetrain: '4x4',
        color: 'Negro',
        condition: 'Nuevo',
        location: 'San Juan de la Maguana, RD',
        description: 'SUV premium con enfoque todoterreno, interior de cuero y tecnologia avanzada para uso familiar.',
        features: ['Camara 360', 'Asientos ventilados'],
        status: 'draft',
        featured: false,
      })

    assert.equal(createVehicleResponse.status, 201)
    const vehicleId = createVehicleResponse.body.vehicle.id

    const imageBuffer = await sharp({
      create: {
        width: 32,
        height: 32,
        channels: 3,
        background: { r: 10, g: 20, b: 30 },
      },
    }).png().toBuffer()

    const secondaryImageBuffer = await sharp({
      create: {
        width: 32,
        height: 32,
        channels: 3,
        background: { r: 60, g: 90, b: 120 },
      },
    }).png().toBuffer()

    const uploadResponse = await adminAgent
      .post(`/api/admin/vehicles/${vehicleId}/images`)
      .set(csrfHeaderName, csrfToken)
      .attach('images', imageBuffer, { filename: 'vehicle.png', contentType: 'image/png' })
      .attach('images', secondaryImageBuffer, { filename: 'vehicle-2.png', contentType: 'image/png' })

    assert.equal(uploadResponse.status, 201)
    assert.equal(uploadResponse.body.vehicle.id, vehicleId)
    assert.equal(uploadResponse.body.vehicle.images.length, 2)

    const [firstImage, secondImage] = uploadResponse.body.vehicle.images
    assert.ok(firstImage.id)
    assert.ok(secondImage.id)
    assert.ok(uploadResponse.body.vehicle.mainImage)

    const coverResponse = await adminAgent
      .put(`/api/admin/vehicles/${vehicleId}`)
      .set(csrfHeaderName, csrfToken)
      .send({
        mainImageId: secondImage.id,
        imageOrder: [secondImage.id, firstImage.id],
      })

    assert.equal(coverResponse.status, 200)
    assert.equal(coverResponse.body.vehicle.images[0].id, secondImage.id)
    assert.equal(coverResponse.body.vehicle.images[0].isMain, true)
    assert.equal(coverResponse.body.vehicle.mainImage, secondImage.url)

    const publishResponse = await adminAgent
      .patch(`/api/admin/vehicles/${vehicleId}/publish`)
      .set(csrfHeaderName, csrfToken)

    assert.equal(publishResponse.status, 200)
    assert.equal(publishResponse.body.vehicle.status, 'published')
    assert.ok(publishResponse.body.vehicle.publishedAt)
    assert.equal(publishResponse.body.vehicle.mainImage, secondImage.url)

    const storedVehicle = await Vehicle.findById(vehicleId).lean()
    assert.ok(storedVehicle)
    assert.equal(storedVehicle.status, 'published')
    assert.ok(storedVehicle.slug)
    assert.ok(storedVehicle.publishedAt)
    assert.equal(storedVehicle.images.length, 2)
    assert.equal(storedVehicle.mainImage, secondImage.url)
    assert.equal(storedVehicle.images.find((image) => image.isMain)?.url, secondImage.url)

    const featureResponse = await adminAgent
      .patch(`/api/admin/vehicles/${vehicleId}/featured`)
      .set(csrfHeaderName, csrfToken)
      .send({ featured: true })

    assert.equal(featureResponse.status, 200)

    const publicListResponse = await request(app).get('/api/vehicles')
    assert.equal(publicListResponse.status, 200)
    assert.equal(publicListResponse.body.data.length, 1)
    assert.equal(publicListResponse.body.data[0].status, 'published')
    assert.equal(publicListResponse.body.data[0].condition, 'Nuevo')

    const createCampaignResponse = await adminAgent
      .post('/api/admin/campaigns')
      .set(csrfHeaderName, csrfToken)
      .send({
        title: 'SUV Week',
        description: 'Promoción especial para explorar el inventario SUV.',
        ctaText: 'Ver inventario',
        ctaUrl: '/inventario',
        status: 'draft',
        delaySeconds: 2,
        frequencyRule: 'session',
        priority: 300,
        displayType: 'modal',
        targetRoutes: ['/', '/inventario', '/vehiculo/*'],
        targetDevices: ['desktop', 'mobile'],
      })

    assert.equal(createCampaignResponse.status, 201)
    const campaignId = createCampaignResponse.body.campaign.id

    const campaignImageResponse = await adminAgent
      .post(`/api/admin/campaigns/${campaignId}/image`)
      .set(csrfHeaderName, csrfToken)
      .field('imageAlt', 'Semana SUV Benzan Auto')
      .attach('image', imageBuffer, { filename: 'campaign.png', contentType: 'image/png' })

    assert.equal(campaignImageResponse.status, 201)
    assert.ok(campaignImageResponse.body.campaign.imageUrl)

    const activateCampaignResponse = await adminAgent
      .patch(`/api/admin/campaigns/${campaignId}/status`)
      .set(csrfHeaderName, csrfToken)
      .send({ status: 'active' })

    assert.equal(activateCampaignResponse.status, 200)
    assert.equal(activateCampaignResponse.body.campaign.status, 'active')

    const storedCampaign = await Campaign.findById(campaignId).lean()
    assert.ok(storedCampaign)
    assert.equal(storedCampaign.status, 'active')
    assert.ok(storedCampaign.image?.url)
    assert.equal(storedCampaign.targetDevices.includes('desktop'), true)

    const publicCampaignResponse = await request(app)
      .get('/api/campaigns/active')
      .query({
        route: '/inventario',
        device: 'desktop',
      })

    assert.equal(publicCampaignResponse.status, 200)
    assert.equal(publicCampaignResponse.body.campaign.title, 'SUV Week')
    assert.equal(publicCampaignResponse.body.campaign.ctaUrl, '/inventario')
    assert.equal(publicCampaignResponse.body.campaign.status, undefined)

    const slug = publicListResponse.body.data[0].slug

    const detailResponse = await request(app).get(`/api/vehicles/${slug}`)
    assert.equal(detailResponse.status, 200)
    assert.equal(detailResponse.body.vehicle.slug, slug)
    assert.equal(detailResponse.body.vehicle.status, 'published')
    assert.equal(detailResponse.body.vehicle.condition, 'Nuevo')
    assert.equal(detailResponse.body.vehicle.mainImage, secondImage.url)
    assert.equal(detailResponse.body.vehicle.images[0].id, secondImage.id)

    const chatResponse = await request(app)
      .post('/api/chat')
      .send({
        message: '¿Qué Toyota tienen disponibles ahora mismo?',
        history: [],
        currentContext: {},
      })

    assert.equal(chatResponse.status, 200)
    assert.equal(chatResponse.body.recommendedVehicles.length, 1)
    assert.equal(chatResponse.body.recommendedVehicles[0].id, vehicleId)
    assert.equal(chatResponse.body.recommendedVehicles[0].slug, slug)
    assert.equal(chatResponse.body.recommendedVehicles[0].brand, 'Toyota')
    assert.equal(chatResponse.body.recommendedVehicles[0].model, 'Prado VX')

    const contactResponse = await request(app).post(`/api/vehicles/${slug}/contact`)
    assert.equal(contactResponse.status, 200)
    assert.equal(contactResponse.body.contactCount, 1)

    const statsResponse = await adminAgent
      .get('/api/admin/dashboard/stats')

    assert.equal(statsResponse.status, 200)
    assert.equal(statsResponse.body.counts.totalVehicles, 1)

    const deleteResponse = await adminAgent
      .delete(`/api/admin/vehicles/${vehicleId}`)
      .set(csrfHeaderName, csrfToken)

    assert.equal(deleteResponse.status, 204)

    const logoutResponse = await adminAgent
      .post('/api/admin/auth/logout')
      .set(csrfHeaderName, csrfToken)

    assert.equal(logoutResponse.status, 200)
    assert.ok(
      logoutResponse.headers['set-cookie']?.some((header) => header.startsWith('benzan_admin_session=')),
      'Expected session cookie clear header on logout.',
    )

    const meAfterLogoutResponse = await adminAgent.get('/api/admin/auth/me')
    assert.equal(meAfterLogoutResponse.status, 401)

    smokeLogger.info('smoke_test_passed')
  } finally {
    await disconnectDatabase().catch(() => {})
    await mongo.stop().catch(() => {})
  }
}

run().catch((error) => {
  process.stderr.write(`${JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'error',
    service: 'benzan-auto-backend',
    scope: 'script:smoke-test',
    message: 'smoke_test_failed',
    error: {
      name: error?.name ?? 'Error',
      message: error?.message ?? 'Unknown smoke test failure.',
      stack: error?.stack ?? null,
    },
  })}\n`)
  process.exit(1)
})
