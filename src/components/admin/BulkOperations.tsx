import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Trash2, 
  Edit, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Package,
  Users,
  ShoppingCart,
  Download,
  Upload,
  AlertTriangle,
  MoreHorizontal
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface BulkOperation {
  id: string
  label: string
  icon: React.ComponentType<any>
  action: (selectedIds: string[]) => Promise<void>
  requiresConfirmation?: boolean
  confirmationMessage?: string
  variant?: 'default' | 'destructive' | 'outline'
}

interface BulkOperationsProps {
  type: 'orders' | 'products' | 'users' | 'couriers'
  items: Array<{
    id: string
    [key: string]: any
  }>
  onRefresh: () => void
}

export const BulkOperations: React.FC<BulkOperationsProps> = ({ 
  type, 
  items, 
  onRefresh 
}) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [isSelectAll, setIsSelectAll] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingOperation, setPendingOperation] = useState<BulkOperation | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Define bulk operations based on type
  const getBulkOperations = (): BulkOperation[] => {
    switch (type) {
      case 'orders':
        return [
          {
            id: 'mark-completed',
            label: 'Mark as Completed',
            icon: CheckCircle,
            action: async (ids) => {
              const { error } = await supabase
                .from('orders')
                .update({ status: 'completed', updated_at: new Date().toISOString() })
                .in('id', ids)
              
              if (error) throw error
            },
            requiresConfirmation: true,
            confirmationMessage: 'Are you sure you want to mark these orders as completed?'
          },
          {
            id: 'mark-cancelled',
            label: 'Cancel Orders',
            icon: XCircle,
            action: async (ids) => {
              const { error } = await supabase
                .from('orders')
                .update({ status: 'cancelled', updated_at: new Date().toISOString() })
                .in('id', ids)
              
              if (error) throw error
            },
            requiresConfirmation: true,
            confirmationMessage: 'Are you sure you want to cancel these orders?',
            variant: 'destructive'
          },
          {
            id: 'assign-courier',
            label: 'Assign Courier',
            icon: Package,
            action: async (ids) => {
              // This would open a courier selection dialog
              toast({ title: 'Courier assignment feature coming soon' })
            }
          },
          {
            id: 'export-orders',
            label: 'Export Orders',
            icon: Download,
            action: async (ids) => {
              const selectedOrders = items.filter(item => ids.includes(item.id))
              exportToCSV(selectedOrders, 'orders')
            }
          }
        ]

      case 'products':
        return [
          {
            id: 'activate-products',
            label: 'Activate Products',
            icon: CheckCircle,
            action: async (ids) => {
              const { error } = await supabase
                .from('products')
                .update({ is_active: true, updated_at: new Date().toISOString() })
                .in('id', ids)
              
              if (error) throw error
            },
            requiresConfirmation: true,
            confirmationMessage: 'Are you sure you want to activate these products?'
          },
          {
            id: 'deactivate-products',
            label: 'Deactivate Products',
            icon: XCircle,
            action: async (ids) => {
              const { error } = await supabase
                .from('products')
                .update({ is_active: false, updated_at: new Date().toISOString() })
                .in('id', ids)
              
              if (error) throw error
            },
            requiresConfirmation: true,
            confirmationMessage: 'Are you sure you want to deactivate these products?',
            variant: 'destructive'
          },
          {
            id: 'update-category',
            label: 'Update Category',
            icon: Edit,
            action: async (ids) => {
              toast({ title: 'Category update feature coming soon' })
            }
          },
          {
            id: 'export-products',
            label: 'Export Products',
            icon: Download,
            action: async (ids) => {
              const selectedProducts = items.filter(item => ids.includes(item.id))
              exportToCSV(selectedProducts, 'products')
            }
          }
        ]

      case 'users':
        return [
          {
            id: 'verify-users',
            label: 'Verify Users',
            icon: CheckCircle,
            action: async (ids) => {
              const { error } = await supabase
                .from('users')
                .update({ is_verified: true, updated_at: new Date().toISOString() })
                .in('id', ids)
              
              if (error) throw error
            },
            requiresConfirmation: true,
            confirmationMessage: 'Are you sure you want to verify these users?'
          },
          {
            id: 'suspend-users',
            label: 'Suspend Users',
            icon: XCircle,
            action: async (ids) => {
              const { error } = await supabase
                .from('users')
                .update({ is_suspended: true, updated_at: new Date().toISOString() })
                .in('id', ids)
              
              if (error) throw error
            },
            requiresConfirmation: true,
            confirmationMessage: 'Are you sure you want to suspend these users?',
            variant: 'destructive'
          },
          {
            id: 'send-notification',
            label: 'Send Notification',
            icon: AlertTriangle,
            action: async (ids) => {
              toast({ title: 'Notification feature coming soon' })
            }
          },
          {
            id: 'export-users',
            label: 'Export Users',
            icon: Download,
            action: async (ids) => {
              const selectedUsers = items.filter(item => ids.includes(item.id))
              exportToCSV(selectedUsers, 'users')
            }
          }
        ]

      case 'couriers':
        return [
          {
            id: 'approve-couriers',
            label: 'Approve Couriers',
            icon: CheckCircle,
            action: async (ids) => {
              const { error } = await supabase
                .from('couriers')
                .update({ status: 'approved', updated_at: new Date().toISOString() })
                .in('id', ids)
              
              if (error) throw error
            },
            requiresConfirmation: true,
            confirmationMessage: 'Are you sure you want to approve these couriers?'
          },
          {
            id: 'reject-couriers',
            label: 'Reject Couriers',
            icon: XCircle,
            action: async (ids) => {
              const { error } = await supabase
                .from('couriers')
                .update({ status: 'rejected', updated_at: new Date().toISOString() })
                .in('id', ids)
              
              if (error) throw error
            },
            requiresConfirmation: true,
            confirmationMessage: 'Are you sure you want to reject these couriers?',
            variant: 'destructive'
          },
          {
            id: 'send-message',
            label: 'Send Message',
            icon: AlertTriangle,
            action: async (ids) => {
              toast({ title: 'Messaging feature coming soon' })
            }
          },
          {
            id: 'export-couriers',
            label: 'Export Couriers',
            icon: Download,
            action: async (ids) => {
              const selectedCouriers = items.filter(item => ids.includes(item.id))
              exportToCSV(selectedCouriers, 'couriers')
            }
          }
        ]

      default:
        return []
    }
  }

  const bulkOperations = getBulkOperations()

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(items.map(item => item.id))
    } else {
      setSelectedItems([])
    }
    setIsSelectAll(checked)
  }

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId])
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId))
    }
  }

  const handleBulkOperation = async (operation: BulkOperation) => {
    if (operation.requiresConfirmation) {
      setPendingOperation(operation)
      setShowConfirmDialog(true)
    } else {
      await executeOperation(operation)
    }
  }

  const executeOperation = async (operation: BulkOperation) => {
    try {
      setIsLoading(true)
      await operation.action(selectedItems)
      
      toast({ 
        title: 'Operation completed', 
        description: `${operation.label} applied to ${selectedItems.length} items` 
      })
      
      setSelectedItems([])
      setIsSelectAll(false)
      onRefresh()
      
    } catch (error) {
      console.error('Bulk operation failed:', error)
      toast({ 
        title: 'Operation failed', 
        description: 'Please try again or contact support',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
      setShowConfirmDialog(false)
      setPendingOperation(null)
    }
  }

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast({ title: 'No data to export', variant: 'destructive' })
      return
    }

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    toast({ title: 'Export completed', description: `${data.length} items exported` })
  }

  // Update select all state when individual selections change
  useEffect(() => {
    if (selectedItems.length === items.length && items.length > 0) {
      setIsSelectAll(true)
    } else {
      setIsSelectAll(false)
    }
  }, [selectedItems, items])

  if (items.length === 0) {
    return null
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Bulk Operations</span>
            <Badge variant="outline">
              {selectedItems.length} selected
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Select All */}
          <div className="flex items-center space-x-2 p-3 border rounded-lg">
            <Checkbox
              id="select-all"
              checked={isSelectAll}
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm font-medium">
              Select All ({items.length} items)
            </label>
          </div>

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Actions for {selectedItems.length} selected items:
              </p>
              
              <div className="flex flex-wrap gap-2">
                {bulkOperations.map((operation) => {
                  const Icon = operation.icon
                  return (
                    <Button
                      key={operation.id}
                      variant={operation.variant || 'outline'}
                      size="sm"
                      onClick={() => handleBulkOperation(operation)}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {operation.label}
                    </Button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Individual Item Selection */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="flex items-center space-x-2 p-2 border rounded">
                <Checkbox
                  id={`item-${item.id}`}
                  checked={selectedItems.includes(item.id)}
                  onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                />
                <label htmlFor={`item-${item.id}`} className="flex-1 text-sm">
                  {type === 'orders' && `Order #${item.id.slice(0, 8)}`}
                  {type === 'products' && item.name}
                  {type === 'users' && item.email}
                  {type === 'couriers' && item.name}
                </label>
                {item.status && (
                  <Badge variant="outline" className="text-xs">
                    {item.status}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Operation</DialogTitle>
            <DialogDescription>
              {pendingOperation?.confirmationMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant={pendingOperation?.variant || 'default'}
              onClick={() => pendingOperation && executeOperation(pendingOperation)}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
