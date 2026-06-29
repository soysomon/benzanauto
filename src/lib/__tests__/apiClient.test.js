import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { COOKIE_SESSION_TOKEN, clearStoredAdminToken, setStoredAdminCsrfToken } from '../adminSession'
import { ApiError, apiRequest } from '../apiClient'

function createJsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'content-type': 'application/json',
    },
    ...init,
  })
}

describe('apiRequest', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    clearStoredAdminToken()
    vi.unstubAllGlobals()
  })

  it('attaches CSRF and cookie credentials for admin mutations without sending bearer auth for cookie sessions', async () => {
    setStoredAdminCsrfToken('csrf-token-123')
    fetch.mockResolvedValue(createJsonResponse({ ok: true }))

    await apiRequest('/admin/vehicles', {
      method: 'POST',
      token: COOKIE_SESSION_TOKEN,
      body: { title: 'Toyota Prado' },
    })

    expect(fetch).toHaveBeenCalledTimes(1)

    const [requestUrl, requestOptions] = fetch.mock.calls[0]
    expect(requestUrl).toBe('/api/admin/vehicles')
    expect(requestOptions.credentials).toBe('include')
    expect(requestOptions.method).toBe('POST')
    expect(requestOptions.headers.get('x-csrf-token')).toBe('csrf-token-123')
    expect(requestOptions.headers.get('authorization')).toBeNull()
    expect(requestOptions.headers.get('content-type')).toBe('application/json')
    expect(requestOptions.body).toBe(JSON.stringify({ title: 'Toyota Prado' }))
  })

  it('sends bearer auth on admin reads when a token-based session is used', async () => {
    fetch.mockResolvedValue(createJsonResponse({ user: { id: '1' } }))

    await apiRequest('/admin/auth/me', {
      token: 'jwt-token-123',
    })

    const [, requestOptions] = fetch.mock.calls[0]
    expect(requestOptions.credentials).toBe('include')
    expect(requestOptions.headers.get('authorization')).toBe('Bearer jwt-token-123')
    expect(requestOptions.headers.get('x-csrf-token')).toBeNull()
  })

  it('emits an unauthorized admin event and throws a typed error on 401 responses', async () => {
    fetch.mockResolvedValue(
      createJsonResponse(
        {
          error: {
            message: 'No autorizado.',
            code: 'UNAUTHORIZED',
          },
        },
        { status: 401 },
      ),
    )

    const unauthorizedListener = vi.fn()
    window.addEventListener('benzan:admin-unauthorized', unauthorizedListener)

    await expect(
      apiRequest('/admin/auth/me', {
        token: 'jwt-token-123',
      }),
    ).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'No autorizado.',
    })

    expect(unauthorizedListener).toHaveBeenCalledTimes(1)
    const [event] = unauthorizedListener.mock.calls[0]
    expect(event.detail.request.path).toBe('/admin/auth/me')
    expect(event.detail.request.hasAuthorization).toBe(true)

    window.removeEventListener('benzan:admin-unauthorized', unauthorizedListener)
  })

  it('converts network failures into ApiError instances', async () => {
    fetch.mockRejectedValue(new Error('socket hang up'))

    const error = await apiRequest('/vehicles').catch((requestError) => requestError)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 500,
      code: 'NETWORK_ERROR',
    })
  })
})
