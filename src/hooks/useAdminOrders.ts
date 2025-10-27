import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminRealtime } from './useAdminRealtime';

export interface AdminOrder {
  id: string;
  user_id: string;
  status: string;
  total_amount: number;
  created_at: string;
  courier?: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    is_online: boolean;
    current_lat?: number;
    current_lng?: number;
  };
}

export function useAdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Query orders with left join to couriers
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          user_id,
          status,
          total_amount,
          courier_id,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (ordersError) throw ordersError;

      // If there are courier_ids, fetch courier details
      let couriersMap: Record<string, any> = {};
      const courierIds = [...new Set(ordersData?.map(o => o.courier_id).filter(Boolean) as string[])];
      
      if (courierIds.length > 0) {
        const { data: couriersData, error: couriersError } = await supabase
          .from('couriers')
          .select('id, full_name, email, phone, is_online, current_lat, current_lng')
          .in('id', courierIds);

        if (couriersError) {
          console.warn('Failed to fetch couriers:', couriersError);
        } else {
          couriersMap = (couriersData || []).reduce((acc, c) => {
            acc[c.id] = c;
            return acc;
          }, {});
        }
      }

      // Combine orders with courier data
      const enrichedOrders = (ordersData || []).map(order => ({
        ...order,
        courier: order.courier_id ? couriersMap[order.courier_id] : undefined
      }));

      setOrders(enrichedOrders);
    } catch (err: any) {
      let errorMsg = 'Failed to fetch orders';

      if (typeof err === 'object' && err !== null) {
        if ('message' in err) {
          errorMsg = err.message;
        } else if ('error' in err) {
          errorMsg = String(err.error);
        } else {
          try {
            errorMsg = JSON.stringify(err);
          } catch {
            errorMsg = Object.prototype.toString.call(err);
          }
        }
      } else if (err) {
        errorMsg = String(err);
      }

      console.error('Error fetching orders:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, []);

  // Setup realtime subscription
  useAdminRealtime('orders', fetchOrders);
  useAdminRealtime('couriers', fetchOrders);

  return { orders, loading, error, refetch: fetchOrders };
}
