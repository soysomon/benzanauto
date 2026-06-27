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

  process.env.NODE_ENV = 'test'
  process.env.PORT = '4010'
  process.env.MONGODB_URI = mongo.getUri('benzan-smoke')
  process.env.JWT_SECRET = smokeSecret
  process.env.JWT_EXPIRES_IN = '12h'
  process.env.FRONTEND_URL = 'http://localhost:5173'
  process.env.STORAGE_DRIVER = 'local'
  process.env.SUPERADMIN_NAME = 'Smoke Admin'
  process.env.SUPERADMIN_USERNAME = `smokeadmin_${smokeUserSuffix}`
  process.env.SUPERADMIN_EMAIL = `smoke_${smokeUserSuffix}@example.com`
  process.env.SUPERADMIN_PASSWORD = smokePassword

  const [
    { connectDatabase, disconnectDatabase },
    { createApp },
    { createInitialSuperAdmin },
    { Vehicle },
  ] = await Promise.all([
    import('../config/database.js'),
    import('../app.js'),
    import('../services/auth.service.js'),
    import('../models/Vehicle.js'),
  ])

  try {
    await connectDatabase()
    await createInitialSuperAdmin({
      name: process.env.SUPERADMIN_NAME,
      username: process.env.SUPERADMIN_USERNAME,
      email: process.env.SUPERADMIN_EMAIL,
      password: process.env.SUPERADMIN_PASSWORD,
    })

    const app = createApp()

    const loginResponse = await request(app)
      .post('/api/admin/auth/login')
      .send({
        username: process.env.SUPERADMIN_USERNAME,
        password: process.env.SUPERADMIN_PASSWORD,
      })

    assert.equal(loginResponse.status, 200)
    assert.ok(loginResponse.body.token)

    const token = loginResponse.body.token

    const createVehicleResponse = await request(app)
      .post('/api/admin/vehicles')
      .set('Authorization', `Bearer ${token}`)
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

    const uploadResponse = await request(app)
      .post(`/api/admin/vehicles/${vehicleId}/images`)
      .set('Authorization', `Bearer ${token}`)
      .attach('images', imageBuffer, { filename: 'vehicle.png', contentType: 'image/png' })
      .attach('images', secondaryImageBuffer, { filename: 'vehicle-2.png', contentType: 'image/png' })

    assert.equal(uploadResponse.status, 201)
    assert.equal(uploadResponse.body.vehicle.id, vehicleId)
    assert.equal(uploadResponse.body.vehicle.images.length, 2)

    const [firstImage, secondImage] = uploadResponse.body.vehicle.images
    assert.ok(firstImage.id)
    assert.ok(secondImage.id)
    assert.ok(uploadResponse.body.vehicle.mainImage)

    const coverResponse = await request(app)
      .put(`/api/admin/vehicles/${vehicleId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        mainImageId: secondImage.id,
        imageOrder: [secondImage.id, firstImage.id],
      })

    assert.equal(coverResponse.status, 200)
    assert.equal(coverResponse.body.vehicle.images[0].id, secondImage.id)
    assert.equal(coverResponse.body.vehicle.images[0].isMain, true)
    assert.equal(coverResponse.body.vehicle.mainImage, secondImage.url)

    const publishResponse = await request(app)
      .patch(`/api/admin/vehicles/${vehicleId}/publish`)
      .set('Authorization', `Bearer ${token}`)

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

    const featureResponse = await request(app)
      .patch(`/api/admin/vehicles/${vehicleId}/featured`)
      .set('Authorization', `Bearer ${token}`)
      .send({ featured: true })

    assert.equal(featureResponse.status, 200)

    const publicListResponse = await request(app).get('/api/vehicles')
    assert.equal(publicListResponse.status, 200)
    assert.equal(publicListResponse.body.data.length, 1)

    const slug = publicListResponse.body.data[0].slug

    const detailResponse = await request(app).get(`/api/vehicles/${slug}`)
    assert.equal(detailResponse.status, 200)
    assert.equal(detailResponse.body.vehicle.slug, slug)
    assert.equal(detailResponse.body.vehicle.status, 'Nuevo')
    assert.equal(detailResponse.body.vehicle.mainImage, secondImage.url)
    assert.equal(detailResponse.body.vehicle.images[0].id, secondImage.id)

    const contactResponse = await request(app).post(`/api/vehicles/${slug}/contact`)
    assert.equal(contactResponse.status, 200)
    assert.equal(contactResponse.body.contactCount, 1)

    const statsResponse = await request(app)
      .get('/api/admin/dashboard/stats')
      .set('Authorization', `Bearer ${token}`)

    assert.equal(statsResponse.status, 200)
    assert.equal(statsResponse.body.counts.totalVehicles, 1)

    const deleteResponse = await request(app)
      .delete(`/api/admin/vehicles/${vehicleId}`)
      .set('Authorization', `Bearer ${token}`)

    assert.equal(deleteResponse.status, 204)

    console.log('Smoke test passed.')
  } finally {
    await disconnectDatabase().catch(() => {})
    await mongo.stop().catch(() => {})
  }
}

run().catch((error) => {
  console.error('[Smoke Test Error]', error)
  process.exit(1)
})
