export function slugify(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

export function buildVehicleTitle({ title, brand, model, year }) {
  if (title) return String(title).trim()
  return [brand, model, year].filter(Boolean).join(' ').trim()
}

