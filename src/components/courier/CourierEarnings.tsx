import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Clock,
  Target,
  Star,
  Award,
  BarChart3,
  PieChart,
  Download,
  RefreshCw,
  Filter,
  Eye,
  EyeOff,
  Zap,
  Trophy,
  Gift,
  Coins
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface EarningsData {
  today: {
    baseEarnings: number
    tips: number
    bonuses: number
    total: number
    deliveries: number
    avgPerDelivery: number
  }
  week: {
    baseEarnings: number
    tips: number
    bonuses: number
    total: number
    deliveries: number
    avgPerDelivery: number
    dailyBreakdown: Array<{
      date: string
      earnings: number
      deliveries: number
    }>
  }
  month: {
    baseEarnings: number
    tips: number
    bonuses: number
    total: number
    deliveries: number
    avgPerDelivery: number
    weeklyBreakdown: Array<{
      week: string
      earnings: number
      deliveries: number
    }>
  }
  allTime: {
    totalEarnings: number
    totalDeliveries: number
    avgRating: number
    totalTips: number
    totalBonuses: number
    bestDay: {
      date: string
      earnings: number
    }
    bestWeek: {
      week: string
      earnings: number
    }
  }
}

interface PerformanceMetrics {
  acceptanceRate: number
  completionRate: number
  onTimeRate: number
  customerRating: number
  totalRating: number
  streak: number
  bestStreak: number
  rank: number
  totalCouriers: number
}

interface Goal {
  id: string
  title: string
  target: number
  current: number
  unit: string
  deadline: Date
  reward: string
  category: 'earnings' | 'deliveries' | 'rating' | 'streak'
  progress: number
}

interface Bonus {
  id: string
  title: string
  amount: number
  reason: string
  date: Date
  status: 'pending' | 'approved' | 'paid'
}

