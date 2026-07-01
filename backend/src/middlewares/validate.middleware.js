export function validateRequest({ body, params, query } = {}) {
  return (req, _res, next) => {
    try {
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
