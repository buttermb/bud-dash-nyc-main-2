import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle, Clock, TrendingUp, Users, ShoppingCart } from 'lucide-react'
import { useMonitoring } from '@/utils/productionMonitor'

interface Alert {
  timestamp: Date
  metric: string
  value: number
  threshold: number
  severity: string
}

export const MonitoringDashboard: React.FC = () => {
  const { metrics, alertHistory } = useMonitoring()
  const [alerts, setAlerts] = useState<Alert[]>([])

  useEffect(() => {
    setAlerts(alertHistory.slice(-10)) // Show last 10 alerts

    // Listen for new alerts
    const handleAlert = (event: CustomEvent) => {
      const { alert, severity } = event.detail
      setAlerts(prev => [...prev, { ...alert, severity }].slice(-10))
    }

    window.addEventListener('monitoring-alert', handleAlert as EventListener)
    return () => window.removeEventListener('monitoring-alert', handleAlert as EventListener)
  }, [alertHistory])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive'
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'secondary'
    }
  }

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'ordersPerMinute': return <ShoppingCart className="h-4 w-4" />
      case 'activeUsers': return <Users className="h-4 w-4" />
      case 'pageLoadTime': return <Clock className="h-4 w-4" />
      case 'errorRate': return <AlertTriangle className="h-4 w-4" />
      default: return <TrendingUp className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Load Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(metrics.pageLoadTime)}ms
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.pageLoadTime < 2000 ? 'Excellent' : 
               metrics.pageLoadTime < 3000 ? 'Good' : 'Needs attention'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.errorRate.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.errorRate < 1 ? 'Excellent' : 
               metrics.errorRate < 5 ? 'Good' : 'Critical'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders/Min</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.ordersPerMinute}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.ordersPerMinute > 0 ? 'Active' : 'No orders'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.activeUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently online
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
          <CardDescription>
            System alerts and notifications from the last 24 hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">No recent alerts</p>
                <p className="text-sm text-muted-foreground">System is running smoothly</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getMetricIcon(alert.metric)}
                    <div>
                      <p className="font-medium">{alert.metric}</p>
                      <p className="text-sm text-muted-foreground">
                        Value: {alert.value} | Threshold: {alert.threshold}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {alert.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>
            Overall system performance and health indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {metrics.memoryUsage < 70 ? 'Good' : 'Warning'}
              </div>
              <p className="text-sm text-muted-foreground">Memory Usage</p>
              <p className="text-xs">{metrics.memoryUsage.toFixed(1)}%</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {metrics.cacheHitRate.toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground">Cache Hit Rate</p>
              <p className="text-xs">
                {metrics.cacheHitRate > 80 ? 'Excellent' : 'Needs optimization'}
              </p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {metrics.databaseConnections}
              </div>
              <p className="text-sm text-muted-foreground">DB Connections</p>
              <p className="text-xs">
                {metrics.databaseConnections < 50 ? 'Healthy' : 'High load'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
