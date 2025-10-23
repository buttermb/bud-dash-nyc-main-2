/**
 * Production Monitoring & Alerting System
 * Real-time monitoring for critical metrics and alerts
 */

import { analytics } from './analytics'

export interface MonitoringMetrics {
  // Performance metrics
  pageLoadTime: number
  apiResponseTime: number
  errorRate: number
  memoryUsage: number
  
  // Business metrics
  ordersPerMinute: number
  activeUsers: number
  conversionRate: number
  
  // System metrics
  databaseConnections: number
  cacheHitRate: number
  queueLength: number
}

export interface AlertConfig {
  metric: keyof MonitoringMetrics
  threshold: number
  operator: 'gt' | 'lt' | 'eq'
  severity: 'low' | 'medium' | 'high' | 'critical'
  enabled: boolean
}

class ProductionMonitor {
  private metrics: MonitoringMetrics
  private alerts: AlertConfig[]
  private alertHistory: Array<{
    timestamp: Date
    metric: string
    value: number
    threshold: number
    severity: string
  }>

  constructor() {
    this.metrics = {
      pageLoadTime: 0,
      apiResponseTime: 0,
      errorRate: 0,
      memoryUsage: 0,
      ordersPerMinute: 0,
      activeUsers: 0,
      conversionRate: 0,
      databaseConnections: 0,
      cacheHitRate: 0,
      queueLength: 0,
    }

    this.alerts = [
      // Critical alerts
      { metric: 'errorRate', threshold: 5, operator: 'gt', severity: 'critical', enabled: true },
      { metric: 'pageLoadTime', threshold: 3000, operator: 'gt', severity: 'high', enabled: true },
      { metric: 'apiResponseTime', threshold: 2000, operator: 'gt', severity: 'high', enabled: true },
      
      // Performance alerts
      { metric: 'memoryUsage', threshold: 80, operator: 'gt', severity: 'medium', enabled: true },
      { metric: 'databaseConnections', threshold: 90, operator: 'gt', severity: 'medium', enabled: true },
      
      // Business alerts
      { metric: 'ordersPerMinute', threshold: 0, operator: 'lt', severity: 'low', enabled: true },
    ]

    this.alertHistory = []
    this.startMonitoring()
  }

  private startMonitoring() {
    // Monitor performance metrics every 30 seconds
    setInterval(() => {
      this.collectPerformanceMetrics()
      this.checkAlerts()
    }, 30000)

    // Monitor business metrics every 5 minutes
    setInterval(() => {
      this.collectBusinessMetrics()
    }, 300000)

    // Monitor system metrics every minute
    setInterval(() => {
      this.collectSystemMetrics()
    }, 60000)
  }

  private collectPerformanceMetrics() {
    // Page load time
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart
    }

    // Memory usage (if available)
    if (typeof window !== 'undefined' && (window as any).performance?.memory) {
      const memory = (window as any).performance.memory
      this.metrics.memoryUsage = (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
    }

    // Error rate calculation
    this.calculateErrorRate()
  }

  private async collectBusinessMetrics() {
    try {
      // This would typically call your analytics API
      const response = await fetch('/api/analytics/metrics')
      if (response.ok) {
        const data = await response.json()
        this.metrics.ordersPerMinute = data.ordersPerMinute || 0
        this.metrics.activeUsers = data.activeUsers || 0
        this.metrics.conversionRate = data.conversionRate || 0
      }
    } catch (error) {
      console.error('Failed to collect business metrics:', error)
    }
  }

  private async collectSystemMetrics() {
    try {
      // Database connections and cache hit rate
      const response = await fetch('/api/system/metrics')
      if (response.ok) {
        const data = await response.json()
        this.metrics.databaseConnections = data.databaseConnections || 0
        this.metrics.cacheHitRate = data.cacheHitRate || 0
        this.metrics.queueLength = data.queueLength || 0
      }
    } catch (error) {
      console.error('Failed to collect system metrics:', error)
    }
  }

