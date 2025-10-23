import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Package, 
  Navigation, 
  Zap,
  Target,
  TrendingUp,
  Star,
  AlertTriangle,
  CheckCircle,
  Phone,
  MessageSquare,
  Camera,
  Bell,
  Settings,
  RefreshCw,
  Play,
  Pause,
  Stop,
  Plus,
  Minus,
  Eye,
  EyeOff
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface CourierStats {
  todayEarnings: number
  todayDeliveries: number
  weeklyEarnings: number
  weeklyDeliveries: number
  averageRating: number
  totalRating: number
  currentStreak: number
  bestStreak: number
  onlineTime: number
  acceptanceRate: number
  completionRate: number
}

interface ActiveOrder {
  id: string
  customerName: string
  customerPhone: string
  customerAddress: string
  pickupAddress: string
  estimatedEarnings: number
  distance: number
  estimatedTime: number
  status: 'pickup' | 'delivering' | 'arrived' | 'verifying'
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  specialInstructions?: string
  requiresAgeVerification: boolean
}

interface QuickAction {
  id: string
  label: string
  icon: React.ComponentType<any>
  action: () => void
  color: string
  shortcut?: string
  disabled?: boolean
}

interface PerformanceGoal {
  id: string
  title: string
  target: number
  current: number
  unit: string
  deadline?: Date
  reward?: string
}

