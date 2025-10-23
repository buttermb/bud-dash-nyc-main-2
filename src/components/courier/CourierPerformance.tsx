import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Target, 
  Trophy, 
  Award, 
  Star, 
  TrendingUp, 
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
  BarChart3,
  PieChart,
  Calendar,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Gift,
  Coins,
  Crown,
  Medal,
  Flag
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface PerformanceGoal {
  id: string
  title: string
  description: string
  category: 'earnings' | 'deliveries' | 'rating' | 'streak' | 'efficiency' | 'safety'
  target: number
  current: number
  unit: string
  deadline: Date
  reward: string
  rewardType: 'bonus' | 'badge' | 'priority' | 'recognition'
  progress: number
  isActive: boolean
  isCompleted: boolean
  createdAt: Date
  completedAt?: Date
}

interface PerformanceMetric {
  id: string
  name: string
  value: number
  target: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  changePercent: number
  period: 'daily' | 'weekly' | 'monthly'
  category: 'earnings' | 'deliveries' | 'rating' | 'efficiency' | 'safety'
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  category: 'milestone' | 'streak' | 'rating' | 'earnings' | 'safety'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  unlockedAt: Date
  progress?: number
  maxProgress?: number
}

interface LeaderboardEntry {
  rank: number
  courierId: string
  courierName: string
  score: number
  metric: string
  avatar?: string
  isCurrentUser: boolean
}

