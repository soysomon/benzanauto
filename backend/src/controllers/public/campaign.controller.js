import { asyncHandler } from '../../utils/async-handler.js'
import { getActiveCampaignForContext } from '../../services/campaign.service.js'

function setCampaignCacheHeaders(res, { maxAge = 20, staleWhileRevalidate = 120 } = {}) {
  res.setHeader('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`)
  res.setHeader('Vary', 'Origin, Accept-Encoding')
}

export const active = asyncHandler(async (req, res) => {
  const campaign = await getActiveCampaignForContext(req.validated.query)
  setCampaignCacheHeaders(res, { maxAge: 20, staleWhileRevalidate: 120 })
  res.json({ campaign })
})
