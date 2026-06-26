import { Router } from 'express'
import {
  listMakes,
  listModels,
  listYears,
  enrichVehicleHandler,
  decodeVinHandler,
} from '../../controllers/public/vehicleData.controller.js'

const router = Router()

router.get('/makes', listMakes)
router.get('/models', listModels)
router.get('/years', listYears)
router.get('/enrich', enrichVehicleHandler)
router.get('/vin/:vin', decodeVinHandler)

export default router