export const CourierPerformance: React.FC = () => {
  const [goals, setGoals] = useState<PerformanceGoal[]>([])
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [selectedTab, setSelectedTab] = useState<'goals' | 'metrics' | 'achievements' | 'leaderboard'>('goals')
  const [showCreateGoal, setShowCreateGoal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Mock data for demonstration
  const mockGoals: PerformanceGoal[] = [
    {
      id: '1',
      title: 'Daily Earnings Goal',
      description: 'Earn $150 in a single day',
      category: 'earnings',
      target: 150,
      current: 127.50,
      unit: 'dollars',
      deadline: new Date(),
      reward: '$25 bonus',
      rewardType: 'bonus',
      progress: 85,
      isActive: true,
      isCompleted: false,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    },
    {
      id: '2',
      title: 'Perfect Week',
      description: 'Complete 50 deliveries in a week',
      category: 'deliveries',
      target: 50,
      current: 45,
      unit: 'deliveries',
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      reward: 'Perfect Week Badge',
      rewardType: 'badge',
      progress: 90,
      isActive: true,
      isCompleted: false,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    },
    {
      id: '3',
      title: 'Rating Master',
      description: 'Maintain 4.8+ rating for 30 days',
      category: 'rating',
      target: 4.8,
      current: 4.8,
      unit: 'stars',
      deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      reward: 'Priority Orders',
      rewardType: 'priority',
      progress: 100,
      isActive: true,
      isCompleted: false,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
    },
    {
      id: '4',
      title: 'Speed Demon',
      description: 'Complete 100 deliveries with avg time under 20 minutes',
      category: 'efficiency',
      target: 100,
      current: 87,
      unit: 'deliveries',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      reward: 'Speed Demon Badge',
      rewardType: 'badge',
      progress: 87,
      isActive: true,
      isCompleted: false,
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
    }
  ]

  const mockMetrics: PerformanceMetric[] = [
    {
      id: '1',
      name: 'Daily Earnings',
      value: 127.50,
      target: 150,
      unit: 'dollars',
      trend: 'up',
      changePercent: 12.5,
      period: 'daily',
      category: 'earnings'
    },
    {
      id: '2',
      name: 'Completion Rate',
      value: 98.7,
      target: 95,
      unit: 'percent',
      trend: 'up',
      changePercent: 3.2,
      period: 'weekly',
      category: 'deliveries'
    },
    {
      id: '3',
      name: 'Customer Rating',
      value: 4.8,
      target: 4.5,
      unit: 'stars',
      trend: 'stable',
      changePercent: 0,
      period: 'monthly',
      category: 'rating'
    },
    {
      id: '4',
      name: 'Average Delivery Time',
      value: 18.5,
      target: 20,
      unit: 'minutes',
      trend: 'down',
      changePercent: -7.5,
      period: 'weekly',
      category: 'efficiency'
    },
    {
      id: '5',
      name: 'Safety Score',
      value: 96.2,
      target: 90,
      unit: 'percent',
      trend: 'up',
      changePercent: 6.2,
      period: 'monthly',
      category: 'safety'
    }
  ]

  const mockAchievements: Achievement[] = [
    {
      id: '1',
      title: 'First Delivery',
      description: 'Complete your first delivery',
      icon: '🚚',
      category: 'milestone',
      rarity: 'common',
      unlockedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    },
    {
      id: '2',
      title: 'Speed Demon',
      description: 'Complete 50 deliveries under 20 minutes',
      icon: '⚡',
      category: 'efficiency',
      rarity: 'rare',
      unlockedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
    },
    {
      id: '3',
      title: 'Perfect Week',
      description: 'Complete 50 deliveries in a single week',
      icon: '🏆',
      category: 'deliveries',
      rarity: 'epic',
      unlockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    },
    {
      id: '4',
      title: 'Rating Master',
      description: 'Maintain 4.8+ rating for 30 days',
      icon: '⭐',
      category: 'rating',
      rarity: 'legendary',
      unlockedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    },
    {
      id: '5',
      title: 'Earnings Champion',
      description: 'Earn $1000 in a single week',
      icon: '💰',
      category: 'earnings',
      rarity: 'epic',
      progress: 892.75,
      maxProgress: 1000
    }
  ]

  const mockLeaderboard: LeaderboardEntry[] = [
    {
      rank: 1,
      courierId: 'courier_1',
      courierName: 'Alex Johnson',
      score: 98.5,
      metric: 'Rating',
      isCurrentUser: false
    },
    {
      rank: 2,
      courierId: 'courier_2',
      courierName: 'Sarah Wilson',
      score: 97.8,
      metric: 'Rating',
      isCurrentUser: false
    },
    {
      rank: 3,
      courierId: 'current_user',
      courierName: 'You',
      score: 96.2,
      metric: 'Rating',
      isCurrentUser: true
    },
    {
      rank: 4,
      courierId: 'courier_4',
      courierName: 'Mike Chen',
      score: 95.9,
      metric: 'Rating',
      isCurrentUser: false
    },
    {
      rank: 5,
      courierId: 'courier_5',
      courierName: 'Emma Davis',
      score: 95.1,
      metric: 'Rating',
      isCurrentUser: false
    }
  ]

  useEffect(() => {
    loadPerformanceData()
  }, [])

  const loadPerformanceData = async () => {
    try {
      setIsLoading(true)
      // In a real app, this would fetch from your API
      setGoals(mockGoals)
      setMetrics(mockMetrics)
      setAchievements(mockAchievements)
      setLeaderboard(mockLeaderboard)
    } catch (error) {
      console.error('Failed to load performance data:', error)
      toast({ title: 'Failed to load performance data', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const createGoal = (goalData: Partial<PerformanceGoal>) => {
    const newGoal: PerformanceGoal = {
      id: `goal_${Date.now()}`,
      title: goalData.title || 'New Goal',
      description: goalData.description || '',
      category: goalData.category || 'earnings',
      target: goalData.target || 100,
      current: 0,
      unit: goalData.unit || 'units',
      deadline: goalData.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      reward: goalData.reward || 'No reward',
      rewardType: goalData.rewardType || 'recognition',
      progress: 0,
      isActive: true,
      isCompleted: false,
      createdAt: new Date()
    }

    setGoals(prev => [newGoal, ...prev])
    toast({ title: 'Goal created successfully' })
    setShowCreateGoal(false)
  }

  const completeGoal = (goalId: string) => {
    setGoals(prev => 
      prev.map(goal => 
        goal.id === goalId 
          ? { ...goal, isCompleted: true, completedAt: new Date() }
          : goal
      )
    )
    toast({ title: 'Goal completed! 🎉' })
  }

  const deleteGoal = (goalId: string) => {
    setGoals(prev => prev.filter(goal => goal.id !== goalId))
    toast({ title: 'Goal deleted' })
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'earnings': return DollarSign
      case 'deliveries': return Package
      case 'rating': return Star
      case 'streak': return Zap
      case 'efficiency': return Clock
      case 'safety': return Shield
      default: return Target
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'earnings': return 'text-green-600'
      case 'deliveries': return 'text-blue-600'
      case 'rating': return 'text-yellow-600'
      case 'streak': return 'text-orange-600'
      case 'efficiency': return 'text-purple-600'
      case 'safety': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-500'
      case 'rare': return 'bg-blue-500'
      case 'epic': return 'bg-purple-500'
      case 'legendary': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return TrendingUp
      case 'down': return TrendingDown
      case 'stable': return BarChart3
      default: return BarChart3
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      case 'stable': return 'text-gray-600'
      default: return 'text-gray-600'
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
      day: 'numeric',
      year: 'numeric'
    })
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
            <h1 className="text-2xl font-bold">Performance</h1>
            <p className="text-sm text-gray-600">Track your goals and achievements</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadPerformanceData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => setShowCreateGoal(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={(value: any) => setSelectedTab(value)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="leaderboard">Rankings</TabsTrigger>
          </TabsList>

          <TabsContent value="goals" className="space-y-4">
            {/* Goals Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Goals Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {goals.filter(g => g.isActive).length}
                    </div>
                    <div className="text-sm text-gray-600">Active Goals</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {goals.filter(g => g.isCompleted).length}
                    </div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Goals List */}
            <div className="space-y-3">
              {goals.map((goal) => {
                const Icon = getCategoryIcon(goal.category)
                return (
                  <Card key={goal.id} className={goal.isCompleted ? 'opacity-75' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Icon className={`h-5 w-5 ${getCategoryColor(goal.category)}`} />
                          <div>
                            <h3 className="font-semibold">{goal.title}</h3>
                            <p className="text-sm text-gray-600">{goal.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {goal.reward}
                          </Badge>
                          {goal.isCompleted && (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{goal.current}/{goal.target} {goal.unit}</span>
                          <span>{goal.progress.toFixed(0)}%</span>
                        </div>
                        <Progress value={goal.progress} className="h-2" />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Deadline: {formatDate(goal.deadline)}</span>
                          <span>{goal.category}</span>
                        </div>
                      </div>

                      {!goal.isCompleted && goal.progress >= 100 && (
                        <Button 
                          size="sm" 
                          className="w-full mt-3"
                          onClick={() => completeGoal(goal.id)}
                        >
                          <Trophy className="h-4 w-4 mr-2" />
                          Complete Goal
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            {/* Metrics Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {metrics.filter(m => m.trend === 'up').length}
                    </div>
                    <div className="text-sm text-gray-600">Improving</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {metrics.filter(m => m.trend === 'down').length}
                    </div>
                    <div className="text-sm text-gray-600">Declining</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Metrics List */}
            <div className="space-y-3">
              {metrics.map((metric) => {
                const TrendIcon = getTrendIcon(metric.trend)
                return (
                  <Card key={metric.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{metric.name}</h3>
                          <p className="text-sm text-gray-600">{metric.period}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            {metric.category === 'earnings' ? formatCurrency(metric.value) : metric.value}
                          </div>
                          <div className="text-sm text-gray-600">{metric.unit}</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Target: {metric.target} {metric.unit}</span>
                          <div className="flex items-center gap-1">
                            <TrendIcon className={`h-4 w-4 ${getTrendColor(metric.trend)}`} />
                            <span className={getTrendColor(metric.trend)}>
                              {metric.changePercent > 0 ? '+' : ''}{metric.changePercent.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <Progress 
                          value={(metric.value / metric.target) * 100} 
                          className="h-2" 
                        />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            {/* Achievements Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {achievements.filter(a => a.unlockedAt).length}
                    </div>
                    <div className="text-sm text-gray-600">Unlocked</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {achievements.filter(a => !a.unlockedAt).length}
                    </div>
                    <div className="text-sm text-gray-600">In Progress</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Achievements List */}
            <div className="space-y-3">
              {achievements.map((achievement) => (
                <Card key={achievement.id} className={achievement.unlockedAt ? '' : 'opacity-60'}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{achievement.title}</h3>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getRarityColor(achievement.rarity)} text-white`}
                          >
                            {achievement.rarity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{achievement.description}</p>
                        {achievement.progress && achievement.maxProgress && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Progress</span>
                              <span>{achievement.progress}/{achievement.maxProgress}</span>
                            </div>
                            <Progress 
                              value={(achievement.progress / achievement.maxProgress) * 100} 
                              className="h-1" 
                            />
                          </div>
                        )}
                        {achievement.unlockedAt && (
                          <div className="text-xs text-green-600 mt-1">
                            Unlocked: {formatDate(achievement.unlockedAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-4">
            {/* Leaderboard Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Your Ranking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    #{leaderboard.find(entry => entry.isCurrentUser)?.rank || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Out of {leaderboard.length} couriers</div>
                </div>
              </CardContent>
            </Card>

            {/* Leaderboard List */}
            <div className="space-y-2">
              {leaderboard.map((entry) => (
                <Card key={entry.courierId} className={entry.isCurrentUser ? 'bg-blue-50 border-blue-200' : ''}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200">
                        {entry.rank <= 3 ? (
                          <Trophy className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <span className="text-sm font-bold">{entry.rank}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{entry.courierName}</span>
                          {entry.isCurrentUser && (
                            <Badge variant="outline" className="text-xs">You</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {entry.score} {entry.metric}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Create Goal Modal */}
        {showCreateGoal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Create New Goal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Goal Title</label>
                  <input
                    type="text"
                    placeholder="Enter goal title"
                    className="w-full p-2 border rounded-lg mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    placeholder="Enter goal description"
                    className="w-full p-2 border rounded-lg mt-1 h-20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Target</label>
                    <input
                      type="number"
                      placeholder="100"
                      className="w-full p-2 border rounded-lg mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Unit</label>
                    <select className="w-full p-2 border rounded-lg mt-1">
                      <option value="dollars">Dollars</option>
                      <option value="deliveries">Deliveries</option>
                      <option value="stars">Stars</option>
                      <option value="days">Days</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Reward</label>
                  <input
                    type="text"
                    placeholder="Enter reward description"
                    className="w-full p-2 border rounded-lg mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowCreateGoal(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={() => createGoal({})}
                  >
                    Create Goal
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
