/**
 * Advanced Performance Optimizations
 * Final performance enhancements for production launch
 */

import { analytics } from './analytics'

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number // Largest Contentful Paint
  fid: number // First Input Delay
  cls: number // Cumulative Layout Shift
  fcp: number // First Contentful Paint
  ttfb: number // Time to First Byte
  
  // Custom metrics
  jsLoadTime: number
  cssLoadTime: number
  imageLoadTime: number
  apiResponseTime: number
  bundleSize: number
  cacheHitRate: number
}

class PerformanceOptimizer {
  private metrics: PerformanceMetrics
  private observers: PerformanceObserver[]
  private isInitialized: boolean = false

  constructor() {
    this.metrics = {
      lcp: 0,
      fid: 0,
      cls: 0,
      fcp: 0,
      ttfb: 0,
      jsLoadTime: 0,
      cssLoadTime: 0,
      imageLoadTime: 0,
      apiResponseTime: 0,
      bundleSize: 0,
      cacheHitRate: 0,
    }

    this.observers = []
  }

  /**
   * Initialize performance monitoring
   */
  init(): void {
    if (this.isInitialized || typeof window === 'undefined') return

    this.measureCoreWebVitals()
    this.measureCustomMetrics()
    this.setupResourceTiming()
    this.setupNavigationTiming()
    this.setupImageOptimization()
    this.setupPrefetching()
    this.setupCriticalResourceHints()

    this.isInitialized = true
  }

