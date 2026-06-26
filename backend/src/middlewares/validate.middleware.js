import { isProduction } from '../config/env.js'

export function validateRequest({ body, params, query } = {}) {
  return (req, _res, next) => {
    try {
      if (
        !isProduction()
        && body
        && req.originalUrl.startsWith('/api/admin/vehicles')
        && ['POST', 'PUT', 'PATCH'].includes(req.method)
      ) {
        console.log('[ValidateRequest Debug] payload before schema parse', {
          method: req.method,
          path: req.originalUrl,
          body: req.body,
        })
      }

      req.validated = {
        body: body ? body.parse(req.body) : req.body,
        params: params ? params.parse(req.params) : req.params,
        query: query ? query.parse(req.query) : req.query,
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}
