/**
 * Advanced Caching Strategy
 * Multi-tier caching for optimal performance
 */

interface CacheConfig {
  name: string
  maxAge: number
  maxEntries: number
  strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate'
}

class AdvancedCacheManager {
  private caches: Map<string, Cache> = new Map()
  private configs: Map<string, CacheConfig> = new Map()

  constructor() {
    this.initializeCacheConfigs()
  }

  private initializeCacheConfigs(): void {
    const configs: CacheConfig[] = [
      {
        name: 'static-assets',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        maxEntries: 100,
        strategy: 'cache-first'
      },
      {
        name: 'api-responses',
        maxAge: 5 * 60 * 1000, // 5 minutes
        maxEntries: 50,
        strategy: 'stale-while-revalidate'
      },
      {
        name: 'user-data',
        maxAge: 60 * 1000, // 1 minute
        maxEntries: 20,
        strategy: 'network-first'
      },
      {
        name: 'product-images',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        maxEntries: 200,
        strategy: 'cache-first'
      }
    ]

    configs.forEach(config => {
      this.configs.set(config.name, config)
    })
  }

  async getCache(name: string): Promise<Cache | null> {
    if (!this.caches.has(name)) {
      try {
        const cache = await caches.open(name)
        this.caches.set(name, cache)
      } catch (error) {
        console.error(`Failed to open cache ${name}:`, error)
        return null
      }
    }
    return this.caches.get(name) || null
  }

  async get(request: Request, cacheName: string): Promise<Response | null> {
    const cache = await this.getCache(cacheName)
    if (!cache) return null

    const config = this.configs.get(cacheName)
    if (!config) return null

    const cachedResponse = await cache.match(request)
    
    if (!cachedResponse) return null

    // Check if cache is still valid
    const cacheTime = cachedResponse.headers.get('cache-time')
    if (cacheTime) {
      const age = Date.now() - parseInt(cacheTime)
      if (age > config.maxAge) {
        await cache.delete(request)
        return null
      }
    }

    return cachedResponse
  }

  async put(request: Request, response: Response, cacheName: string): Promise<void> {
    const cache = await this.getCache(cacheName)
    if (!cache) return

    const config = this.configs.get(cacheName)
    if (!config) return

    // Clone response and add cache metadata
    const responseToCache = response.clone()
    const headers = new Headers(responseToCache.headers)
    headers.set('cache-time', Date.now().toString())
    
    const cachedResponse = new Response(responseToCache.body, {
      status: responseToCache.status,
      statusText: responseToCache.statusText,
      headers
    })

    await cache.put(request, cachedResponse)
    
    // Clean up old entries if needed
    await this.cleanupCache(cacheName)
  }

  private async cleanupCache(cacheName: string): Promise<void> {
    const cache = await this.getCache(cacheName)
    const config = this.configs.get(cacheName)
    
    if (!cache || !config) return

    const keys = await cache.keys()
    
    if (keys.length > config.maxEntries) {
      // Remove oldest entries
      const entriesToRemove = keys.slice(0, keys.length - config.maxEntries)
      await Promise.all(entriesToRemove.map(key => cache.delete(key)))
    }
  }

  async clearCache(cacheName: string): Promise<void> {
    const cache = await this.getCache(cacheName)
    if (cache) {
      const keys = await cache.keys()
      await Promise.all(keys.map(key => cache.delete(key)))
    }
  }

  async clearAllCaches(): Promise<void> {
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map(name => caches.delete(name)))
    this.caches.clear()
  }

  getCacheStats(): Record<string, { size: number; maxAge: number; strategy: string }> {
    const stats: Record<string, { size: number; maxAge: number; strategy: string }> = {}
    
    this.configs.forEach((config, name) => {
      stats[name] = {
        size: this.caches.get(name) ? 0 : 0, // Would need to count entries
        maxAge: config.maxAge,
        strategy: config.strategy
      }
    })
    
    return stats
  }
}

// Export singleton
export const cacheManager = new AdvancedCacheManager()

// Enhanced fetch with caching
export async function cachedFetch(
  url: string | Request,
  options: RequestInit = {},
  cacheName: string = 'api-responses'
): Promise<Response> {
  const request = typeof url === 'string' ? new Request(url, options) : url
  const config = cacheManager['configs'].get(cacheName)
  
  if (!config) {
    return fetch(request)
  }

  // Try cache first for cache-first strategy
  if (config.strategy === 'cache-first') {
    const cachedResponse = await cacheManager.get(request, cacheName)
    if (cachedResponse) {
      return cachedResponse
    }
  }

  try {
    const response = await fetch(request)
    
    // Cache successful responses
    if (response.ok) {
      await cacheManager.put(request, response, cacheName)
    }
    
    return response
  } catch (error) {
    // For network-first strategy, try cache on network failure
    if (config.strategy === 'network-first') {
      const cachedResponse = await cacheManager.get(request, cacheName)
      if (cachedResponse) {
        return cachedResponse
      }
    }
    throw error
  }
}

// Preload critical resources
export async function preloadCriticalResources(): Promise<void> {
  const criticalResources = [
    { url: '/api/products/featured', cacheName: 'api-responses' },
    { url: '/api/user/profile', cacheName: 'user-data' },
  ]

  await Promise.all(
    criticalResources.map(async ({ url, cacheName }) => {
      try {
        await cachedFetch(url, {}, cacheName)
      } catch (error) {
        console.warn(`Failed to preload ${url}:`, error)
      }
    })
  )
}

// Background sync for offline support
export async function setupBackgroundSync(): Promise<void> {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    const registration = await navigator.serviceWorker.ready
    
    // Register background sync for failed requests
    await registration.sync.register('background-sync')
  }
}

export { AdvancedCacheManager }