  /**
   * Measure Core Web Vitals
   */
  private measureCoreWebVitals(): void {
    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as PerformanceEntry
        this.metrics.lcp = lastEntry.startTime
        this.reportMetric('lcp', lastEntry.startTime)
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      this.observers.push(lcpObserver)

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          this.metrics.fid = entry.processingStart - entry.startTime
          this.reportMetric('fid', this.metrics.fid)
        })
      })
      fidObserver.observe({ entryTypes: ['first-input'] })
      this.observers.push(fidObserver)

      // Cumulative Layout Shift
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
        this.metrics.cls = clsValue
        this.reportMetric('cls', clsValue)
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })
      this.observers.push(clsObserver)
    }
  }

  /**
   * Measure custom performance metrics
   */
  private measureCustomMetrics(): void {
    if (typeof window === 'undefined' || !window.performance) return

    // First Contentful Paint
    const fcpEntry = window.performance.getEntriesByName('first-contentful-paint')[0]
    if (fcpEntry) {
      this.metrics.fcp = fcpEntry.startTime
      this.reportMetric('fcp', fcpEntry.startTime)
    }

    // Time to First Byte
    const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigation) {
      this.metrics.ttfb = navigation.responseStart - navigation.requestStart
      this.reportMetric('ttfb', this.metrics.ttfb)
    }

    // JavaScript load time
    const jsEntries = window.performance.getEntriesByType('resource')
      .filter((entry: any) => entry.name.includes('.js'))
    
    if (jsEntries.length > 0) {
      this.metrics.jsLoadTime = jsEntries.reduce((total, entry: any) => 
        total + (entry.responseEnd - entry.responseStart), 0) / jsEntries.length
    }

    // CSS load time
    const cssEntries = window.performance.getEntriesByType('resource')
      .filter((entry: any) => entry.name.includes('.css'))
    
    if (cssEntries.length > 0) {
      this.metrics.cssLoadTime = cssEntries.reduce((total, entry: any) => 
        total + (entry.responseEnd - entry.responseStart), 0) / cssEntries.length
    }
  }

  /**
   * Setup resource timing monitoring
   */
  private setupResourceTiming(): void {
    if (typeof window === 'undefined') return

    window.addEventListener('load', () => {
      const resources = window.performance.getEntriesByType('resource')
      
      resources.forEach((resource: any) => {
        const loadTime = resource.responseEnd - resource.responseStart
        
        // Track slow resources
        if (loadTime > 1000) {
          this.reportSlowResource(resource.name, loadTime)
        }

        // Track image load times
        if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
          this.metrics.imageLoadTime = Math.max(this.metrics.imageLoadTime, loadTime)
        }
      })
    })
  }

  /**
   * Setup navigation timing
   */
  private setupNavigationTiming(): void {
    if (typeof window === 'undefined' || !window.performance) return

    window.addEventListener('load', () => {
      const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      if (navigation) {
        const metrics = {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          domInteractive: navigation.domInteractive - navigation.navigationStart,
        }

        // Report navigation metrics
        Object.entries(metrics).forEach(([key, value]) => {
          this.reportMetric(key, value)
        })
      }
    })
  }

  /**
   * Setup image optimization
   */
  private setupImageOptimization(): void {
    if (typeof window === 'undefined') return

    // Lazy load images
    const images = document.querySelectorAll('img[data-src]')
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          img.src = img.dataset.src || ''
          img.removeAttribute('data-src')
          imageObserver.unobserve(img)
        }
      })
    })

    images.forEach((img) => imageObserver.observe(img))

    // Preload critical images
    this.preloadCriticalImages()
  }

  /**
   * Setup intelligent prefetching
   */
  private setupPrefetching(): void {
    if (typeof window === 'undefined') return

    // Prefetch on hover
    const links = document.querySelectorAll('a[href]')
    links.forEach((link) => {
      link.addEventListener('mouseenter', () => {
        this.prefetchResource(link.getAttribute('href')!)
      }, { once: true })
    })

    // Prefetch based on user behavior
    this.setupBehavioralPrefetching()
  }

  /**
   * Setup critical resource hints
   */
  private setupCriticalResourceHints(): void {
    if (typeof window === 'undefined') return

    const head = document.head

    // DNS prefetch for external domains
    const externalDomains = [
      'fonts.googleapis.com',
      'fonts.gstatic.com',
      'api.mapbox.com',
      '*.supabase.co'
    ]

    externalDomains.forEach((domain) => {
      const link = document.createElement('link')
      link.rel = 'dns-prefetch'
      link.href = `//${domain}`
      head.appendChild(link)
    })

    // Preconnect to critical resources
    const criticalResources = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com'
    ]

    criticalResources.forEach((resource) => {
      const link = document.createElement('link')
      link.rel = 'preconnect'
      link.href = resource
      link.crossOrigin = 'anonymous'
      head.appendChild(link)
    })
  }

  /**
   * Preload critical images
   */
  private preloadCriticalImages(): void {
    const criticalImages = [
      '/placeholder.svg', // Logo
      '/hero-bg.jpg', // Hero background
    ]

    criticalImages.forEach((src) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = src
      document.head.appendChild(link)
    })
  }

  /**
   * Setup behavioral prefetching
   */
  private setupBehavioralPrefetching(): void {
    if (typeof window === 'undefined') return

    // Track user interactions
    let interactionCount = 0
    const interactionThreshold = 3

    const trackInteraction = () => {
      interactionCount++
      
      if (interactionCount >= interactionThreshold) {
        // User is engaged, prefetch likely next pages
        this.prefetchLikelyPages()
      }
    }

    // Track various interactions
    document.addEventListener('click', trackInteraction)
    document.addEventListener('scroll', trackInteraction)
    document.addEventListener('keydown', trackInteraction)
  }

  /**
   * Prefetch likely next pages
   */
  private prefetchLikelyPages(): void {
    const likelyPages = [
      '/cart',
      '/checkout',
      '/my-orders',
      '/account'
    ]

    likelyPages.forEach((page) => {
      this.prefetchResource(page)
    })
  }

  /**
   * Prefetch a resource
   */
  private prefetchResource(href: string): void {
    if (typeof window === 'undefined') return

    // Check if already prefetched
    if (document.querySelector(`link[href="${href}"]`)) return

    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = href
    document.head.appendChild(link)
  }

  /**
   * Report performance metric
   */
  private reportMetric(name: string, value: number): void {
    // Send to analytics
    analytics.trackEvent('performance_metric', {
      metric: name,
      value: Math.round(value),
      timestamp: Date.now(),
    })

    // Send to monitoring system
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('performance-metric', {
        detail: { name, value }
      })
      window.dispatchEvent(event)
    }
  }

  /**
   * Report slow resource
   */
  private reportSlowResource(name: string, loadTime: number): void {
    analytics.trackEvent('slow_resource', {
      resource: name,
      loadTime: Math.round(loadTime),
      timestamp: Date.now(),
    })
  }

  /**
   * Optimize bundle loading
   */
  optimizeBundleLoading(): void {
    if (typeof window === 'undefined') return

    // Dynamic import for non-critical components
    const nonCriticalRoutes = [
      '/admin',
      '/courier',
      '/blog',
      '/support'
    ]

    // Preload route chunks on user interaction
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      const link = target.closest('a[href]')
      
      if (link) {
        const href = link.getAttribute('href')
        if (href && nonCriticalRoutes.some(route => href.startsWith(route))) {
          // Preload the route chunk
          import(/* webpackChunkName: "route-[request]" */ `../pages${href}`)
            .catch(() => {
              // Route doesn't exist or already loaded
            })
        }
      }
    })
  }

  /**
   * Setup service worker optimization
   */
  setupServiceWorkerOptimization(): void {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    navigator.serviceWorker.register('/sw.js').then((registration) => {
      // Update service worker in background
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              this.showUpdateNotification()
            }
          })
        }
      })
    })
  }

  /**
   * Show update notification
   */
  private showUpdateNotification(): void {
    if (typeof window === 'undefined') return

    const event = new CustomEvent('sw-update-available')
    window.dispatchEvent(event)
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  /**
   * Cleanup observers
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

// Export singleton instance
export const performanceOptimizer = new PerformanceOptimizer()

// Auto-initialize in production
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  performanceOptimizer.init()
  performanceOptimizer.optimizeBundleLoading()
  performanceOptimizer.setupServiceWorkerOptimization()
}

// Export for manual use
export const usePerformanceOptimization = () => {
  return {
    init: performanceOptimizer.init.bind(performanceOptimizer),
    getMetrics: performanceOptimizer.getMetrics.bind(performanceOptimizer),
    cleanup: performanceOptimizer.cleanup.bind(performanceOptimizer),
  }
}
