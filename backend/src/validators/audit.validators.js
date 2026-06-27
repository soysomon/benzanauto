import { z } from 'zod'
import {
  numberish,
  objectIdParam,
  optionalTrimmedString,
} from './common.validators.js'

export const auditListQuerySchema = z.object({
  page: numberish('La pagina', { integer: true, min: 1 }).optional(),
  limit: numberish('El limite', { integer: true, min: 1, max: 100 }).optional(),
  action: optionalTrimmedString(120),
  actorId: objectIdParam.optional(),
  targetUserId: objectIdParam.optional(),
  search: optionalTrimmedString(120),
})