export const CourierEarnings: React.FC = () => {
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null)
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [bonuses, setBonuses] = useState<Bonus[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'allTime'>('today')
  const [showDetails, setShowDetails] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Mock data for demonstration
  const mockEarningsData: EarningsData = {
    today: {
      baseEarnings: 89.50,
      tips: 23.00,
      bonuses: 15.00,
      total: 127.50,
      deliveries: 8,
      avgPerDelivery: 15.94
    },
    week: {
      baseEarnings: 624.50,
      tips: 156.25,
      bonuses: 112.00,
      total: 892.75,
      deliveries: 45,
      avgPerDelivery: 19.84,
      dailyBreakdown: [
        { date: 'Mon', earnings: 98.50, deliveries: 6 },
        { date: 'Tue', earnings: 112.25, deliveries: 7 },
        { date: 'Wed', earnings: 89.75, deliveries: 5 },
        { date: 'Thu', earnings: 134.50, deliveries: 8 },
        { date: 'Fri', earnings: 156.25, deliveries: 9 },
        { date: 'Sat', earnings: 178.00, deliveries: 10 },
        { date: 'Sun', earnings: 123.50, deliveries: 6 }
      ]
    },
    month: {
      baseEarnings: 2847.50,
      tips: 712.25,
      bonuses: 440.00,
      total: 3999.75,
      deliveries: 187,
      avgPerDelivery: 21.39,
      weeklyBreakdown: [
        { week: 'Week 1', earnings: 892.75, deliveries: 45 },
        { week: 'Week 2', earnings: 1023.50, deliveries: 48 },
        { week: 'Week 3', earnings: 1156.25, deliveries: 52 },
        { week: 'Week 4', earnings: 927.25, deliveries: 42 }
      ]
    },
    allTime: {
      totalEarnings: 15647.50,
      totalDeliveries: 892,
      avgRating: 4.8,
      totalTips: 3124.75,
      totalBonuses: 1890.00,
      bestDay: { date: '2024-11-15', earnings: 234.50 },
      bestWeek: { week: 'Week 3', earnings: 1156.25 }
    }
  }

  const mockPerformanceMetrics: PerformanceMetrics = {
    acceptanceRate: 94.2,
    completionRate: 98.7,
    onTimeRate: 96.5,
    customerRating: 4.8,
    totalRating: 127,
    streak: 12,
    bestStreak: 18,
    rank: 3,
    totalCouriers: 156
  }

  const mockGoals: Goal[] = [
    {
      id: 'daily_earnings',
      title: 'Daily Earnings Goal',
      target: 150,
      current: 127.50,
      unit: 'dollars',
      deadline: new Date(),
      reward: '$10 bonus',
      category: 'earnings',
      progress: 85
    },
    {
      id: 'weekly_deliveries',
      title: 'Weekly Deliveries',
      target: 50,
      current: 45,
      unit: 'deliveries',
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      reward: '$25 bonus',
      category: 'deliveries',
      progress: 90
    },
    {
      id: 'rating_maintenance',
      title: 'Rating Maintenance',
      target: 4.5,
      current: 4.8,
      unit: 'stars',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      reward: 'Priority orders',
      category: 'rating',
      progress: 100
    }
  ]

  const mockBonuses: Bonus[] = [
    {
      id: '1',
      title: 'Perfect Week Bonus',
      amount: 50.00,
      reason: '100% completion rate for 7 days',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: 'paid'
    },
    {
      id: '2',
      title: 'High Rating Bonus',
      amount: 25.00,
      reason: 'Maintained 4.8+ rating for 2 weeks',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      status: 'paid'
    },
    {
      id: '3',
      title: 'Streak Bonus',
      amount: 15.00,
      reason: '12-day delivery streak',
      date: new Date(),
      status: 'pending'
    }
  ]

  useEffect(() => {
    loadEarningsData()
  }, [])

  const loadEarningsData = async () => {
    try {
      setIsLoading(true)
      // In a real app, this would fetch from your API
      setEarningsData(mockEarningsData)
      setPerformanceMetrics(mockPerformanceMetrics)
      setGoals(mockGoals)
      setBonuses(mockBonuses)
    } catch (error) {
      console.error('Failed to load earnings data:', error)
      toast({ title: 'Failed to load earnings data', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getPeriodData = () => {
    if (!earningsData) return null
    return earningsData[selectedPeriod]
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500'
    if (progress >= 75) return 'bg-blue-500'
    if (progress >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />
    if (rank === 2) return <Award className="h-5 w-5 text-gray-400" />
    if (rank === 3) return <Award className="h-5 w-5 text-orange-500" />
    return <BarChart3 className="h-5 w-5 text-gray-500" />
  }

  const exportEarnings = () => {
    // In a real app, this would generate and download a CSV/PDF
    toast({ title: 'Export feature coming soon' })
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

  const currentData = getPeriodData()

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Earnings</h1>
            <p className="text-sm text-gray-600">Track your performance and income</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportEarnings}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={loadEarningsData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Period Selector */}
        <Tabs value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="allTime">All Time</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedPeriod} className="space-y-4">
            {/* Total Earnings */}
            {currentData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Total Earnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-green-600">
                      {formatCurrency(currentData.total || currentData.totalEarnings)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedPeriod === 'today' ? 'Today' : 
                       selectedPeriod === 'week' ? 'This Week' :
                       selectedPeriod === 'month' ? 'This Month' : 'All Time'}
                    </div>
                  </div>

                  {showDetails && (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Base Earnings</span>
                        <span className="font-semibold">
                          {formatCurrency(currentData.baseEarnings || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Tips</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(currentData.tips || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Bonuses</span>
                        <span className="font-semibold text-blue-600">
                          {formatCurrency(currentData.bonuses || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Deliveries</span>
                        <span className="font-semibold">
                          {currentData.deliveries || currentData.totalDeliveries}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Avg per Delivery</span>
                        <span className="font-semibold">
                          {formatCurrency(currentData.avgPerDelivery || 0)}
                        </span>
                      </div>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDetails(!showDetails)}
                    className="w-full mt-3"
                  >
                    {showDetails ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                    {showDetails ? 'Hide Details' : 'Show Details'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Performance Metrics */}
            {performanceMetrics && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Rank</span>
                      <div className="flex items-center gap-2">
                        {getRankIcon(performanceMetrics.rank)}
                        <span className="font-semibold">
                          #{performanceMetrics.rank} of {performanceMetrics.totalCouriers}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Acceptance Rate</span>
                          <span>{performanceMetrics.acceptanceRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={performanceMetrics.acceptanceRate} className="h-2" />
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Completion Rate</span>
                          <span>{performanceMetrics.completionRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={performanceMetrics.completionRate} className="h-2" />
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>On-Time Rate</span>
                          <span>{performanceMetrics.onTimeRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={performanceMetrics.onTimeRate} className="h-2" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm">Customer Rating</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="font-semibold">{performanceMetrics.customerRating.toFixed(1)}</span>
                        <span className="text-xs text-gray-600">({performanceMetrics.totalRating})</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm">Current Streak</span>
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-orange-500" />
                        <span className="font-semibold">{performanceMetrics.streak} days</span>
                        <span className="text-xs text-gray-600">
                          (Best: {performanceMetrics.bestStreak})
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Goals */}
            {goals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Goals & Rewards
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {goals.map((goal) => (
                      <div key={goal.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{goal.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {goal.reward}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>{goal.current}/{goal.target} {goal.unit}</span>
                          <span>{goal.progress.toFixed(0)}%</span>
                        </div>
                        
                        <Progress 
                          value={goal.progress} 
                          className={`h-2 ${getProgressColor(goal.progress)}`}
                        />
                        
                        <div className="text-xs text-gray-500">
                          Deadline: {formatDate(goal.deadline)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bonuses */}
            {bonuses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    Recent Bonuses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {bonuses.map((bonus) => (
                      <div key={bonus.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{bonus.title}</div>
                          <div className="text-sm text-gray-600">{bonus.reason}</div>
                          <div className="text-xs text-gray-500">
                            {formatDate(bonus.date)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">
                            {formatCurrency(bonus.amount)}
                          </div>
                          <Badge 
                            variant={bonus.status === 'paid' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {bonus.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Breakdown Charts */}
            {selectedPeriod === 'week' && currentData && 'dailyBreakdown' in currentData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Weekly Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentData.dailyBreakdown.map((day) => (
                      <div key={day.date} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{day.date}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-600">{day.deliveries} deliveries</span>
                          <span className="font-semibold">{formatCurrency(day.earnings)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All Time Highlights */}
            {selectedPeriod === 'allTime' && currentData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    All Time Highlights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Best Day</span>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(currentData.bestDay.earnings)}</div>
                        <div className="text-xs text-gray-600">{formatDate(new Date(currentData.bestDay.date))}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Best Week</span>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(currentData.bestWeek.earnings)}</div>
                        <div className="text-xs text-gray-600">{currentData.bestWeek.week}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Tips</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(currentData.totalTips)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Bonuses</span>
                      <span className="font-semibold text-blue-600">
                        {formatCurrency(currentData.totalBonuses)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
