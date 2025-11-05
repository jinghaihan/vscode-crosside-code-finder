import type { HistoryEntry } from 'code-finder'
import { config } from './config'

const cache = new Map<string, { data: HistoryEntry[], timestamp: number }>()

function getCacheKey(): string {
  return JSON.stringify({
    ide: config.ide,
    workspace: config.workspace,
    ignorePaths: config.ignorePaths,
  })
}

export function getCachedData(): HistoryEntry[] | undefined {
  const cacheTTL = config.cacheTTL
  if (cacheTTL <= 0)
    return

  const key = getCacheKey()
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < cacheTTL)
    return cached.data
}

export function setCachedData(data: HistoryEntry[]) {
  clearCache()

  const key = getCacheKey()
  cache.set(key, { data, timestamp: Date.now() })
}

export function clearCache() {
  cache.clear()
}
