import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Filter, 
  Download, 
  Upload, 
  RefreshCw, 
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
  ShoppingCart,
  Package,
  Truck,
  Bell,
  Settings,
  Zap,
  Target,
  BarChart3,
  Calendar,
  MapPin,
  Activity
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { toast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface AdminQuickStats {
  totalOrders: number
  activeOrders: number
  pendingVerifications: number
  flaggedOrders: number
  todayRevenue: number
  activeCouriers: number
  totalUsers: number
  systemHealth: 'healthy' | 'warning' | 'critical'
}

interface RecentActivity {
  id: string
  type: 'order' | 'user' | 'courier' | 'system'
  action: string
  timestamp: Date
  user?: string
  details?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

interface QuickAction {
  id: string
  label: string
  icon: React.ComponentType<any>
  path: string
  color: string
  shortcut?: string
  description?: string
}

export const EnhancedAdminDashboard: React.FC = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<AdminQuickStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTab, setSelectedTab] = useState('overview')

  // Quick actions with keyboard shortcuts
  const quickActions: QuickAction[] = [
    { id: 'orders', label: 'Orders', icon: ShoppingCart, path: '/admin/orders', color: 'text-blue-600', shortcut: 'O', description: 'Manage all orders' },
    { id: 'users', label: 'Users', icon: Users, path: '/admin/users', color: 'text-green-600', shortcut: 'U', description: 'User management' },
    { id: 'products', label: 'Products', icon: Package, path: '/admin/products', color: 'text-purple-600', shortcut: 'P', description: 'Product catalog' },
    { id: 'couriers', label: 'Couriers', icon: Truck, path: '/admin/couriers', color: 'text-orange-600', shortcut: 'C', description: 'Courier management' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/admin/analytics', color: 'text-indigo-600', shortcut: 'A', description: 'Business insights' },
    { id: 'live-map', label: 'Live Map', icon: MapPin, path: '/admin/live-map', color: 'text-red-600', shortcut: 'M', description: 'Real-time tracking' },
    { id: 'notifications', label: 'Alerts', icon: Bell, path: '/admin/notifications', color: 'text-yellow-600', shortcut: 'N', description: 'System notifications' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/admin/settings', color: 'text-gray-600', shortcut: 'S', description: 'System configuration' },
  ]

  useEffect(() => {
    loadDashboardData()
    
    // Set up keyboard shortcuts
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        const action = quickActions.find(a => a.shortcut === e.key.toUpperCase())
        if (action) {
          e.preventDefault()
          navigate(action.path)
          toast({ title: `Navigated to ${action.label}` })
        }
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Load stats
      const [ordersResult, usersResult, couriersResult] = await Promise.all([
        supabase.from('orders').select('id, status, total, created_at'),
        supabase.from('users').select('id, created_at'),
        supabase.from('couriers').select('id, status')
      ])

      const orders = ordersResult.data || []
      const users = usersResult.data || []
      const couriers = couriersResult.data || []

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const todayOrders = orders.filter(order => 
        new Date(order.created_at) >= today
      )

      const activeOrders = orders.filter(order => 
        ['pending', 'confirmed', 'preparing', 'out_for_delivery'].includes(order.status)
      )

      const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.total || 0), 0)
      const activeCouriers = couriers.filter(courier => courier.status === 'active').length

      setStats({
        totalOrders: orders.length,
        activeOrders: activeOrders.length,
        pendingVerifications: 0, // Would need to query age_verifications
        flaggedOrders: orders.filter(order => order.status === 'flagged').length,
        todayRevenue,
        activeCouriers,
        totalUsers: users.length,
        systemHealth: 'healthy'
      })

      // Load recent activity (mock data for now)
      setRecentActivity([
        {
          id: '1',
          type: 'order',
          action: 'New order placed',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          user: 'john@example.com',
          details: 'Order #12345 - $89.99',
          severity: 'low'
        },
        {
          id: '2',
          type: 'system',
          action: 'High error rate detected',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          details: 'Error rate: 5.2%',
          severity: 'high'
        },
        {
          id: '3',
          type: 'courier',
          action: 'Courier went offline',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          user: 'courier_123',
          details: 'Last seen: 30 minutes ago',
          severity: 'medium'
        }
      ])

    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      toast({ title: 'Failed to load dashboard data', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredActions = useMemo(() => {
    if (!searchQuery) return quickActions
    return quickActions.filter(action => 
      action.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      action.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive'
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'secondary'
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order': return ShoppingCart
      case 'user': return Users
      case 'courier': return Truck
      case 'system': return AlertTriangle
      default: return Activity
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening.</p>
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search actions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button onClick={loadDashboardData} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{stats.totalOrders}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Orders</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.activeOrders}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Today's Revenue</p>
                  <p className="text-2xl font-bold text-green-600">${stats.todayRevenue.toFixed(2)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Couriers</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.activeCouriers}</p>
                </div>
                <Truck className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="actions">Quick Actions</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Overall Status</span>
                    <Badge variant={stats?.systemHealth === 'healthy' ? 'default' : 'destructive'}>
                      {stats?.systemHealth}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>API Response Time</span>
                      <span className="text-green-600">45ms</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Database Connections</span>
                      <span className="text-green-600">12/50</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Cache Hit Rate</span>
                      <span className="text-green-600">94%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Key Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Conversion Rate</span>
                    <span className="font-semibold">3.2%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Avg Order Value</span>
                    <span className="font-semibold">$67.50</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Customer Satisfaction</span>
                    <span className="font-semibold text-green-600">4.8/5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Delivery Time</span>
                    <span className="font-semibold">28 min</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {filteredActions.map((action, index) => {
                const Icon = action.icon
                return (
                  <motion.div
                    key={action.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
                      <CardContent className="p-6">
                        <div 
                          className="flex flex-col items-center text-center space-y-3"
                          onClick={() => navigate(action.path)}
                        >
                          <div className={`p-3 rounded-full bg-gray-100 group-hover:bg-gray-200 transition-colors`}>
                            <Icon className={`h-6 w-6 ${action.color}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold">{action.label}</h3>
                            <p className="text-sm text-muted-foreground">{action.description}</p>
                            {action.shortcut && (
                              <Badge variant="outline" className="mt-2 text-xs">
                                Ctrl+{action.shortcut}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => {
                  const Icon = getActivityIcon(activity.type)
                  return (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                      <div className="p-2 rounded-full bg-gray-100">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{activity.action}</p>
                          <Badge variant={getSeverityColor(activity.severity)}>
                            {activity.severity}
                          </Badge>
                        </div>
                        {activity.user && (
                          <p className="text-sm text-muted-foreground">User: {activity.user}</p>
                        )}
                        {activity.details && (
                          <p className="text-sm text-muted-foreground">{activity.details}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {activity.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                System Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium">High Error Rate</p>
                      <p className="text-sm text-muted-foreground">Error rate increased to 5.2%</p>
                    </div>
                  </div>
                  <Badge variant="destructive">High</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Scheduled Maintenance</p>
                      <p className="text-sm text-muted-foreground">Database maintenance in 2 hours</p>
                    </div>
                  </div>
                  <Badge variant="default">Medium</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
