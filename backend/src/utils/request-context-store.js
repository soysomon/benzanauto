import { AsyncLocalStorage } from 'node:async_hooks'

const requestContextStorage = new AsyncLocalStorage()

export function runWithRequestContext(context, callback) {
  return requestContextStorage.run({ ...context }, callback)
}

export function getRequestContext() {
  return requestContextStorage.getStore() ?? null
}

export function updateRequestContext(patch = {}) {
  const store = requestContextStorage.getStore()
  if (!store) return null

  Object.assign(store, patch)
  return store
}
