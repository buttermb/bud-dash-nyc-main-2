import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { 
  Download, 
  FileText, 
  BarChart3, 
  TrendingUp,
  Calendar as CalendarIcon,
  Filter,
  RefreshCw,
  Mail,
  Share2,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  ShoppingCart,
  Package,
  Truck,
  DollarSign
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface ReportConfig {
  id: string
  name: string
  description: string
  icon: React.ComponentType<any>
  category: 'orders' | 'products' | 'users' | 'couriers' | 'financial' | 'system'
  fields: string[]
  defaultDateRange: number // days
  isScheduled?: boolean
}

interface ExportFormat {
  id: string
  name: string
  extension: string
  mimeType: string
}

interface ScheduledReport {
  id: string
  name: string
  config: ReportConfig
  schedule: 'daily' | 'weekly' | 'monthly'
  recipients: string[]
  lastRun?: Date
  nextRun?: Date
  isActive: boolean
}

export const AdminReports: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<ReportConfig | null>(null)
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv')
  const [isGenerating, setIsGenerating] = useState(false)
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([])
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)

  const exportFormats: ExportFormat[] = [
    { id: 'csv', name: 'CSV', extension: 'csv', mimeType: 'text/csv' },
    { id: 'excel', name: 'Excel', extension: 'xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    { id: 'pdf', name: 'PDF', extension: 'pdf', mimeType: 'application/pdf' },
    { id: 'json', name: 'JSON', extension: 'json', mimeType: 'application/json' }
  ]

  const reportConfigs: ReportConfig[] = [
    {
      id: 'orders-summary',
      name: 'Orders Summary',
      description: 'Complete order data with customer and courier information',
      icon: ShoppingCart,
      category: 'orders',
      fields: ['id', 'user_id', 'status', 'total', 'created_at', 'delivered_at', 'courier_id', 'payment_status'],
      defaultDateRange: 30,
      isScheduled: true
    },
    {
      id: 'orders-detailed',
      name: 'Orders Detailed',
      description: 'Detailed order breakdown with items and pricing',
      icon: FileText,
      category: 'orders',
      fields: ['id', 'user_id', 'items', 'subtotal', 'tax', 'delivery_fee', 'total', 'discount', 'created_at', 'status'],
      defaultDateRange: 7
    },
    {
      id: 'products-performance',
      name: 'Product Performance',
      description: 'Product sales and performance metrics',
      icon: Package,
      category: 'products',
      fields: ['id', 'name', 'category', 'price', 'sales_count', 'revenue', 'stock_quantity', 'rating', 'created_at'],
      defaultDateRange: 30,
      isScheduled: true
    },
    {
      id: 'users-activity',
      name: 'User Activity',
      description: 'User registration and activity data',
      icon: Users,
      category: 'users',
      fields: ['id', 'email', 'created_at', 'last_login', 'orders_count', 'total_spent', 'is_verified', 'is_active'],
      defaultDateRange: 30
    },
    {
      id: 'couriers-performance',
      name: 'Courier Performance',
      description: 'Courier delivery metrics and ratings',
      icon: Truck,
      category: 'couriers',
      fields: ['id', 'name', 'status', 'deliveries_count', 'rating', 'total_earnings', 'avg_delivery_time', 'created_at'],
      defaultDateRange: 30,
      isScheduled: true
    },
    {
      id: 'financial-summary',
      name: 'Financial Summary',
      description: 'Revenue, costs, and profit analysis',
      icon: DollarSign,
      category: 'financial',
      fields: ['date', 'revenue', 'costs', 'profit', 'orders_count', 'avg_order_value', 'refunds', 'courier_payments'],
      defaultDateRange: 30,
      isScheduled: true
    },
    {
      id: 'system-metrics',
      name: 'System Metrics',
      description: 'System performance and usage statistics',
      icon: BarChart3,
      category: 'system',
      fields: ['date', 'active_users', 'page_views', 'api_calls', 'error_rate', 'response_time', 'uptime'],
      defaultDateRange: 7
    }
  ]

  useEffect(() => {
    loadScheduledReports()
    
    // Set default date range
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - 30)
    setDateRange({ from, to })
  }, [])

  useEffect(() => {
    if (selectedReport) {
      setSelectedFields(selectedReport.fields)
    }
  }, [selectedReport])

  const loadScheduledReports = async () => {
    try {
      // This would load from your database
      const mockScheduledReports: ScheduledReport[] = [
        {
          id: '1',
          name: 'Daily Orders Report',
          config: reportConfigs[0],
          schedule: 'daily',
          recipients: ['admin@newyorkminutenyc.com'],
          lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000),
          nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000),
          isActive: true
        },
        {
          id: '2',
          name: 'Weekly Financial Report',
          config: reportConfigs[5],
          schedule: 'weekly',
          recipients: ['finance@newyorkminutenyc.com', 'admin@newyorkminutenyc.com'],
          lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          isActive: true
        }
      ]
      setScheduledReports(mockScheduledReports)
    } catch (error) {
      console.error('Failed to load scheduled reports:', error)
    }
  }

  const generateReport = async () => {
    if (!selectedReport || !dateRange.from || !dateRange.to) {
      toast({ title: 'Please select a report and date range', variant: 'destructive' })
      return
    }

    try {
      setIsGenerating(true)
      
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock data based on report type
      const mockData = generateMockData(selectedReport, dateRange.from, dateRange.to)
      
      // Export data
      exportData(mockData, selectedReport.name, exportFormat)
      
      toast({ 
        title: 'Report generated successfully', 
        description: `${mockData.length} records exported` 
      })
      
    } catch (error) {
      console.error('Report generation failed:', error)
      toast({ title: 'Report generation failed', variant: 'destructive' })
    } finally {
      setIsGenerating(false)
    }
  }

  const generateMockData = (config: ReportConfig, from: Date, to: Date) => {
    const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
    const recordCount = Math.min(daysDiff * 10, 1000) // Max 1000 records
    
    return Array.from({ length: recordCount }, (_, i) => {
      const baseRecord: Record<string, any> = {
        id: `record_${i + 1}`,
        created_at: new Date(from.getTime() + Math.random() * (to.getTime() - from.getTime())).toISOString()
      }

      // Add fields based on report type
      config.fields.forEach(field => {
        switch (field) {
          case 'user_id':
            baseRecord.user_id = `user_${Math.floor(Math.random() * 1000)}`
            break
          case 'status':
            baseRecord.status = ['pending', 'confirmed', 'delivered', 'cancelled'][Math.floor(Math.random() * 4)]
            break
          case 'total':
            baseRecord.total = (Math.random() * 200 + 20).toFixed(2)
            break
          case 'name':
            baseRecord.name = `Item ${i + 1}`
            break
          case 'category':
            baseRecord.category = ['flower', 'edibles', 'concentrates'][Math.floor(Math.random() * 3)]
            break
          case 'price':
            baseRecord.price = (Math.random() * 100 + 10).toFixed(2)
            break
          case 'email':
            baseRecord.email = `user${i + 1}@example.com`
            break
          case 'rating':
            baseRecord.rating = (Math.random() * 2 + 3).toFixed(1)
            break
          case 'revenue':
            baseRecord.revenue = (Math.random() * 10000 + 1000).toFixed(2)
            break
          case 'orders_count':
            baseRecord.orders_count = Math.floor(Math.random() * 50)
            break
          case 'deliveries_count':
            baseRecord.deliveries_count = Math.floor(Math.random() * 100)
            break
          case 'avg_delivery_time':
            baseRecord.avg_delivery_time = Math.floor(Math.random() * 60 + 15)
            break
          case 'active_users':
            baseRecord.active_users = Math.floor(Math.random() * 1000 + 100)
            break
          case 'error_rate':
            baseRecord.error_rate = (Math.random() * 5).toFixed(2)
            break
          case 'response_time':
            baseRecord.response_time = Math.floor(Math.random() * 100 + 50)
            break
          case 'uptime':
            baseRecord.uptime = (99 + Math.random()).toFixed(2)
            break
          default:
            baseRecord[field] = `value_${i + 1}`
        }
      })

      return baseRecord
    })
  }

  const exportData = (data: any[], filename: string, format: ExportFormat) => {
    let content: string
    let mimeType: string

    switch (format.id) {
      case 'csv':
        content = convertToCSV(data)
        mimeType = 'text/csv'
        break
      case 'json':
        content = JSON.stringify(data, null, 2)
        mimeType = 'application/json'
        break
      case 'excel':
        // For Excel, we'd use a library like xlsx
        content = convertToCSV(data) // Fallback to CSV for now
        mimeType = 'text/csv'
        break
      case 'pdf':
        // For PDF, we'd use a library like jsPDF
        content = convertToCSV(data) // Fallback to CSV for now
        mimeType = 'text/csv'
        break
      default:
        content = convertToCSV(data)
        mimeType = 'text/csv'
    }

    const blob = new Blob([content], { type: mimeType })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}-${formatDate(new Date())}.${format.extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const convertToCSV = (data: any[]): string => {
    if (data.length === 0) return ''
    
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n')
    
    return csvContent
  }

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'orders': return ShoppingCart
      case 'products': return Package
      case 'users': return Users
      case 'couriers': return Truck
      case 'financial': return DollarSign
      case 'system': return BarChart3
      default: return FileText
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'orders': return 'text-blue-600'
      case 'products': return 'text-purple-600'
      case 'users': return 'text-green-600'
      case 'couriers': return 'text-orange-600'
      case 'financial': return 'text-green-600'
      case 'system': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Generate and schedule comprehensive reports</p>
        </div>
        <Button onClick={() => setShowScheduleDialog(true)}>
          <CalendarIcon className="h-4 w-4 mr-2" />
          Schedule Report
        </Button>
      </div>

      {/* Report Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Report Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportConfigs.map((config) => {
              const Icon = config.icon
              const isSelected = selectedReport?.id === config.id
              
              return (
                <Card 
                  key={config.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedReport(config)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Icon className={`h-6 w-6 ${getCategoryColor(config.category)}`} />
                      <div className="flex-1">
                        <h3 className="font-semibold">{config.name}</h3>
                        <p className="text-sm text-muted-foreground">{config.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {config.category}
                          </Badge>
                          {config.isScheduled && (
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              Schedulable
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Report Configuration */}
      {selectedReport && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <selectedReport.icon className="h-5 w-5" />
              {selectedReport.name} Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Range */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? format(dateRange.from, 'PPP') : 'From date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.to ? format(dateRange.to, 'PPP') : 'To date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Fields Selection */}
            <div className="space-y-2">
              <Label>Select Fields to Include</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {selectedReport.fields.map((field) => (
                  <div key={field} className="flex items-center space-x-2">
                    <Switch
                      checked={selectedFields.includes(field)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedFields(prev => [...prev, field])
                        } else {
                          setSelectedFields(prev => prev.filter(f => f !== field))
                        }
                      }}
                    />
                    <Label className="text-sm">{field.replace('_', ' ')}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Export Format */}
            <div className="space-y-2">
              <Label>Export Format</Label>
              <Select value={exportFormat} onValueChange={(value) => {
                const format = exportFormats.find(f => f.id === value)
                if (format) setExportFormat(format)
              }}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {exportFormats.map((format) => (
                    <SelectItem key={format.id} value={format.id}>
                      {format.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Generate Button */}
            <div className="flex gap-2">
              <Button 
                onClick={generateReport} 
                disabled={isGenerating || selectedFields.length === 0}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
              {selectedReport.isScheduled && (
                <Button variant="outline" onClick={() => setShowScheduleDialog(true)}>
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scheduled Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Scheduled Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scheduledReports.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No scheduled reports yet</p>
              <Button variant="outline" className="mt-4" onClick={() => setShowScheduleDialog(true)}>
                Create First Schedule
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {scheduledReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <report.config.icon className="h-8 w-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold">{report.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {report.schedule} • {report.recipients.length} recipients
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>Last run: {report.lastRun ? format(report.lastRun, 'MMM d, yyyy') : 'Never'}</span>
                        <span>Next run: {report.nextRun ? format(report.nextRun, 'MMM d, yyyy') : 'Not scheduled'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={report.isActive ? 'default' : 'secondary'}>
                      {report.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
