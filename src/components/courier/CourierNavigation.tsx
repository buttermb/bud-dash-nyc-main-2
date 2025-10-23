import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Route,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle,
  Phone,
  MessageSquare,
  Camera,
  RefreshCw,
  Play,
  Pause,
  Stop,
  ArrowLeft,
  ArrowRight,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface NavigationStep {
  id: string
  instruction: string
  distance: number
  duration: number
  maneuver: string
  completed: boolean
}

interface RouteInfo {
  totalDistance: number
  totalDuration: number
  currentStep: number
  totalSteps: number
  eta: Date
  trafficDelay: number
}

interface DeliveryLocation {
  id: string
  name: string
  address: string
  phone: string
  type: 'pickup' | 'delivery'
  coordinates: {
    lat: number
    lng: number
  }
  instructions?: string
  requiresAgeVerification: boolean
  estimatedArrival: Date
}

interface CourierNavigationProps {
  orderId: string
  pickupLocation: DeliveryLocation
  deliveryLocation: DeliveryLocation
  onArrival: (locationId: string) => void
  onComplete: () => void
}

export const CourierNavigation: React.FC<CourierNavigationProps> = ({
  orderId,
  pickupLocation,
  deliveryLocation,
  onArrival,
  onComplete
}) => {
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null)
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null)
  const [navigationSteps, setNavigationSteps] = useState<NavigationStep[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isNavigating, setIsNavigating] = useState(false)
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentDestination, setCurrentDestination] = useState<'pickup' | 'delivery'>('pickup')
  const [arrivalConfirmed, setArrivalConfirmed] = useState(false)
  
  const mapRef = useRef<HTMLDivElement>(null)
  const voiceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Mock navigation steps
  const mockSteps: NavigationStep[] = [
    {
      id: '1',
      instruction: 'Head north on Broadway',
      distance: 0.2,
      duration: 1,
      maneuver: 'straight',
      completed: false
    },
    {
      id: '2',
      instruction: 'Turn right onto Canal Street',
      distance: 0.8,
      duration: 3,
      maneuver: 'turn-right',
      completed: false
    },
    {
      id: '3',
      instruction: 'Turn left onto Lafayette Street',
      distance: 1.2,
      duration: 4,
      maneuver: 'turn-left',
      completed: false
    },
    {
      id: '4',
      instruction: 'Arrive at destination',
      distance: 0.1,
      duration: 1,
      maneuver: 'arrive',
      completed: false
    }
  ]

  const mockRouteInfo: RouteInfo = {
    totalDistance: 2.3,
    totalDuration: 9,
    currentStep: 1,
    totalSteps: 4,
    eta: new Date(Date.now() + 9 * 60 * 1000),
    trafficDelay: 2
  }

  useEffect(() => {
    loadNavigationData()
    setupLocationTracking()
    setupVoiceNavigation()
  }, [])

  useEffect(() => {
    if (isNavigating && isVoiceEnabled) {
      announceCurrentStep()
    }
  }, [currentStepIndex, isNavigating, isVoiceEnabled])

  const loadNavigationData = async () => {
    try {
      // In a real app, this would fetch route data from a mapping service
      setNavigationSteps(mockSteps)
      setRouteInfo(mockRouteInfo)
      
      // Simulate loading
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({ title: 'Route loaded successfully' })
    } catch (error) {
      console.error('Failed to load navigation data:', error)
      toast({ title: 'Failed to load route', variant: 'destructive' })
    }
  }

  const setupLocationTracking = () => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
          
          // Check if arrived at destination
          checkArrival(position.coords.latitude, position.coords.longitude)
        },
        (error) => {
          console.error('Location tracking error:', error)
          toast({ title: 'Location tracking failed', variant: 'destructive' })
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      )

      return () => navigator.geolocation.clearWatch(watchId)
    }
  }

  const setupVoiceNavigation = () => {
    if ('speechSynthesis' in window) {
      setIsVoiceEnabled(true)
    }
  }

  const checkArrival = (lat: number, lng: number) => {
    const destination = currentDestination === 'pickup' ? pickupLocation : deliveryLocation
    const distance = calculateDistance(lat, lng, destination.coordinates.lat, destination.coordinates.lng)
    
    if (distance < 0.1 && !arrivalConfirmed) { // Within 100 meters
      handleArrival()
    }
  }

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const handleArrival = () => {
    setArrivalConfirmed(true)
    toast({ 
      title: 'Arrived at destination!', 
      description: 'Please confirm your arrival' 
    })
    
    if (isVoiceEnabled) {
      speak('You have arrived at your destination')
    }
  }

  const confirmArrival = () => {
    const destination = currentDestination === 'pickup' ? pickupLocation : deliveryLocation
    onArrival(destination.id)
    
    if (currentDestination === 'pickup') {
      setCurrentDestination('delivery')
      setArrivalConfirmed(false)
      toast({ title: 'Proceeding to delivery location' })
    } else {
      onComplete()
    }
  }

  const startNavigation = () => {
    setIsNavigating(true)
    toast({ title: 'Navigation started' })
    
    if (isVoiceEnabled) {
      speak('Starting navigation')
    }
  }

  const stopNavigation = () => {
    setIsNavigating(false)
    toast({ title: 'Navigation stopped' })
  }

  const nextStep = () => {
    if (currentStepIndex < navigationSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
      updateRouteProgress()
    }
  }

  const previousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1)
    }
  }

  const updateRouteProgress = () => {
    setNavigationSteps(prev => 
      prev.map((step, index) => ({
        ...step,
        completed: index < currentStepIndex
      }))
    )
  }

  const announceCurrentStep = () => {
    if (voiceRef.current) {
      speechSynthesis.cancel()
    }
    
    const currentStep = navigationSteps[currentStepIndex]
    if (currentStep) {
      voiceRef.current = new SpeechSynthesisUtterance(currentStep.instruction)
      voiceRef.current.rate = 0.9
      voiceRef.current.pitch = 1
      speechSynthesis.speak(voiceRef.current)
    }
  }

  const speak = (text: string) => {
    if (voiceRef.current) {
      speechSynthesis.cancel()
    }
    
    voiceRef.current = new SpeechSynthesisUtterance(text)
    voiceRef.current.rate = 0.9
    voiceRef.current.pitch = 1
    speechSynthesis.speak(voiceRef.current)
  }

  const openExternalMaps = () => {
    const destination = currentDestination === 'pickup' ? pickupLocation : deliveryLocation
    const mapsUrl = `https://maps.google.com/maps?daddr=${destination.coordinates.lat},${destination.coordinates.lng}`
    window.open(mapsUrl, '_blank')
  }

  const callLocation = () => {
    const destination = currentDestination === 'pickup' ? pickupLocation : deliveryLocation
    window.open(`tel:${destination.phone}`)
  }

  const getManeuverIcon = (maneuver: string) => {
    switch (maneuver) {
      case 'turn-left': return '↰'
      case 'turn-right': return '↱'
      case 'straight': return '↑'
      case 'arrive': return '📍'
      default: return '→'
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const currentDestinationData = currentDestination === 'pickup' ? pickupLocation : deliveryLocation
  const currentStep = navigationSteps[currentStepIndex]

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      <div className={`${isFullscreen ? 'h-full' : 'min-h-screen bg-gray-50 p-4'}`}>
        <div className={`${isFullscreen ? 'h-full flex flex-col' : 'max-w-md mx-auto space-y-4'}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-white border-b">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <div>
                <h1 className="text-lg font-semibold">Navigation</h1>
                <p className="text-sm text-gray-600">
                  {currentDestination === 'pickup' ? 'Pickup' : 'Delivery'} • Order #{orderId.slice(-6)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
              >
                {isVoiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              
              {isNavigating ? (
                <Button variant="destructive" size="sm" onClick={stopNavigation}>
                  <Stop className="h-4 w-4" />
                </Button>
              ) : (
                <Button size="sm" onClick={startNavigation}>
                  <Play className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Map Area */}
          <div 
            ref={mapRef}
            className={`${isFullscreen ? 'flex-1' : 'h-64'} bg-gray-200 rounded-lg relative overflow-hidden`}
          >
            {/* Mock map - in a real app, this would be a proper map component */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Map View</p>
                <p className="text-xs text-gray-500">
                  {currentDestinationData.address}
                </p>
              </div>
            </div>
            
            {/* Current location indicator */}
            {currentLocation && (
              <div className="absolute top-4 left-4 bg-white rounded-full p-2 shadow-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            )}
            
            {/* Destination indicator */}
            <div className="absolute bottom-4 right-4 bg-white rounded-full p-2 shadow-lg">
              <Target className="h-4 w-4 text-red-500" />
            </div>
          </div>

          {/* Route Info */}
          {routeInfo && (
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold">{routeInfo.totalDistance.toFixed(1)} mi</div>
                    <div className="text-xs text-gray-600">Distance</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold">{formatDuration(routeInfo.totalDuration)}</div>
                    <div className="text-xs text-gray-600">Duration</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold">
                      {routeInfo.eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-xs text-gray-600">ETA</div>
                  </div>
                </div>
                
                {routeInfo.trafficDelay > 0 && (
                  <div className="mt-3 p-2 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-yellow-800">
                      <AlertTriangle className="h-4 w-4" />
                      Traffic delay: +{routeInfo.trafficDelay} minutes
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Current Step */}
          {currentStep && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5" />
                  Next Turn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{getManeuverIcon(currentStep.maneuver)}</div>
                    <div className="flex-1">
                      <p className="font-medium">{currentStep.instruction}</p>
                      <p className="text-sm text-gray-600">
                        {currentStep.distance.toFixed(1)} mi • {formatDuration(currentStep.duration)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={previousStep} disabled={currentStepIndex === 0}>
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={nextStep} disabled={currentStepIndex === navigationSteps.length - 1}>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      Step {currentStepIndex + 1} of {navigationSteps.length}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Destination Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {currentDestination === 'pickup' ? 'Pickup Location' : 'Delivery Location'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold">{currentDestinationData.name}</h3>
                  <p className="text-sm text-gray-600">{currentDestinationData.address}</p>
                  <p className="text-sm text-gray-600">{currentDestinationData.phone}</p>
                </div>
                
                {currentDestinationData.instructions && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Instructions:</strong> {currentDestinationData.instructions}
                    </p>
                  </div>
                )}
                
                {currentDestinationData.requiresAgeVerification && (
                  <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800">Age verification required</span>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button onClick={openExternalMaps} className="flex-1">
                    <Navigation className="h-4 w-4 mr-2" />
                    Open Maps
                  </Button>
                  <Button onClick={callLocation} variant="outline">
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Arrival Confirmation */}
          {arrivalConfirmed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed bottom-4 left-4 right-4 z-50"
            >
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-green-800">You've arrived!</h3>
                      <p className="text-sm text-green-700">
                        Please confirm your arrival at {currentDestinationData.name}
                      </p>
                    </div>
                    <Button onClick={confirmArrival} size="sm">
                      Confirm
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Navigation Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5" />
                Route Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {navigationSteps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 p-2 rounded-lg ${
                      index === currentStepIndex ? 'bg-blue-50 border border-blue-200' : ''
                    } ${step.completed ? 'opacity-60' : ''}`}
                  >
                    <div className="text-lg">{getManeuverIcon(step.maneuver)}</div>
                    <div className="flex-1">
                      <p className={`text-sm ${step.completed ? 'line-through text-gray-500' : ''}`}>
                        {step.instruction}
                      </p>
                      <p className="text-xs text-gray-600">
                        {step.distance.toFixed(1)} mi • {formatDuration(step.duration)}
                      </p>
                    </div>
                    {step.completed && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
