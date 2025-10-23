import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Shield, 
  AlertTriangle, 
  Phone, 
  MapPin, 
  Clock, 
  Users, 
  Camera, 
  Mic,
  MicOff,
  Video,
  VideoOff,
  Send,
  CheckCircle,
  XCircle,
  Bell,
  Navigation,
  Zap,
  Eye,
  EyeOff,
  RefreshCw,
  Settings,
  Heart,
  Activity,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
  Signal,
  SignalLow
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface SafetyAlert {
  id: string
  type: 'emergency' | 'safety' | 'weather' | 'traffic' | 'area'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  location?: string
  timestamp: Date
  isActive: boolean
  actions?: Array<{
    label: string
    action: () => void
    variant?: 'default' | 'destructive' | 'outline'
  }>
}

interface EmergencyContact {
  id: string
  name: string
  phone: string
  type: 'emergency' | 'family' | 'friend' | 'support'
  isPrimary: boolean
}

interface SafetyCheck {
  id: string
  question: string
  isRequired: boolean
  isCompleted: boolean
  completedAt?: Date
}

interface LocationData {
  lat: number
  lng: number
  accuracy: number
  timestamp: Date
  isTracking: boolean
}

interface DeviceStatus {
  battery: number
  signal: number
  wifi: boolean
  location: boolean
  camera: boolean
  microphone: boolean
}

