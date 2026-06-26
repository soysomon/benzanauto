import { asyncHandler } from '../../utils/async-handler.js'
import { getDashboardStats } from '../../services/dashboard.service.js'

export const stats = asyncHandler(async (_req, res) => {
  const response = await getDashboardStats()
  res.json(response)
})

