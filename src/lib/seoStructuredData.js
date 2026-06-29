import { COMPANY } from '../../shared/company.js'
import { buildAbsoluteUrl, getSiteName, getSiteUrl, truncateDescription } from './seo'

export function buildOrganizationStructuredData() {
  const siteUrl = getSiteUrl()

  return {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    name: getSiteName(),
    url: siteUrl,
    logo: buildAbsoluteUrl('/images/Logo-Benzan-2.png'),
    image: buildAbsoluteUrl('/images/banner-desktop.webp'),
    email: COMPANY.email,
    telephone: COMPANY.phoneHref,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: COMPANY.phoneHref,
        email: COMPANY.email,
        contactType: 'customer support',
        areaServed: COMPANY.country,
        availableLanguage: ['es'],
      },
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: COMPANY.addressLine1,
      addressLocality: COMPANY.city,
      addressCountry: COMPANY.country,
    },
    areaServed: COMPANY.country,
  }
}

export function buildWebsiteStructuredData() {
  const siteUrl = getSiteUrl()

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: getSiteName(),
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/inventario?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

export function buildBreadcrumbStructuredData(items = []) {
  const itemListElement = items
    .filter((item) => item?.name)
    .map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: buildAbsoluteUrl(item.path || item.url || '/'),
    }))

  if (itemListElement.length === 0) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  }
}

export function buildInventoryItemListStructuredData(vehicles = []) {
  const itemListElement = vehicles
    .filter((vehicle) => vehicle?.slug)
    .slice(0, 12)
    .map((vehicle, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: buildAbsoluteUrl(`/vehiculo/${vehicle.slug}`),
      name: `${vehicle.brand} ${vehicle.model} ${vehicle.year}`,
    }))

  if (itemListElement.length === 0) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement,
  }
}

export function buildVehicleStructuredData(vehicle) {
  if (!vehicle) return null

  const vehicleName = `${vehicle.brand} ${vehicle.model} ${vehicle.year}`.trim()
  const url = buildAbsoluteUrl(`/vehiculo/${vehicle.slug}`)
  const imageSet = Array.isArray(vehicle.gallery) && vehicle.gallery.length > 0
    ? vehicle.gallery.map((image) => buildAbsoluteUrl(image))
    : [buildAbsoluteUrl(vehicle.mainImage || vehicle.image)]

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: vehicleName,
    description: truncateDescription(vehicle.description || vehicleName),
    image: imageSet.filter(Boolean),
    sku: vehicle.slug || vehicle.backendId || vehicle.id,
    url,
    brand: {
      '@type': 'Brand',
      name: vehicle.brand,
    },
    model: vehicle.model,
    category: vehicle.category || vehicle.bodyType || 'Vehículo',
    color: vehicle.color || undefined,
    itemCondition: vehicle.condition === 'Nuevo'
      ? 'https://schema.org/NewCondition'
      : 'https://schema.org/UsedCondition',
    mileageFromOdometer: Number.isFinite(Number(vehicle.mileage))
      ? {
        '@type': 'QuantitativeValue',
        value: Number(vehicle.mileage),
        unitCode: 'KMT',
      }
      : undefined,
    additionalProperty: [
      vehicle.transmission
        ? {
          '@type': 'PropertyValue',
          name: 'Transmisión',
          value: vehicle.transmission,
        }
        : null,
      vehicle.fuelType || vehicle.fuel
        ? {
          '@type': 'PropertyValue',
          name: 'Combustible',
          value: vehicle.fuelType || vehicle.fuel,
        }
        : null,
      vehicle.drivetrain || vehicle.traction
        ? {
          '@type': 'PropertyValue',
          name: 'Tracción',
          value: vehicle.drivetrain || vehicle.traction,
        }
        : null,
    ].filter(Boolean),
    offers: {
      '@type': 'Offer',
      priceCurrency: vehicle.currency || 'USD',
      price: vehicle.price,
      availability: 'https://schema.org/InStock',
      url,
    },
  }
}