export const CourierSafety: React.FC = () => {
  const [safetyAlerts, setSafetyAlerts] = useState<SafetyAlert[]>([])
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([])
  const [safetyChecks, setSafetyChecks] = useState<SafetyCheck[]>([])
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null)
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null)
  const [isEmergencyMode, setIsEmergencyMode] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isLocationSharing, setIsLocationSharing] = useState(false)
  const [showSafetyChecks, setShowSafetyChecks] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const locationWatchId = useRef<number | null>(null)
  const emergencyTimer = useRef<NodeJS.Timeout | null>(null)

  // Mock data for demonstration
  const mockSafetyAlerts: SafetyAlert[] = [
    {
      id: '1',
      type: 'weather',
      severity: 'medium',
      title: 'Weather Alert',
      message: 'Heavy rain expected in your area. Drive safely.',
      location: 'Broadway & 42nd St',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      isActive: true,
      actions: [
        { label: 'Acknowledge', action: () => acknowledgeAlert('1') },
        { label: 'Report Safe', action: () => reportSafe() }
      ]
    },
    {
      id: '2',
      type: 'traffic',
      severity: 'high',
      title: 'Traffic Alert',
      message: 'Major accident on your route. Consider alternative path.',
      location: '5th Ave & 34th St',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      isActive: true,
      actions: [
        { label: 'View Route', action: () => viewRoute() },
        { label: 'Report Issue', action: () => reportIssue() }
      ]
    },
    {
      id: '3',
      type: 'area',
      severity: 'low',
      title: 'Area Notice',
      message: 'High crime area. Stay alert and avoid stopping.',
      location: 'Harlem, NY',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      isActive: true,
      actions: [
        { label: 'Acknowledge', action: () => acknowledgeAlert('3') }
      ]
    }
  ]

  const mockEmergencyContacts: EmergencyContact[] = [
    {
      id: '1',
      name: 'Emergency Services',
      phone: '911',
      type: 'emergency',
      isPrimary: true
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      phone: '+1 (555) 123-4567',
      type: 'family',
      isPrimary: false
    },
    {
      id: '3',
      name: 'Mike Chen',
      phone: '+1 (555) 987-6543',
      type: 'friend',
      isPrimary: false
    },
    {
      id: '4',
      name: 'Support Hotline',
      phone: '+1 (555) 555-5555',
      type: 'support',
      isPrimary: false
    }
  ]

  const mockSafetyChecks: SafetyCheck[] = [
    {
      id: '1',
      question: 'Are you feeling safe and secure?',
      isRequired: true,
      isCompleted: false
    },
    {
      id: '2',
      question: 'Is your vehicle in good working condition?',
      isRequired: true,
      isCompleted: false
    },
    {
      id: '3',
      question: 'Do you have your ID and delivery documents?',
      isRequired: true,
      isCompleted: false
    },
    {
      id: '4',
      question: 'Are you aware of your current location?',
      isRequired: false,
      isCompleted: false
    },
    {
      id: '5',
      question: 'Do you have emergency contacts readily available?',
      isRequired: false,
      isCompleted: false
    }
  ]

  useEffect(() => {
    loadSafetyData()
    setupLocationTracking()
    setupDeviceMonitoring()
    setupSafetyChecks()
  }, [])

  useEffect(() => {
    if (isEmergencyMode) {
      startEmergencyProtocol()
    } else {
      stopEmergencyProtocol()
    }
  }, [isEmergencyMode])

  const loadSafetyData = async () => {
    try {
      setIsLoading(true)
      // In a real app, this would fetch from your API
      setSafetyAlerts(mockSafetyAlerts)
      setEmergencyContacts(mockEmergencyContacts)
      setSafetyChecks(mockSafetyChecks)
    } catch (error) {
      console.error('Failed to load safety data:', error)
      toast({ title: 'Failed to load safety data', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const setupLocationTracking = () => {
    if (navigator.geolocation) {
      locationWatchId.current = navigator.geolocation.watchPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(),
            isTracking: true
          })
        },
        (error) => {
          console.error('Location tracking error:', error)
          setCurrentLocation(prev => prev ? { ...prev, isTracking: false } : null)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      )
    }
  }

  const setupDeviceMonitoring = () => {
    const updateDeviceStatus = () => {
      // Mock device status - in a real app, this would check actual device status
      setDeviceStatus({
        battery: 85,
        signal: 4,
        wifi: true,
        location: currentLocation?.isTracking || false,
        camera: true,
        microphone: true
      })
    }

    updateDeviceStatus()
    const interval = setInterval(updateDeviceStatus, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }

  const setupSafetyChecks = () => {
    // Show safety checks every 2 hours
    const interval = setInterval(() => {
      const lastCheck = localStorage.getItem('last_safety_check')
      const now = Date.now()
      
      if (!lastCheck || now - parseInt(lastCheck) > 2 * 60 * 60 * 1000) {
        setShowSafetyChecks(true)
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }

  const startEmergencyProtocol = () => {
    // Start location sharing
    setIsLocationSharing(true)
    
    // Start recording (if permissions granted)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(() => {
          setIsRecording(true)
          toast({ title: 'Emergency recording started' })
        })
        .catch(() => {
          toast({ title: 'Recording permissions denied', variant: 'destructive' })
        })
    }

    // Send emergency alert to contacts
    sendEmergencyAlert()

    // Set up emergency timer (auto-call emergency services after 30 seconds)
    emergencyTimer.current = setTimeout(() => {
      callEmergencyServices()
    }, 30000)

    toast({ 
      title: 'Emergency mode activated!', 
      description: 'Help is on the way',
      variant: 'destructive'
    })
  }

  const stopEmergencyProtocol = () => {
    setIsLocationSharing(false)
    setIsRecording(false)
    
    if (emergencyTimer.current) {
      clearTimeout(emergencyTimer.current)
      emergencyTimer.current = null
    }

    toast({ title: 'Emergency mode deactivated' })
  }

  const sendEmergencyAlert = () => {
    const primaryContact = emergencyContacts.find(contact => contact.isPrimary)
    if (primaryContact) {
      // In a real app, this would send SMS/email to emergency contacts
      toast({ 
        title: 'Emergency alert sent!', 
        description: `Alert sent to ${primaryContact.name}` 
      })
    }
  }

  const callEmergencyServices = () => {
    window.open('tel:911')
    toast({ title: 'Calling emergency services...' })
  }

  const callContact = (contact: EmergencyContact) => {
    window.open(`tel:${contact.phone}`)
    toast({ title: `Calling ${contact.name}...` })
  }

  const acknowledgeAlert = (alertId: string) => {
    setSafetyAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, isActive: false }
          : alert
      )
    )
    toast({ title: 'Alert acknowledged' })
  }

  const reportSafe = () => {
    toast({ title: 'Safe status reported' })
    // In a real app, this would send location and status to dispatch
  }

  const viewRoute = () => {
    toast({ title: 'Opening route view' })
  }

  const reportIssue = () => {
    toast({ title: 'Opening issue report' })
  }

  const completeSafetyCheck = (checkId: string) => {
    setSafetyChecks(prev => 
      prev.map(check => 
        check.id === checkId 
          ? { ...check, isCompleted: true, completedAt: new Date() }
          : check
      )
    )
    
    const allRequiredCompleted = safetyChecks
      .filter(check => check.isRequired)
      .every(check => check.id === checkId ? true : check.isCompleted)
    
    if (allRequiredCompleted) {
      localStorage.setItem('last_safety_check', Date.now().toString())
      setShowSafetyChecks(false)
      toast({ title: 'Safety check completed!' })
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'emergency': return AlertTriangle
      case 'safety': return Shield
      case 'weather': return Activity
      case 'traffic': return Navigation
      case 'area': return MapPin
      default: return Bell
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'emergency': return 'text-red-600'
      case 'safety': return 'text-blue-600'
      case 'weather': return 'text-yellow-600'
      case 'traffic': return 'text-orange-600'
      case 'area': return 'text-purple-600'
      default: return 'text-gray-600'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive'
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'secondary'
    }
  }

  const getBatteryColor = (battery: number) => {
    if (battery < 20) return 'text-red-600'
    if (battery < 50) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getSignalColor = (signal: number) => {
    if (signal < 2) return 'text-red-600'
    if (signal < 3) return 'text-yellow-600'
    return 'text-green-600'
  }

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
            <h1 className="text-2xl font-bold">Safety Center</h1>
            <p className="text-sm text-gray-600">Stay safe on the road</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={isEmergencyMode ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => setIsEmergencyMode(!isEmergencyMode)}
            >
              <AlertTriangle className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={loadSafetyData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Emergency Mode Banner */}
        {isEmergencyMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-600 text-white p-4 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6" />
              <div>
                <h3 className="font-bold">EMERGENCY MODE ACTIVE</h3>
                <p className="text-sm">Location sharing and recording enabled</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Device Status */}
        {deviceStatus && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Device Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Battery className={`h-4 w-4 ${getBatteryColor(deviceStatus.battery)}`} />
                  <span className="text-sm">{deviceStatus.battery}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Signal className={`h-4 w-4 ${getSignalColor(deviceStatus.signal)}`} />
                  <span className="text-sm">{deviceStatus.signal}/5</span>
                </div>
                <div className="flex items-center gap-2">
                  {deviceStatus.wifi ? <Wifi className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4 text-red-600" />}
                  <span className="text-sm">WiFi</span>
                </div>
                <div className="flex items-center gap-2">
                  {deviceStatus.location ? <MapPin className="h-4 w-4 text-green-600" /> : <MapPin className="h-4 w-4 text-red-600" />}
                  <span className="text-sm">GPS</span>
                </div>
                <div className="flex items-center gap-2">
                  {deviceStatus.camera ? <Camera className="h-4 w-4 text-green-600" /> : <Camera className="h-4 w-4 text-red-600" />}
                  <span className="text-sm">Camera</span>
                </div>
                <div className="flex items-center gap-2">
                  {deviceStatus.microphone ? <Mic className="h-4 w-4 text-green-600" /> : <MicOff className="h-4 w-4 text-red-600" />}
                  <span className="text-sm">Mic</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Location Status */}
        {currentLocation && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Tracking</span>
                  <Badge variant={currentLocation.isTracking ? 'default' : 'destructive'}>
                    {currentLocation.isTracking ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Accuracy</span>
                  <span className="text-sm">{currentLocation.accuracy.toFixed(0)}m</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Last Update</span>
                  <span className="text-sm">{currentLocation.timestamp.toLocaleTimeString()}</span>
                </div>
                {isLocationSharing && (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                    <Eye className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-800">Location sharing active</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Safety Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Safety Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {safetyAlerts.filter(alert => alert.isActive).length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No active alerts</p>
              </div>
            ) : (
              <div className="space-y-3">
                {safetyAlerts.filter(alert => alert.isActive).map((alert) => {
                  const Icon = getAlertIcon(alert.type)
                  return (
                    <div key={alert.id} className="p-3 border rounded-lg">
                      <div className="flex items-start gap-3">
                        <Icon className={`h-5 w-5 mt-1 ${getAlertColor(alert.type)}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{alert.title}</h3>
                            <Badge variant={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                          {alert.location && (
                            <p className="text-xs text-gray-500 mb-2">📍 {alert.location}</p>
                          )}
                          <div className="flex gap-2">
                            {alert.actions?.map((action, index) => (
                              <Button
                                key={index}
                                variant={action.variant || 'outline'}
                                size="sm"
                                onClick={action.action}
                              >
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Emergency Contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Emergency Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {emergencyContacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{contact.name}</span>
                      {contact.isPrimary && (
                        <Badge variant="destructive" className="text-xs">Primary</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{contact.phone}</p>
                    <p className="text-xs text-gray-500">{contact.type}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => callContact(contact)}
                    variant={contact.isPrimary ? 'destructive' : 'outline'}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Safety Checks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Safety Checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {safetyChecks.map((check) => (
                <div key={check.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {check.isCompleted ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{check.question}</p>
                      {check.isRequired && (
                        <Badge variant="outline" className="text-xs">Required</Badge>
                      )}
                    </div>
                  </div>
                  {!check.isCompleted && (
                    <Button
                      size="sm"
                      onClick={() => completeSafetyCheck(check.id)}
                    >
                      Complete
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Emergency Button */}
        <Button
          variant="destructive"
          size="lg"
          onClick={() => setIsEmergencyMode(!isEmergencyMode)}
          className="w-full"
        >
          <AlertTriangle className="h-5 w-5 mr-2" />
          {isEmergencyMode ? 'Deactivate Emergency Mode' : 'Activate Emergency Mode'}
        </Button>

        {/* Safety Checks Modal */}
        {showSafetyChecks && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Safety Check Required
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Please complete the safety checklist before continuing your shift.
                </p>
                <div className="space-y-3">
                  {safetyChecks.filter(check => check.isRequired).map((check) => (
                    <div key={check.id} className="flex items-center gap-3">
                      {check.isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                      )}
                      <span className="text-sm">{check.question}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowSafetyChecks(false)}
                  >
                    Skip
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      safetyChecks.forEach(check => {
                        if (check.isRequired && !check.isCompleted) {
                          completeSafetyCheck(check.id)
                        }
                      })
                    }}
                  >
                    Complete All
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}
