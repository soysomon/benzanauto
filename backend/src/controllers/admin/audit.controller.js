import { asyncHandler } from '../../utils/async-handler.js'
import { listAuditLogs } from '../../services/audit.service.js'

export const index = asyncHandler(async (req, res) => {
  const response = await listAuditLogs(req.validated.query)
  res.json(response)
})