  private calculateErrorRate() {
    // Calculate error rate from recent errors
    const recentErrors = this.alertHistory.filter(
      alert => alert.timestamp > new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
    ).length

    const totalRequests = 100 // This would be calculated from actual request logs
    this.metrics.errorRate = (recentErrors / totalRequests) * 100
  }

  private checkAlerts() {
    this.alerts.forEach(alert => {
      if (!alert.enabled) return

      const currentValue = this.metrics[alert.metric]
      let shouldAlert = false

      switch (alert.operator) {
        case 'gt':
          shouldAlert = currentValue > alert.threshold
          break
        case 'lt':
          shouldAlert = currentValue < alert.threshold
          break
        case 'eq':
          shouldAlert = currentValue === alert.threshold
          break
      }

      if (shouldAlert) {
        this.triggerAlert(alert, currentValue)
      }
    })
  }

  private triggerAlert(alert: AlertConfig, value: number) {
    const alertRecord = {
      timestamp: new Date(),
      metric: alert.metric,
      value,
      threshold: alert.threshold,
      severity: alert.severity,
    }

    this.alertHistory.push(alertRecord)

    // Send alert based on severity
    switch (alert.severity) {
      case 'critical':
        this.sendCriticalAlert(alertRecord)
        break
      case 'high':
        this.sendHighAlert(alertRecord)
        break
      case 'medium':
        this.sendMediumAlert(alertRecord)
        break
      case 'low':
        this.sendLowAlert(alertRecord)
        break
    }

    // Track in analytics
    analytics.trackEvent('alert_triggered', {
      metric: alert.metric,
      value,
      threshold: alert.threshold,
      severity: alert.severity,
    })
  }

  private sendCriticalAlert(alert: any) {
    // Send immediate notification (Slack, email, SMS)
    this.sendSlackAlert(`🚨 CRITICAL ALERT: ${alert.metric} is ${alert.value} (threshold: ${alert.threshold})`)
    this.sendEmailAlert(alert, 'critical')
    
    // Show in-app notification
    this.showInAppAlert(alert, 'critical')
  }

  private sendHighAlert(alert: any) {
    this.sendSlackAlert(`⚠️ HIGH ALERT: ${alert.metric} is ${alert.value} (threshold: ${alert.threshold})`)
    this.showInAppAlert(alert, 'high')
  }

  private sendMediumAlert(alert: any) {
    this.showInAppAlert(alert, 'medium')
  }

  private sendLowAlert(alert: any) {
    // Log only
    console.warn(`Low alert: ${alert.metric} is ${alert.value}`)
  }

  private async sendSlackAlert(message: string) {
    try {
      await fetch('/api/alerts/slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
    } catch (error) {
      console.error('Failed to send Slack alert:', error)
    }
  }

  private async sendEmailAlert(alert: any, severity: string) {
    try {
      await fetch('/api/alerts/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'alerts@newyorkminutenyc.com',
          subject: `${severity.toUpperCase()} Alert: ${alert.metric}`,
          body: `Metric: ${alert.metric}\nValue: ${alert.value}\nThreshold: ${alert.threshold}\nTime: ${alert.timestamp}`,
        }),
      })
    } catch (error) {
      console.error('Failed to send email alert:', error)
    }
  }

  private showInAppAlert(alert: any, severity: string) {
    // Show toast notification
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('monitoring-alert', {
        detail: { alert, severity },
      })
      window.dispatchEvent(event)
    }
  }

  // Public methods
  public getMetrics(): MonitoringMetrics {
    return { ...this.metrics }
  }

  public getAlertHistory() {
    return [...this.alertHistory]
  }

  public addCustomAlert(config: AlertConfig) {
    this.alerts.push(config)
  }

  public updateMetric(metric: keyof MonitoringMetrics, value: number) {
    this.metrics[metric] = value
  }
}

// Export singleton instance
export const productionMonitor = new ProductionMonitor()

// Export for use in components
export const useMonitoring = () => {
  return {
    metrics: productionMonitor.getMetrics(),
    alertHistory: productionMonitor.getAlertHistory(),
    updateMetric: productionMonitor.updateMetric.bind(productionMonitor),
  }
}
