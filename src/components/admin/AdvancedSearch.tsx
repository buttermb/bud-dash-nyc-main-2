import React, { useState, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { 
  Search, 
  Filter, 
  X, 
  Calendar as CalendarIcon,
  ChevronDown,
  SortAsc,
  SortDesc,
  Save,
  RotateCcw
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface FilterOption {
  id: string
  label: string
  type: 'text' | 'select' | 'date' | 'dateRange' | 'boolean' | 'number'
  options?: Array<{ value: string; label: string }>
  placeholder?: string
}

interface SortOption {
  id: string
  label: string
  field: string
  direction: 'asc' | 'desc'
}

interface AdvancedSearchProps {
  type: 'orders' | 'products' | 'users' | 'couriers'
  onSearch: (filters: SearchFilters) => void
  onClear: () => void
  isLoading?: boolean
}

interface SearchFilters {
  query: string
  filters: Record<string, any>
  sort: SortOption
  dateRange?: {
    from: Date
    to: Date
  }
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  type,
  onSearch,
  onClear,
  isLoading = false
}) => {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [sort, setSort] = useState<SortOption>({ id: 'recent', label: 'Most Recent', field: 'created_at', direction: 'desc' })
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [showFilters, setShowFilters] = useState(false)
  const [savedFilters, setSavedFilters] = useState<Array<{ name: string; filters: SearchFilters }>>([])

  // Define filter options based on type
  const getFilterOptions = (): FilterOption[] => {
    switch (type) {
      case 'orders':
        return [
          { id: 'status', label: 'Status', type: 'select', options: [
            { value: 'pending', label: 'Pending' },
            { value: 'confirmed', label: 'Confirmed' },
            { value: 'preparing', label: 'Preparing' },
            { value: 'out_for_delivery', label: 'Out for Delivery' },
            { value: 'delivered', label: 'Delivered' },
            { value: 'cancelled', label: 'Cancelled' }
          ]},
          { id: 'payment_status', label: 'Payment Status', type: 'select', options: [
            { value: 'pending', label: 'Pending' },
            { value: 'paid', label: 'Paid' },
            { value: 'failed', label: 'Failed' },
            { value: 'refunded', label: 'Refunded' }
          ]},
          { id: 'total_min', label: 'Min Total', type: 'number', placeholder: '0' },
          { id: 'total_max', label: 'Max Total', type: 'number', placeholder: '1000' },
          { id: 'courier_id', label: 'Courier', type: 'text', placeholder: 'Courier ID' },
          { id: 'user_id', label: 'User', type: 'text', placeholder: 'User ID' }
        ]

      case 'products':
        return [
          { id: 'category', label: 'Category', type: 'select', options: [
            { value: 'flower', label: 'Flower' },
            { value: 'edibles', label: 'Edibles' },
            { value: 'concentrates', label: 'Concentrates' },
            { value: 'accessories', label: 'Accessories' }
          ]},
          { id: 'is_active', label: 'Active', type: 'boolean' },
          { id: 'in_stock', label: 'In Stock', type: 'boolean' },
          { id: 'price_min', label: 'Min Price', type: 'number', placeholder: '0' },
          { id: 'price_max', label: 'Max Price', type: 'number', placeholder: '1000' },
          { id: 'brand', label: 'Brand', type: 'text', placeholder: 'Brand name' },
          { id: 'thc_min', label: 'Min THC %', type: 'number', placeholder: '0' },
          { id: 'thc_max', label: 'Max THC %', type: 'number', placeholder: '100' }
        ]

      case 'users':
        return [
          { id: 'is_verified', label: 'Verified', type: 'boolean' },
          { id: 'is_suspended', label: 'Suspended', type: 'boolean' },
          { id: 'age_verified', label: 'Age Verified', type: 'boolean' },
          { id: 'orders_count_min', label: 'Min Orders', type: 'number', placeholder: '0' },
          { id: 'orders_count_max', label: 'Max Orders', type: 'number', placeholder: '100' },
          { id: 'total_spent_min', label: 'Min Spent', type: 'number', placeholder: '0' },
          { id: 'total_spent_max', label: 'Max Spent', type: 'number', placeholder: '10000' },
          { id: 'last_order_days', label: 'Last Order (days ago)', type: 'number', placeholder: '30' }
        ]

      case 'couriers':
        return [
          { id: 'status', label: 'Status', type: 'select', options: [
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'active', label: 'Active' },
            { value: 'suspended', label: 'Suspended' },
            { value: 'rejected', label: 'Rejected' }
          ]},
          { id: 'is_online', label: 'Online', type: 'boolean' },
          { id: 'rating_min', label: 'Min Rating', type: 'number', placeholder: '1' },
          { id: 'rating_max', label: 'Max Rating', type: 'number', placeholder: '5' },
          { id: 'deliveries_count_min', label: 'Min Deliveries', type: 'number', placeholder: '0' },
          { id: 'deliveries_count_max', label: 'Max Deliveries', type: 'number', placeholder: '1000' },
          { id: 'vehicle_type', label: 'Vehicle Type', type: 'select', options: [
            { value: 'bike', label: 'Bike' },
            { value: 'car', label: 'Car' },
            { value: 'motorcycle', label: 'Motorcycle' },
            { value: 'walking', label: 'Walking' }
          ]}
        ]

      default:
        return []
    }
  }

  const getSortOptions = (): SortOption[] => {
    switch (type) {
      case 'orders':
        return [
          { id: 'recent', label: 'Most Recent', field: 'created_at', direction: 'desc' },
          { id: 'oldest', label: 'Oldest First', field: 'created_at', direction: 'asc' },
          { id: 'total-high', label: 'Highest Total', field: 'total', direction: 'desc' },
          { id: 'total-low', label: 'Lowest Total', field: 'total', direction: 'asc' },
          { id: 'status', label: 'Status A-Z', field: 'status', direction: 'asc' }
        ]

      case 'products':
        return [
          { id: 'recent', label: 'Most Recent', field: 'created_at', direction: 'desc' },
          { id: 'name-asc', label: 'Name A-Z', field: 'name', direction: 'asc' },
          { id: 'name-desc', label: 'Name Z-A', field: 'name', direction: 'desc' },
          { id: 'price-high', label: 'Highest Price', field: 'price', direction: 'desc' },
          { id: 'price-low', label: 'Lowest Price', field: 'price', direction: 'asc' },
          { id: 'stock', label: 'Stock Level', field: 'stock_quantity', direction: 'desc' }
        ]

      case 'users':
        return [
          { id: 'recent', label: 'Most Recent', field: 'created_at', direction: 'desc' },
          { id: 'name-asc', label: 'Name A-Z', field: 'name', direction: 'asc' },
          { id: 'name-desc', label: 'Name Z-A', field: 'name', direction: 'desc' },
          { id: 'orders-high', label: 'Most Orders', field: 'orders_count', direction: 'desc' },
          { id: 'spent-high', label: 'Highest Spent', field: 'total_spent', direction: 'desc' },
          { id: 'last-active', label: 'Last Active', field: 'last_order_at', direction: 'desc' }
        ]

      case 'couriers':
        return [
          { id: 'recent', label: 'Most Recent', field: 'created_at', direction: 'desc' },
          { id: 'name-asc', label: 'Name A-Z', field: 'name', direction: 'asc' },
          { id: 'rating-high', label: 'Highest Rating', field: 'rating', direction: 'desc' },
          { id: 'deliveries-high', label: 'Most Deliveries', field: 'deliveries_count', direction: 'desc' },
          { id: 'status', label: 'Status A-Z', field: 'status', direction: 'asc' }
        ]

      default:
        return []
    }
  }

  const filterOptions = getFilterOptions()
  const sortOptions = getSortOptions()

  const activeFiltersCount = Object.keys(filters).filter(key => 
    filters[key] !== undefined && filters[key] !== '' && filters[key] !== false
  ).length

  const handleSearch = () => {
    const searchFilters: SearchFilters = {
      query,
      filters,
      sort,
      dateRange: dateRange.from && dateRange.to ? {
        from: dateRange.from,
        to: dateRange.to
      } : undefined
    }
    onSearch(searchFilters)
  }

  const handleClear = () => {
    setQuery('')
    setFilters({})
    setDateRange({})
    setSort(sortOptions[0])
    onClear()
  }

  const handleSaveFilter = () => {
    const filterName = prompt('Enter a name for this filter:')
    if (filterName) {
      const newFilter = {
        name: filterName,
        filters: { query, filters, sort, dateRange }
      }
      setSavedFilters(prev => [...prev, newFilter])
    }
  }

  const handleLoadFilter = (savedFilter: { name: string; filters: SearchFilters }) => {
    setQuery(savedFilter.filters.query)
    setFilters(savedFilter.filters.filters)
    setSort(savedFilter.filters.sort)
    setDateRange(savedFilter.filters.dateRange || {})
  }

  const renderFilterInput = (option: FilterOption) => {
    switch (option.type) {
      case 'select':
        return (
          <Select
            value={filters[option.id] || ''}
            onValueChange={(value) => setFilters(prev => ({ ...prev, [option.id]: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder={option.placeholder || `Select ${option.label}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              {option.options?.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={filters[option.id] || false}
              onCheckedChange={(checked) => setFilters(prev => ({ ...prev, [option.id]: checked }))}
            />
            <Label>{option.label}</Label>
          </div>
        )

      case 'number':
        return (
          <Input
            type="number"
            placeholder={option.placeholder}
            value={filters[option.id] || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, [option.id]: e.target.value }))}
          />
        )

      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters[option.id] ? format(filters[option.id], 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters[option.id]}
                onSelect={(date) => setFilters(prev => ({ ...prev, [option.id]: date }))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )

      case 'dateRange':
        return (
          <div className="flex space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? format(dateRange.from, 'PPP') : 'From'}
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
                  {dateRange.to ? format(dateRange.to, 'PPP') : 'To'}
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
        )

      default:
        return (
          <Input
            placeholder={option.placeholder || `Enter ${option.label}`}
            value={filters[option.id] || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, [option.id]: e.target.value }))}
          />
        )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Advanced Search & Filters</span>
          <div className="flex items-center gap-2">
            {savedFilters.length > 0 && (
              <Select onValueChange={(value) => {
                const filter = savedFilters.find(f => f.name === value)
                if (filter) handleLoadFilter(filter)
              }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Load filter" />
                </SelectTrigger>
                <SelectContent>
                  {savedFilters.map(filter => (
                    <SelectItem key={filter.name} value={filter.name}>
                      {filter.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button variant="outline" size="sm" onClick={handleSaveFilter}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${type}...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} disabled={isLoading}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button variant="outline" onClick={handleClear}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Sort by:</Label>
          <Select value={sort.id} onValueChange={(value) => {
            const option = sortOptions.find(opt => opt.id === value)
            if (option) setSort(option)
          }}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(option => (
                <SelectItem key={option.id} value={option.id}>
                  <div className="flex items-center gap-2">
                    {option.direction === 'asc' ? (
                      <SortAsc className="h-4 w-4" />
                    ) : (
                      <SortDesc className="h-4 w-4" />
                    )}
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filters Toggle */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
            <ChevronDown className={cn("h-4 w-4 transition-transform", showFilters && "rotate-180")} />
          </Button>

          {/* Active Filters */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(filters).map(([key, value]) => {
                if (value === undefined || value === '' || value === false) return null
                const option = filterOptions.find(opt => opt.id === key)
                return (
                  <Badge key={key} variant="secondary" className="flex items-center gap-1">
                    {option?.label}: {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setFilters(prev => ({ ...prev, [key]: undefined }))}
                    />
                  </Badge>
                )
              })}
            </div>
          )}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg bg-gray-50">
            {filterOptions.map(option => (
              <div key={option.id} className="space-y-2">
                <Label className="text-sm font-medium">{option.label}</Label>
                {renderFilterInput(option)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
