import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { 
  Search, 
  Zap, 
  Keyboard, 
  ArrowRight,
  Clock,
  Star,
  History,
  Settings,
  HelpCircle
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface Shortcut {
  id: string
  keys: string[]
  description: string
  action: () => void
  category: 'navigation' | 'actions' | 'search' | 'system'
  isGlobal?: boolean
}

interface CommandPaletteItem {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  action: () => void
  category: string
  keywords: string[]
}

export const AdminKeyboardShortcuts: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [recentActions, setRecentActions] = useState<string[]>([])
  const [favoriteActions, setFavoriteActions] = useState<string[]>([])

  // Command palette items
  const commandItems: CommandPaletteItem[] = [
    // Navigation
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Go to admin dashboard',
      icon: () => <div className="w-4 h-4 bg-blue-500 rounded" />,
      action: () => navigate('/admin/dashboard'),
      category: 'Navigation',
      keywords: ['dashboard', 'home', 'overview']
    },
    {
      id: 'orders',
      title: 'Orders',
      description: 'Manage all orders',
      icon: () => <div className="w-4 h-4 bg-green-500 rounded" />,
      action: () => navigate('/admin/orders'),
      category: 'Navigation',
      keywords: ['orders', 'order', 'purchase']
    },
    {
      id: 'products',
      title: 'Products',
      description: 'Manage product catalog',
      icon: () => <div className="w-4 h-4 bg-purple-500 rounded" />,
      action: () => navigate('/admin/products'),
      category: 'Navigation',
      keywords: ['products', 'product', 'catalog', 'inventory']
    },
    {
      id: 'users',
      title: 'Users',
      description: 'Manage user accounts',
      icon: () => <div className="w-4 h-4 bg-orange-500 rounded" />,
      action: () => navigate('/admin/users'),
      category: 'Navigation',
      keywords: ['users', 'user', 'customers', 'accounts']
    },
    {
      id: 'couriers',
      title: 'Couriers',
      description: 'Manage courier accounts',
      icon: () => <div className="w-4 h-4 bg-red-500 rounded" />,
      action: () => navigate('/admin/couriers'),
      category: 'Navigation',
      keywords: ['couriers', 'courier', 'delivery', 'drivers']
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'View business analytics',
      icon: () => <div className="w-4 h-4 bg-indigo-500 rounded" />,
      action: () => navigate('/admin/analytics'),
      category: 'Navigation',
      keywords: ['analytics', 'stats', 'metrics', 'reports']
    },
    {
      id: 'live-map',
      title: 'Live Map',
      description: 'Real-time delivery tracking',
      icon: () => <div className="w-4 h-4 bg-teal-500 rounded" />,
      action: () => navigate('/admin/live-map'),
      category: 'Navigation',
      keywords: ['map', 'tracking', 'live', 'delivery']
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'System configuration',
      icon: () => <div className="w-4 h-4 bg-gray-500 rounded" />,
      action: () => navigate('/admin/settings'),
      category: 'Navigation',
      keywords: ['settings', 'config', 'preferences']
    },

    // Actions
    {
      id: 'new-product',
      title: 'New Product',
      description: 'Create a new product',
      icon: () => <div className="w-4 h-4 bg-green-600 rounded" />,
      action: () => navigate('/admin/products/new'),
      category: 'Actions',
      keywords: ['new', 'create', 'add', 'product']
    },
    {
      id: 'new-coupon',
      title: 'New Coupon',
      description: 'Create a new coupon code',
      icon: () => <div className="w-4 h-4 bg-yellow-600 rounded" />,
      action: () => navigate('/admin/coupons/create'),
      category: 'Actions',
      keywords: ['coupon', 'discount', 'promo', 'code']
    },
    {
      id: 'export-data',
      title: 'Export Data',
      description: 'Export current page data',
      icon: () => <div className="w-4 h-4 bg-blue-600 rounded" />,
      action: () => {
        toast({ title: 'Export feature coming soon' })
      },
      category: 'Actions',
      keywords: ['export', 'download', 'csv', 'data']
    },
    {
      id: 'refresh-data',
      title: 'Refresh Data',
      description: 'Reload current page data',
      icon: () => <div className="w-4 h-4 bg-purple-600 rounded" />,
      action: () => window.location.reload(),
      category: 'Actions',
      keywords: ['refresh', 'reload', 'update']
    },

    // System
    {
      id: 'toggle-sidebar',
      title: 'Toggle Sidebar',
      description: 'Show/hide the sidebar',
      icon: () => <div className="w-4 h-4 bg-gray-600 rounded" />,
      action: () => {
        // This would toggle the sidebar
        toast({ title: 'Sidebar toggled' })
      },
      category: 'System',
      keywords: ['sidebar', 'toggle', 'hide', 'show']
    },
    {
      id: 'dark-mode',
      title: 'Toggle Dark Mode',
      description: 'Switch between light and dark themes',
      icon: () => <div className="w-4 h-4 bg-gray-800 rounded" />,
      action: () => {
        // This would toggle dark mode
        toast({ title: 'Theme toggled' })
      },
      category: 'System',
      keywords: ['theme', 'dark', 'light', 'mode']
    }
  ]

  // Keyboard shortcuts
  const shortcuts: Shortcut[] = [
    // Navigation shortcuts
    {
      id: 'cmd-k',
      keys: ['Cmd', 'K'],
      description: 'Open command palette',
      action: () => setIsCommandPaletteOpen(true),
      category: 'search',
      isGlobal: true
    },
    {
      id: 'cmd-shift-k',
      keys: ['Cmd', 'Shift', 'K'],
      description: 'Show keyboard shortcuts',
      action: () => setIsShortcutsOpen(true),
      category: 'system',
      isGlobal: true
    },
    {
      id: 'cmd-1',
      keys: ['Cmd', '1'],
      description: 'Go to Dashboard',
      action: () => navigate('/admin/dashboard'),
      category: 'navigation'
    },
    {
      id: 'cmd-2',
      keys: ['Cmd', '2'],
      description: 'Go to Orders',
      action: () => navigate('/admin/orders'),
      category: 'navigation'
    },
    {
      id: 'cmd-3',
      keys: ['Cmd', '3'],
      description: 'Go to Products',
      action: () => navigate('/admin/products'),
      category: 'navigation'
    },
    {
      id: 'cmd-4',
      keys: ['Cmd', '4'],
      description: 'Go to Users',
      action: () => navigate('/admin/users'),
      category: 'navigation'
    },
    {
      id: 'cmd-5',
      keys: ['Cmd', '5'],
      description: 'Go to Couriers',
      action: () => navigate('/admin/couriers'),
      category: 'navigation'
    },
    {
      id: 'cmd-6',
      keys: ['Cmd', '6'],
      description: 'Go to Analytics',
      action: () => navigate('/admin/analytics'),
      category: 'navigation'
    },
    {
      id: 'cmd-7',
      keys: ['Cmd', '7'],
      description: 'Go to Live Map',
      action: () => navigate('/admin/live-map'),
      category: 'navigation'
    },
    {
      id: 'cmd-8',
      keys: ['Cmd', '8'],
      description: 'Go to Settings',
      action: () => navigate('/admin/settings'),
      category: 'navigation'
    },

    // Action shortcuts
    {
      id: 'cmd-n',
      keys: ['Cmd', 'N'],
      description: 'Create new item',
      action: () => {
        const currentPath = location.pathname
        if (currentPath.includes('/products')) {
          navigate('/admin/products/new')
        } else if (currentPath.includes('/coupons')) {
          navigate('/admin/coupons/create')
        } else {
          toast({ title: 'No new item action available for this page' })
        }
      },
      category: 'actions'
    },
    {
      id: 'cmd-r',
      keys: ['Cmd', 'R'],
      description: 'Refresh current page',
      action: () => window.location.reload(),
      category: 'actions'
    },
    {
      id: 'cmd-e',
      keys: ['Cmd', 'E'],
      description: 'Export current data',
      action: () => {
        toast({ title: 'Export feature coming soon' })
      },
      category: 'actions'
    },
    {
      id: 'cmd-f',
      keys: ['Cmd', 'F'],
      description: 'Focus search input',
      action: () => {
        const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        } else {
          toast({ title: 'No search input found on this page' })
        }
      },
      category: 'search'
    },

    // System shortcuts
    {
      id: 'cmd-b',
      keys: ['Cmd', 'B'],
      description: 'Toggle sidebar',
      action: () => {
        toast({ title: 'Sidebar toggled' })
      },
      category: 'system'
    },
    {
      id: 'cmd-shift-d',
      keys: ['Cmd', 'Shift', 'D'],
      description: 'Toggle dark mode',
      action: () => {
        toast({ title: 'Theme toggled' })
      },
      category: 'system'
    },
    {
      id: 'escape',
      keys: ['Escape'],
      description: 'Close modals/dialogs',
      action: () => {
        setIsCommandPaletteOpen(false)
        setIsShortcutsOpen(false)
      },
      category: 'system',
      isGlobal: true
    }
  ]

  // Filter command items based on search query
  const filteredItems = commandItems.filter(item => {
    if (!searchQuery) return true
    
    const query = searchQuery.toLowerCase()
    return (
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.keywords.some(keyword => keyword.toLowerCase().includes(query))
    )
  })

  // Group items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, CommandPaletteItem[]>)

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const cmdKey = isMac ? e.metaKey : e.ctrlKey
    
    // Check for shortcuts
    const shortcut = shortcuts.find(s => {
      const hasCmd = s.keys.includes('Cmd') ? cmdKey : !cmdKey
      const hasShift = s.keys.includes('Shift') ? e.shiftKey : !e.shiftKey
      const hasAlt = s.keys.includes('Alt') ? e.altKey : !e.altKey
      const hasKey = s.keys.some(key => key === e.key || key === e.code)
      
      return hasCmd && hasShift && hasAlt && hasKey
    })

    if (shortcut) {
      e.preventDefault()
      shortcut.action()
      
      // Track recent action
      setRecentActions(prev => {
        const newActions = [shortcut.description, ...prev.filter(a => a !== shortcut.description)]
        return newActions.slice(0, 5)
      })
    }
  }, [])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleCommandSelect = (item: CommandPaletteItem) => {
    item.action()
    setIsCommandPaletteOpen(false)
    setSearchQuery('')
    
    // Track recent action
    setRecentActions(prev => {
      const newActions = [item.title, ...prev.filter(a => a !== item.title)]
      return newActions.slice(0, 5)
    })
  }

  const toggleFavorite = (itemId: string) => {
    setFavoriteActions(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId)
      } else {
        return [...prev, itemId]
      }
    })
  }

  return (
    <>
      {/* Command Palette */}
      <Dialog open={isCommandPaletteOpen} onOpenChange={setIsCommandPaletteOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Command Palette</DialogTitle>
            <DialogDescription>
              Search and execute commands quickly. Press Cmd+K to open anytime.
            </DialogDescription>
          </DialogHeader>
          
          <Command className="rounded-lg border shadow-md">
            <CommandInput 
              placeholder="Type a command or search..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList className="max-h-96">
              <CommandEmpty>No results found.</CommandEmpty>
              
              {Object.entries(groupedItems).map(([category, items]) => (
                <CommandGroup key={category} heading={category}>
                  {items.map((item) => {
                    const Icon = item.icon
                    const isFavorite = favoriteActions.includes(item.id)
                    
                    return (
                      <CommandItem
                        key={item.id}
                        onSelect={() => handleCommandSelect(item)}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <Icon />
                          <div>
                            <div className="font-medium">{item.title}</div>
                            <div className="text-sm text-muted-foreground">{item.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isFavorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleFavorite(item.id)
                            }}
                          >
                            <Star className={cn("h-4 w-4", isFavorite && "text-yellow-500 fill-current")} />
                          </Button>
                        </div>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>

          {/* Recent Actions */}
          {recentActions.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <History className="h-4 w-4" />
                Recent Actions
              </h4>
              <div className="flex flex-wrap gap-2">
                {recentActions.map((action, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {action}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts Dialog */}
      <Dialog open={isShortcutsOpen} onOpenChange={setIsShortcutsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Keyboard Shortcuts
            </DialogTitle>
            <DialogDescription>
              Power user shortcuts for faster navigation and actions.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {['navigation', 'actions', 'search', 'system'].map(category => {
              const categoryShortcuts = shortcuts.filter(s => s.category === category)
              if (categoryShortcuts.length === 0) return null

              return (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="capitalize text-lg">{category}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {categoryShortcuts.map(shortcut => (
                      <div key={shortcut.id} className="flex items-center justify-between">
                        <span className="text-sm">{shortcut.description}</span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, index) => (
                            <React.Fragment key={index}>
                              <Badge variant="outline" className="text-xs">
                                {key === 'Cmd' ? (navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl') : key}
                              </Badge>
                              {index < shortcut.keys.length - 1 && (
                                <span className="text-muted-foreground">+</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Pro Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Press <kbd className="px-1 py-0.5 bg-blue-200 rounded text-xs">Cmd+K</kbd> anytime to open the command palette</li>
              <li>• Use <kbd className="px-1 py-0.5 bg-blue-200 rounded text-xs">Cmd+1-8</kbd> to quickly navigate between main sections</li>
              <li>• Press <kbd className="px-1 py-0.5 bg-blue-200 rounded text-xs">Escape</kbd> to close any open dialogs</li>
              <li>• Star items in the command palette to add them to your favorites</li>
            </ul>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Help Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              size="icon"
              className="rounded-full shadow-lg hover:shadow-xl transition-shadow"
              onClick={() => setIsShortcutsOpen(true)}
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-3">
              <h4 className="font-medium">Quick Help</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Cmd+K</kbd>
                  <span>Open command palette</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Cmd+Shift+K</kbd>
                  <span>Show all shortcuts</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Cmd+1-8</kbd>
                  <span>Quick navigation</span>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => setIsShortcutsOpen(true)}
              >
                <Keyboard className="h-4 w-4 mr-2" />
                View All Shortcuts
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </>
  )
}
