import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  XCircle,
  Settings,
  Volume2,
  VolumeX,
  Vibrate,
  Smartphone,
  Clock,
  MapPin,
  DollarSign,
  Package,
  Navigation,
  Phone,
  MessageSquare,
  Zap,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface CourierNotification {
  id: string
  title: string
  message: string
  type: 'order' | 'earnings' | 'system' | 'safety' | 'bonus' | 'reminder'
  priority: 'low' | 'medium' | 'high' | 'critical'
  isRead: boolean
  createdAt: Date
  expiresAt?: Date
  actions?: Array<{
    label: string
    action: () => void
    variant?: 'default' | 'destructive' | 'outline'
  }>
  metadata?: {
    orderId?: string
    amount?: number
    location?: string
    distance?: number
  }
}

interface NotificationSettings {
  orderNotifications: boolean
  earningsNotifications: boolean
  systemNotifications: boolean
  safetyNotifications: boolean
  bonusNotifications: boolean
  reminderNotifications: boolean
  soundEnabled: boolean
  vibrationEnabled: boolean
  quietHours: {
    enabled: boolean
    start: string
    end: string
  }
  priorityFilter: 'all' | 'high' | 'critical'
}

export const CourierNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<CourierNotification[]>([])
  const [settings, setSettings] = useState<NotificationSettings>({
    orderNotifications: true,
    earningsNotifications: true,
    systemNotifications: true,
    safetyNotifications: true,
    bonusNotifications: true,
    reminderNotifications: true,
    soundEnabled: true,
    vibrationEnabled: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    },
    priorityFilter: 'all'
  })
  const [showSettings, setShowSettings] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread' | 'order' | 'earnings' | 'system' | 'safety'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Mock notifications for demonstration
  const mockNotifications: CourierNotification[] = [
    {
      id: '1',
      title: 'New Order Available',
      message: 'Order #12345 - $18.50 • 2.3 miles • Broadway & Canal',
      type: 'order',
      priority: 'high',
      isRead: false,
      createdAt: new Date(Date.now() - 2 * 60 * 1000),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      actions: [
        { label: 'Accept', action: () => handleAcceptOrder('12345') },
        { label: 'Decline', action: () => handleDeclineOrder('12345'), variant: 'destructive' }
      ],
      metadata: {
        orderId: '12345',
        amount: 18.50,
        location: 'Broadway & Canal',
        distance: 2.3
      }
    },
    {
      id: '2',
      title: 'Delivery Completed',
      message: 'Order #12344 delivered successfully • +$18.50 earned',
      type: 'earnings',
      priority: 'medium',
      isRead: false,
      createdAt: new Date(Date.now() - 15 * 60 * 1000),
      actions: [
        { label: 'View Details', action: () => handleViewOrder('12344') }
      ],
      metadata: {
        orderId: '12344',
        amount: 18.50
      }
    },
    {
      id: '3',
      title: 'Bonus Earned!',
      message: 'Perfect Week Bonus • $50.00 added to your earnings',
      type: 'bonus',
      priority: 'high',
      isRead: true,
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
      actions: [
        { label: 'View Earnings', action: () => handleViewEarnings() }
      ],
      metadata: {
        amount: 50.00
      }
    },
    {
      id: '4',
      title: 'Safety Alert',
      message: 'High traffic area detected • Consider alternative route',
      type: 'safety',
      priority: 'medium',
      isRead: false,
      createdAt: new Date(Date.now() - 45 * 60 * 1000),
      actions: [
        { label: 'View Route', action: () => handleViewRoute() },
        { label: 'Report Issue', action: () => handleReportIssue() }
      ],
      metadata: {
        location: 'Broadway & 42nd St'
      }
    },
    {
      id: '5',
      title: 'System Update',
      message: 'App will be updated tonight at 2 AM • 5 minutes downtime expected',
      type: 'system',
      priority: 'low',
      isRead: true,
      createdAt: new Date(Date.now() - 60 * 60 * 1000)
    },
    {
      id: '6',
      title: 'Reminder: End Shift',
      message: 'You\'ve been online for 8 hours • Consider taking a break',
      type: 'reminder',
      priority: 'low',
      isRead: false,
      createdAt: new Date(Date.now() - 90 * 60 * 1000),
      actions: [
        { label: 'Go Offline', action: () => handleGoOffline() },
        { label: 'Continue', action: () => handleContinueShift() }
      ]
    }
  ]

  useEffect(() => {
    loadNotifications()
    setupNotificationPermissions()
    setupRealTimeNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      setIsLoading(true)
      // In a real app, this would fetch from your API
      setNotifications(mockNotifications)
    } catch (error) {
      console.error('Failed to load notifications:', error)
      toast({ title: 'Failed to load notifications', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const setupNotificationPermissions = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        toast({ title: 'Notifications enabled' })
      }
    }
  }

  const setupRealTimeNotifications = () => {
    // Set up real-time notification listening
    const interval = setInterval(() => {
      // Simulate new notifications
      if (Math.random() < 0.1) { // 10% chance every minute
        addMockNotification()
      }
    }, 60000)

    return () => clearInterval(interval)
  }

  const addMockNotification = () => {
    const newNotification: CourierNotification = {
      id: `mock_${Date.now()}`,
      title: 'New Order Available',
      message: `Order #${Math.floor(Math.random() * 10000)} - $${(Math.random() * 30 + 10).toFixed(2)} • ${(Math.random() * 5 + 1).toFixed(1)} miles`,
      type: 'order',
      priority: 'high',
      isRead: false,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      actions: [
        { label: 'Accept', action: () => console.log('Accept order') },
        { label: 'Decline', action: () => console.log('Decline order'), variant: 'destructive' }
      ]
    }

    setNotifications(prev => [newNotification, ...prev])
    
    // Show browser notification if enabled
    if (settings.soundEnabled && Notification.permission === 'granted') {
      new Notification(newNotification.title, {
        body: newNotification.message,
        icon: '/placeholder.svg'
      })
    }

    // Vibrate if enabled
    if (settings.vibrationEnabled && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200])
    }
  }

  const handleAcceptOrder = (orderId: string) => {
    toast({ title: `Order ${orderId} accepted!` })
    // Remove the notification
    setNotifications(prev => prev.filter(n => n.metadata?.orderId !== orderId))
  }

  const handleDeclineOrder = (orderId: string) => {
    toast({ title: `Order ${orderId} declined` })
    // Remove the notification
    setNotifications(prev => prev.filter(n => n.metadata?.orderId !== orderId))
  }

  const handleViewOrder = (orderId: string) => {
    toast({ title: `Viewing order ${orderId}` })
  }

  const handleViewEarnings = () => {
    toast({ title: 'Opening earnings view' })
  }

  const handleViewRoute = () => {
    toast({ title: 'Opening route view' })
  }

  const handleReportIssue = () => {
    toast({ title: 'Opening issue report' })
  }

  const handleGoOffline = () => {
    toast({ title: 'Going offline' })
  }

  const handleContinueShift = () => {
    toast({ title: 'Continuing shift' })
  }

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, isRead: true }
          : notif
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    )
    toast({ title: 'All notifications marked as read' })
  }

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
    toast({ title: 'Notification deleted' })
  }

  const clearExpiredNotifications = () => {
    const now = new Date()
    setNotifications(prev => 
      prev.filter(notif => !notif.expiresAt || notif.expiresAt > now)
    )
    toast({ title: 'Expired notifications cleared' })
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order': return Package
      case 'earnings': return DollarSign
      case 'system': return Settings
      case 'safety': return AlertTriangle
      case 'bonus': return Zap
      case 'reminder': return Clock
      default: return Bell
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order': return 'text-blue-600'
      case 'earnings': return 'text-green-600'
      case 'system': return 'text-gray-600'
      case 'safety': return 'text-red-600'
      case 'bonus': return 'text-yellow-600'
      case 'reminder': return 'text-purple-600'
      default: return 'text-gray-600'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive'
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'secondary'
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    // Filter by type
    if (filter !== 'all' && notification.type !== filter) return false
    
    // Filter by read status
    if (filter === 'unread' && notification.isRead) return false
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        notification.title.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query)
      )
    }
    
    // Filter by priority
    if (settings.priorityFilter !== 'all') {
      if (settings.priorityFilter === 'high' && notification.priority !== 'high') return false
      if (settings.priorityFilter === 'critical' && notification.priority !== 'critical') return false
    }
    
    return true
  })

  const unreadCount = notifications.filter(n => !n.isRead).length
  const criticalCount = notifications.filter(n => n.priority === 'critical' && !n.isRead).length

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-sm text-gray-600">
              {unreadCount} unread • {criticalCount} critical
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={loadNotifications}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="order-notifications">Order Notifications</Label>
                    <Switch
                      id="order-notifications"
                      checked={settings.orderNotifications}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, orderNotifications: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="earnings-notifications">Earnings Notifications</Label>
                    <Switch
                      id="earnings-notifications"
                      checked={settings.earningsNotifications}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, earningsNotifications: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="safety-notifications">Safety Notifications</Label>
                    <Switch
                      id="safety-notifications"
                      checked={settings.safetyNotifications}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, safetyNotifications: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sound-enabled">Sound</Label>
                    <Switch
                      id="sound-enabled"
                      checked={settings.soundEnabled}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, soundEnabled: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="vibration-enabled">Vibration</Label>
                    <Switch
                      id="vibration-enabled"
                      checked={settings.vibrationEnabled}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, vibrationEnabled: checked }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex gap-2">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="all">All</option>
                  <option value="unread">Unread</option>
                  <option value="order">Orders</option>
                  <option value="earnings">Earnings</option>
                  <option value="system">System</option>
                  <option value="safety">Safety</option>
                </select>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border rounded-lg text-sm w-48"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark All Read
                </Button>
                <Button variant="outline" size="sm" onClick={clearExpiredNotifications}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Expired
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No notifications found</p>
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence>
              {filteredNotifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type)
                
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card className={`${!notification.isRead ? 'bg-blue-50 border-blue-200' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <Icon className={`h-5 w-5 mt-1 ${getNotificationColor(notification.type)}`} />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className={`font-semibold ${!notification.isRead ? 'font-bold' : ''}`}>
                                {notification.title}
                              </h3>
                              <div className="flex items-center gap-2">
                                <Badge variant={getPriorityColor(notification.priority)}>
                                  {notification.priority}
                                </Badge>
                                {!notification.isRead && (
                                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                )}
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-2">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                {notification.createdAt.toLocaleString()}
                              </span>
                              
                              <div className="flex items-center gap-2">
                                {notification.actions?.map((action, index) => (
                                  <Button
                                    key={index}
                                    variant={action.variant || 'outline'}
                                    size="sm"
                                    onClick={action.action}
                                  >
                                    {action.label}
                                  </Button>
                                ))}
                                
                                {!notification.isRead && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markAsRead(notification.id)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                )}
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteNotification(notification.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  )
}
