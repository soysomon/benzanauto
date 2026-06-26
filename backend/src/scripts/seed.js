import { connectDatabase, disconnectDatabase } from '../config/database.js'
import { COMPANY } from '../config/company.js'
import { env } from '../config/env.js'
import { vehicles as demoVehicles } from '../data/vehicles.js'
import { Vehicle } from '../models/Vehicle.js'
import { createInitialSuperAdmin } from '../services/auth.service.js'
import { slugify } from '../utils/slug.js'

async function run() {
  await connectDatabase()

  const superAdmin = await createInitialSuperAdmin({
    name: env.SUPERADMIN_NAME,
    username: env.SUPERADMIN_USERNAME,
    email: env.SUPERADMIN_EMAIL,
    password: env.SUPERADMIN_PASSWORD,
  })

  console.log(`Superadmin listo: ${superAdmin.username}`)

  if (env.SEED_DEMO_VEHICLES) {
    const operations = demoVehicles.map((vehicle) => {
      const title = `${vehicle.brand} ${vehicle.model} ${vehicle.year}`
      const gallery = vehicle.gallery?.length ? vehicle.gallery : [vehicle.image]

      return {
        updateOne: {
          filter: { legacyId: vehicle.id },
          update: {
            $set: {
              legacyId: vehicle.id,
              title,
              slug: `${slugify(title)}-${vehicle.id}`,
              brand: vehicle.brand,
              model: vehicle.model,
              year: vehicle.year,
              price: vehicle.price,
              currency: vehicle.currency ?? 'USD',
              mileage: vehicle.mileage ?? 0,
              transmission: vehicle.transmission,
              fuelType: vehicle.fuel,
              bodyType: vehicle.category,
              drivetrain: vehicle.traction ?? '',
              color: vehicle.color ?? '',
              condition: vehicle.status,
              location: COMPANY.shortAddress,
              description: vehicle.description,
              features: [],
              specs: vehicle.specs ?? {},
              mainImage: vehicle.image,
              images: gallery.map((url, index) => ({
                url,
                path: `external:${url}`,
                filename: extractFilename(url),
                width: 1600,
                height: 1000,
                size: 1,
                mimeType: guessMimeType(url),
                order: index,
                isMain: index === 0,
                alt: title,
              })),
              status: 'published',
              featured: Boolean(vehicle.badge),
              badge: vehicle.badge ?? '',
              views: 0,
              contactCount: 0,
              seoTitle: title,
              seoDescription: vehicle.description.slice(0, 155),
              publishedAt: new Date(),
              soldAt: null,
              createdBy: superAdmin._id,
              updatedBy: superAdmin._id,
            },
          },
          upsert: true,
        },
      }
    })

    const result = await Vehicle.bulkWrite(operations, { ordered: false })
    console.log(`Vehiculos demo procesados: ${result.upsertedCount + result.modifiedCount}`)
  }
}

run()
  .then(async () => {
    await disconnectDatabase()
    process.exit(0)
  })
  .catch(async (error) => {
    console.error('[Seed Error]', error)
    await disconnectDatabase().catch(() => {})
    process.exit(1)
  })

function extractFilename(url) {
  return String(url).split('/').pop()?.split('?')[0] || 'image.jpg'
}

function guessMimeType(url) {
  const normalized = String(url).toLowerCase()
  if (normalized.endsWith('.png')) return 'image/png'
  if (normalized.endsWith('.webp')) return 'image/webp'
  if (normalized.endsWith('.avif')) return 'image/avif'
  return 'image/jpeg'
}

