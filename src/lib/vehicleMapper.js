export function mapApiVehicle(vehicle) {
  if (!vehicle) return null

  const image = vehicle.image || vehicle.mainImage || vehicle.images?.[0]?.url || ''
  const gallery = Array.isArray(vehicle.gallery) && vehicle.gallery.length > 0
    ? vehicle.gallery
    : Array.isArray(vehicle.images)
      ? vehicle.images.map((item) => item.url)
      : image
        ? [image]
        : []

  return {
    id: vehicle.legacyId ?? vehicle.id,
    backendId: vehicle.id,
    legacyId: vehicle.legacyId ?? null,
    slug: vehicle.slug,
    title: vehicle.title,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    price: vehicle.price,
    currency: vehicle.currency || 'USD',
    mileage: vehicle.mileage ?? 0,
    transmission: vehicle.transmission,
    fuel: vehicle.fuel ?? vehicle.fuelType,
    fuelType: vehicle.fuelType ?? vehicle.fuel,
    traction: vehicle.traction ?? vehicle.drivetrain ?? '',
    drivetrain: vehicle.drivetrain ?? vehicle.traction ?? '',
    color: vehicle.color ?? '',
    status: vehicle.status ?? vehicle.condition,
    condition: vehicle.condition ?? vehicle.status,
    badge: vehicle.badge || null,
    category: vehicle.category ?? vehicle.bodyType,
    bodyType: vehicle.bodyType ?? vehicle.category,
    location: vehicle.location ?? '',
    description: vehicle.description ?? '',
    features: Array.isArray(vehicle.features) ? vehicle.features : [],
    image,
    mainImage: image,
    gallery,
    specs: vehicle.specs ?? {},
    featured: Boolean(vehicle.featured),
    views: vehicle.views ?? 0,
    contactCount: vehicle.contactCount ?? 0,
    publishedAt: vehicle.publishedAt ?? null,
  }
}

export function mapVehicleCollectionResponse(response) {
  return {
    data: Array.isArray(response?.data) ? response.data.map(mapApiVehicle) : [],
    meta: response?.meta ?? { page: 1, limit: 0, total: 0, pages: 0 },
    facets: response?.facets ?? {
      brands: [],
      bodyTypes: [],
      fuelTypes: [],
      conditions: [],
    },
  }
}

