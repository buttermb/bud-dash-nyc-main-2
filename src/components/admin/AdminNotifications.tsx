import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  XCircle,
  Settings,
  Plus,
  Send,
  Clock,
  Users,
  Mail,
  MessageSquare,
  Zap,
  Filter,
  Search,
  MoreHorizontal,
  Eye,
  EyeOff,
  Trash2,
  Edit
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: 'system' | 'order' | 'user' | 'courier' | 'security' | 'financial'
  isRead: boolean
  createdAt: Date
  expiresAt?: Date
  actions?: Array<{
    label: string
    action: () => void
    variant?: 'default' | 'destructive'
  }>
  metadata?: Record<string, any>
}

interface NotificationRule {
  id: string
  name: string
  description: string
  conditions: Array<{
    field: string
    operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'not_equals'
    value: any
  }>
  actions: Array<{
    type: 'email' | 'sms' | 'push' | 'webhook'
    config: Record<string, any>
  }>
  isActive: boolean
  createdAt: Date
}

interface NotificationSettings {
  email: boolean
  sms: boolean
  push: boolean
  webhook: boolean
  quietHours: {
    enabled: boolean
    start: string
    end: string
  }
  categories: Record<string, boolean>
}

export const AdminNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notificationRules, setNotificationRules] = useState<NotificationRule[]>([])
  const [settings, setSettings] = useState<NotificationSettings>({
    email: true,
    sms: false,
    push: true,
    webhook: false,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    },
    categories: {
      system: true,
      order: true,
      user: true,
      courier: true,
      security: true,
      financial: true
    }
  })
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showRulesDialog, setShowRulesDialog] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical' | 'system'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Mock notifications for demonstration
  const mockNotifications: Notification[] = [
    {
      id: '1',
      title: 'High Error Rate Detected',
      message: 'API error rate has increased to 5.2% in the last hour',
      type: 'error',
      priority: 'critical',
      category: 'system',
      isRead: false,
      createdAt: new Date(Date.now() - 5 * 60 * 1000),
      actions: [
        { label: 'View Details', action: () => console.log('View details') },
        { label: 'Acknowledge', action: () => markAsRead('1') }
      ]
    },
    {
      id: '2',
      title: 'New Order Requires Review',
      message: 'Order #12345 has been flagged for manual review',
      type: 'warning',
      priority: 'high',
      category: 'order',
      isRead: false,
      createdAt: new Date(Date.now() - 15 * 60 * 1000),
      actions: [
        { label: 'Review Order', action: () => console.log('Review order') },
        { label: 'Approve', action: () => console.log('Approve order') }
      ]
    },
    {
      id: '3',
      title: 'Courier Offline',
      message: 'Courier John Doe has been offline for 30 minutes',
      type: 'warning',
      priority: 'medium',
      category: 'courier',
      isRead: true,
      createdAt: new Date(Date.now() - 30 * 60 * 1000)
    },
    {
      id: '4',
      title: 'Payment Processed',
      message: 'Payment of $89.99 has been successfully processed',
      type: 'success',
      priority: 'low',
      category: 'financial',
      isRead: true,
      createdAt: new Date(Date.now() - 45 * 60 * 1000)
    },
    {
      id: '5',
      title: 'Suspicious Login Attempt',
      message: 'Multiple failed login attempts detected from IP 192.168.1.100',
      type: 'error',
      priority: 'high',
      category: 'security',
      isRead: false,
      createdAt: new Date(Date.now() - 60 * 60 * 1000),
      actions: [
        { label: 'Block IP', action: () => console.log('Block IP') },
        { label: 'Investigate', action: () => console.log('Investigate') }
      ]
    }
  ]

  useEffect(() => {
    loadNotifications()
    loadNotificationRules()
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

  const loadNotificationRules = async () => {
    try {
      // Mock notification rules
      const mockRules: NotificationRule[] = [
        {
          id: '1',
          name: 'High Error Rate Alert',
          description: 'Alert when API error rate exceeds 5%',
          conditions: [
            { field: 'error_rate', operator: 'greater_than', value: 5 }
          ],
          actions: [
            { type: 'email', config: { recipients: ['admin@example.com'] } },
            { type: 'push', config: {} }
          ],
          isActive: true,
          createdAt: new Date()
        },
        {
          id: '2',
          name: 'Order Flagged Alert',
          description: 'Alert when an order is flagged for review',
          conditions: [
            { field: 'order_status', operator: 'equals', value: 'flagged' }
          ],
          actions: [
            { type: 'email', config: { recipients: ['orders@example.com'] } },
            { type: 'sms', config: { phone: '+1234567890' } }
          ],
          isActive: true,
          createdAt: new Date()
        }
      ]
      setNotificationRules(mockRules)
    } catch (error) {
      console.error('Failed to load notification rules:', error)
    }
  }

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, isRead: true }
          : notif
      )
    )
    toast({ title: 'Notification marked as read' })
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

  const sendTestNotification = async () => {
    try {
      const testNotification: Notification = {
        id: `test_${Date.now()}`,
        title: 'Test Notification',
        message: 'This is a test notification to verify the system is working',
        type: 'info',
        priority: 'low',
        category: 'system',
        isRead: false,
        createdAt: new Date()
      }
      
      setNotifications(prev => [testNotification, ...prev])
      toast({ title: 'Test notification sent' })
    } catch (error) {
      console.error('Failed to send test notification:', error)
      toast({ title: 'Failed to send test notification', variant: 'destructive' })
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'error': return XCircle
      case 'warning': return AlertTriangle
      case 'success': return CheckCircle
      case 'info': return Info
      default: return Bell
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-600'
      case 'warning': return 'text-yellow-600'
      case 'success': return 'text-green-600'
      case 'info': return 'text-blue-600'
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
    if (filter === 'unread' && notification.isRead) return false
    if (filter === 'critical' && notification.priority !== 'critical') return false
    if (filter === 'system' && notification.category !== 'system') return false
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        notification.title.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query)
      )
    }
    
    return true
  })

  const unreadCount = notifications.filter(n => !n.isRead).length
  const criticalCount = notifications.filter(n => n.priority === 'critical' && !n.isRead).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications & Alerts</h1>
          <p className="text-muted-foreground">Manage system notifications and alerts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={sendTestNotification}>
            <Zap className="h-4 w-4 mr-2" />
            Send Test
          </Button>
          <Button variant="outline" onClick={() => setShowSettingsDialog(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Alert
          </Button>
        </div>
      </div>

      {/* Notification Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Notifications</p>
                <p className="text-2xl font-bold">{notifications.length}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unread</p>
                <p className="text-2xl font-bold text-orange-600">{unreadCount}</p>
              </div>
              <EyeOff className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Rules</p>
                <p className="text-2xl font-bold text-green-600">{notificationRules.filter(r => r.isActive).length}</p>
              </div>
              <Settings className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-2">
              <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={markAllAsRead}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark All Read
              </Button>
              <Button variant="outline" onClick={() => setShowRulesDialog(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Manage Rules
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No notifications found</p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredNotifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type)
                  
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`p-4 border rounded-lg transition-all hover:shadow-md ${
                        !notification.isRead ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <Icon className={`h-5 w-5 mt-1 ${getNotificationColor(notification.type)}`} />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className={`font-semibold ${!notification.isRead ? 'font-bold' : ''}`}>
                              {notification.title}
                            </h3>
                            <div className="flex items-center gap-2">
                              <Badge variant={getPriorityColor(notification.priority)}>
                                {notification.priority}
                              </Badge>
                              <Badge variant="outline">
                                {notification.category}
                              </Badge>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-muted-foreground">
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
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Alert Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Alert</DialogTitle>
            <DialogDescription>
              Create a custom notification rule for specific conditions
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Alert Name</Label>
              <Input placeholder="Enter alert name" />
            </div>
            
            <div>
              <Label>Description</Label>
              <Textarea placeholder="Describe what this alert monitors" />
            </div>
            
            <div>
              <Label>Conditions</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="error_rate">Error Rate</SelectItem>
                      <SelectItem value="order_status">Order Status</SelectItem>
                      <SelectItem value="user_count">User Count</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="greater_than">Greater Than</SelectItem>
                      <SelectItem value="less_than">Less Than</SelectItem>
                      <SelectItem value="equals">Equals</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Value" />
                </div>
              </div>
            </div>
            
            <div>
              <Label>Notification Methods</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch id="email" />
                  <Label htmlFor="email">Email</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="push" />
                  <Label htmlFor="push">Push Notification</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="sms" />
                  <Label htmlFor="sms">SMS</Label>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast({ title: 'Alert created successfully' })
              setShowCreateDialog(false)
            }}>
              Create Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