export const EnhancedCourierDashboard: React.FC = () => {
  const [stats, setStats] = useState<CourierStats | null>(null)
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null)
  const [isOnline, setIsOnline] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showEarnings, setShowEarnings] = useState(false)
  const [performanceGoals, setPerformanceGoals] = useState<PerformanceGoal[]>([])
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null)

  // Mock data for demonstration
  const mockStats: CourierStats = {
    todayEarnings: 127.50,
    todayDeliveries: 8,
    weeklyEarnings: 892.75,
    weeklyDeliveries: 45,
    averageRating: 4.8,
    totalRating: 127,
    currentStreak: 12,
    bestStreak: 18,
    onlineTime: 6.5,
    acceptanceRate: 94.2,
    completionRate: 98.7
  }

  const mockActiveOrder: ActiveOrder = {
    id: 'order_123',
    customerName: 'Sarah Johnson',
    customerPhone: '+1 (555) 123-4567',
    customerAddress: '123 Main St, New York, NY 10001',
    pickupAddress: '456 Broadway, New York, NY 10013',
    estimatedEarnings: 18.50,
    distance: 2.3,
    estimatedTime: 15,
    status: 'delivering',
    items: [
      { name: 'Premium Flower - OG Kush', quantity: 1, price: 45.00 },
      { name: 'Edibles - Gummies', quantity: 1, price: 25.00 }
    ],
    specialInstructions: 'Please call when arriving. Leave at door if no answer.',
    requiresAgeVerification: true
  }

  const mockGoals: PerformanceGoal[] = [
    {
      id: 'daily_deliveries',
      title: 'Daily Deliveries',
      target: 10,
      current: 8,
      unit: 'deliveries',
      deadline: new Date(),
      reward: '$5 bonus'
    },
    {
      id: 'weekly_earnings',
      title: 'Weekly Earnings',
      target: 1000,
      current: 892.75,
      unit: 'dollars',
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      reward: '$50 bonus'
    },
    {
      id: 'rating_maintenance',
      title: 'Rating Maintenance',
      target: 4.5,
      current: 4.8,
      unit: 'stars',
      reward: 'Priority orders'
    }
  ]

  useEffect(() => {
    loadCourierData()
    setupLocationTracking()
    setupRealTimeUpdates()
  }, [])

  const loadCourierData = async () => {
    try {
      setIsLoading(true)
      // In a real app, this would fetch from your API
      setStats(mockStats)
      setActiveOrder(mockActiveOrder)
      setPerformanceGoals(mockGoals)
    } catch (error) {
      console.error('Failed to load courier data:', error)
      toast({ title: 'Failed to load data', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const setupLocationTracking = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('Location access denied:', error)
        }
      )
    }
  }

  const setupRealTimeUpdates = () => {
    // Set up real-time updates for orders and earnings
    const interval = setInterval(() => {
      // Update stats periodically
      if (stats) {
        setStats(prev => prev ? {
          ...prev,
          onlineTime: prev.onlineTime + 0.1
        } : null)
      }
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }

  const quickActions: QuickAction[] = [
    {
      id: 'toggle-online',
      label: isOnline ? 'Go Offline' : 'Go Online',
      icon: isOnline ? Pause : Play,
      action: handleToggleOnline,
      color: isOnline ? 'text-red-600' : 'text-green-600',
      shortcut: 'O'
    },
    {
      id: 'navigate',
      label: 'Navigate',
      icon: Navigation,
      action: handleNavigate,
      color: 'text-blue-600',
      shortcut: 'N',
      disabled: !activeOrder
    },
    {
      id: 'call-customer',
      label: 'Call Customer',
      icon: Phone,
      action: handleCallCustomer,
      color: 'text-green-600',
      shortcut: 'C',
      disabled: !activeOrder
    },
    {
      id: 'message-customer',
      label: 'Message Customer',
      icon: MessageSquare,
      action: handleMessageCustomer,
      color: 'text-purple-600',
      shortcut: 'M',
      disabled: !activeOrder
    },
    {
      id: 'update-status',
      label: 'Update Status',
      icon: CheckCircle,
      action: handleUpdateStatus,
      color: 'text-orange-600',
      shortcut: 'U',
      disabled: !activeOrder
    },
    {
      id: 'emergency',
      label: 'Emergency',
      icon: AlertTriangle,
      action: handleEmergency,
      color: 'text-red-600',
      shortcut: 'E'
    }
  ]

  const handleToggleOnline = () => {
    setIsOnline(!isOnline)
    toast({ 
      title: isOnline ? 'Going offline...' : 'Going online!', 
      description: isOnline ? 'You will stop receiving new orders' : 'You will start receiving new orders' 
    })
  }

  const handleNavigate = () => {
    if (activeOrder) {
      const destination = activeOrder.status === 'pickup' 
        ? activeOrder.pickupAddress 
        : activeOrder.customerAddress
      
      // Open navigation app
      const mapsUrl = `https://maps.google.com/maps?daddr=${encodeURIComponent(destination)}`
      window.open(mapsUrl, '_blank')
      
      toast({ title: 'Opening navigation...' })
    }
  }

  const handleCallCustomer = () => {
    if (activeOrder) {
      window.open(`tel:${activeOrder.customerPhone}`)
      toast({ title: 'Calling customer...' })
    }
  }

  const handleMessageCustomer = () => {
    if (activeOrder) {
      // In a real app, this would open a messaging interface
      toast({ title: 'Messaging feature coming soon' })
    }
  }

  const handleUpdateStatus = () => {
    if (activeOrder) {
      const nextStatus = getNextStatus(activeOrder.status)
      setActiveOrder(prev => prev ? { ...prev, status: nextStatus } : null)
      toast({ title: `Status updated to ${nextStatus}` })
    }
  }

  const handleEmergency = () => {
    // In a real app, this would trigger emergency protocols
    toast({ 
      title: 'Emergency alert sent!', 
      description: 'Help is on the way',
      variant: 'destructive'
    })
  }

  const getNextStatus = (currentStatus: string): 'pickup' | 'delivering' | 'arrived' | 'verifying' => {
    switch (currentStatus) {
      case 'pickup': return 'delivering'
      case 'delivering': return 'arrived'
      case 'arrived': return 'verifying'
      case 'verifying': return 'pickup'
      default: return 'pickup'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pickup': return 'bg-blue-500'
      case 'delivering': return 'bg-yellow-500'
      case 'arrived': return 'bg-orange-500'
      case 'verifying': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pickup': return 'Pickup'
      case 'delivering': return 'Delivering'
      case 'arrived': return 'Arrived'
      case 'verifying': return 'Verifying'
      default: return 'Unknown'
    }
  }

  const formatTime = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.floor((hours - h) * 60)
    return `${h}h ${m}m`
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        const action = quickActions.find(a => a.shortcut === e.key.toUpperCase())
        if (action && !action.disabled) {
          e.preventDefault()
          action.action()
        }
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [quickActions])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Courier Dashboard</h1>
            <p className="text-sm text-gray-600">
              {isOnline ? 'Online' : 'Offline'} • {currentLocation ? 'Location active' : 'Location needed'}
            </p>
          </div>
          <Button
            variant={isOnline ? 'destructive' : 'default'}
            size="sm"
            onClick={handleToggleOnline}
            className="flex items-center gap-2"
          >
            {isOnline ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isOnline ? 'Offline' : 'Online'}
          </Button>
        </div>

        {/* Today's Stats */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Today's Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(stats.todayEarnings)}
                  </div>
                  <div className="text-sm text-gray-600">Earnings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.todayDeliveries}
                  </div>
                  <div className="text-sm text-gray-600">Deliveries</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-600">
                    {stats.averageRating.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-orange-600">
                    {formatTime(stats.onlineTime)}
                  </div>
                  <div className="text-sm text-gray-600">Online Time</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Goals */}
        {performanceGoals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Performance Goals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {performanceGoals.map((goal) => {
                const progress = (goal.current / goal.target) * 100
                return (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{goal.title}</span>
                      <span className="text-sm text-gray-600">
                        {goal.current}/{goal.target} {goal.unit}
                      </span>
                    </div>
                    <Progress value={Math.min(progress, 100)} className="h-2" />
                    {goal.reward && (
                      <div className="text-xs text-green-600 font-medium">
                        Reward: {goal.reward}
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        {/* Active Order */}
        {activeOrder ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Active Order
                </div>
                <Badge className={getStatusColor(activeOrder.status)}>
                  {getStatusLabel(activeOrder.status)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{activeOrder.customerName}</span>
                  <span className="text-green-600 font-semibold">
                    {formatCurrency(activeOrder.estimatedEarnings)}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {activeOrder.status === 'pickup' ? 'Pickup from:' : 'Deliver to:'}
                </div>
                <div className="text-sm font-medium">
                  {activeOrder.status === 'pickup' 
                    ? activeOrder.pickupAddress 
                    : activeOrder.customerAddress}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>📏 {activeOrder.distance} mi</span>
                  <span>⏱️ {activeOrder.estimatedTime} min</span>
                </div>
              </div>

              {activeOrder.specialInstructions && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="text-sm font-medium text-yellow-800">Special Instructions:</div>
                  <div className="text-sm text-yellow-700">{activeOrder.specialInstructions}</div>
                </div>
              )}

              {activeOrder.requiresAgeVerification && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-800">Age verification required</span>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={handleNavigate} 
                  className="flex-1"
                  size="sm"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Navigate
                </Button>
                <Button 
                  onClick={handleCallCustomer} 
                  variant="outline"
                  size="sm"
                >
                  <Phone className="h-4 w-4" />
                </Button>
                <Button 
                  onClick={handleUpdateStatus} 
                  variant="outline"
                  size="sm"
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-600 mb-2">No Active Orders</h3>
              <p className="text-sm text-gray-500 mb-4">
                {isOnline ? 'Waiting for new orders...' : 'Go online to receive orders'}
              </p>
              {!isOnline && (
                <Button onClick={handleToggleOnline}>
                  <Play className="h-4 w-4 mr-2" />
                  Go Online
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Button
                    key={action.id}
                    variant="outline"
                    onClick={action.action}
                    disabled={action.disabled}
                    className="flex flex-col items-center gap-2 h-auto p-4"
                  >
                    <Icon className={`h-5 w-5 ${action.color}`} />
                    <span className="text-xs">{action.label}</span>
                    {action.shortcut && (
                      <Badge variant="secondary" className="text-xs">
                        Ctrl+{action.shortcut}
                      </Badge>
                    )}
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Earnings Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Earnings Summary
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEarnings(!showEarnings)}
              >
                {showEarnings ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showEarnings ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Today</span>
                  <span className="font-semibold">{formatCurrency(stats?.todayEarnings || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">This Week</span>
                  <span className="font-semibold">{formatCurrency(stats?.weeklyEarnings || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Acceptance Rate</span>
                  <span className="font-semibold">{stats?.acceptanceRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Completion Rate</span>
                  <span className="font-semibold">{stats?.completionRate.toFixed(1)}%</span>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats?.todayEarnings || 0)}
                </div>
                <div className="text-sm text-gray-600">Today's Earnings</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Emergency Button */}
        <Button
          variant="destructive"
          size="lg"
          onClick={handleEmergency}
          className="w-full"
        >
          <AlertTriangle className="h-5 w-5 mr-2" />
          Emergency Alert
        </Button>
      </div>
    </div>
  )
}
