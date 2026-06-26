import { asyncHandler } from '../../utils/async-handler.js'
import { badRequest } from '../../utils/api-error.js'
import {
  getMakes,
  getModels,
  getYears,
  enrichVehicle,
  decodeVin,
} from '../../services/vehicleEnrichment.service.js'

export const listMakes = asyncHandler(async (_req, res) => {
  const data = await getMakes()
  res.json(data)
})

export const listModels = asyncHandler(async (req, res) => {
  const { make } = req.query
  if (!make || typeof make !== 'string' || make.trim().length < 1) {
    throw badRequest('Parámetro "make" requerido.')
  }
  const data = await getModels(make.trim())
  res.json(data)
})

export const listYears = asyncHandler(async (req, res) => {
  const { make, model } = req.query
  if (!make || typeof make !== 'string' || !model || typeof model !== 'string') {
    throw badRequest('Parámetros "make" y "model" requeridos.')
  }
  const data = await getYears(make.trim(), model.trim())
  res.json(data)
})

export const enrichVehicleHandler = asyncHandler(async (req, res) => {
  const { make, model, year } = req.query
  if (!make || !model || !year) {
    throw badRequest('Parámetros "make", "model" y "year" requeridos.')
  }
  const yearNum = Number.parseInt(year, 10)
  if (!Number.isInteger(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 2) {
    throw badRequest('Año inválido.')
  }
  const data = await enrichVehicle(make.trim(), model.trim(), yearNum)
  res.json(data)
})

export const decodeVinHandler = asyncHandler(async (req, res) => {
  const { vin } = req.params
  if (!vin || typeof vin !== 'string') {
    throw badRequest('VIN requerido.')
  }
  const clean = vin.trim()
  if (clean.length < 11 || clean.length > 17) {
    throw badRequest('VIN inválido. Debe tener entre 11 y 17 caracteres.')
  }
  const data = await decodeVin(clean)
  res.json(data)
})
