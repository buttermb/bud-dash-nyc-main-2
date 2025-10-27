import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ETAData {
  eta_minutes: number;
  distance_miles: number;
  last_updated: string;
  route?: any;
}

export const useETATracking = (orderId: string | null) => {
  const [eta, setEta] = useState<ETAData | null>(null);
  const [loading, setLoading] = useState(false);

  const calculateETA = async (courierLat?: number, courierLng?: number) => {
    if (!orderId) return;

    setLoading(true);
    try {
      // Try to use Edge Function first
      try {
        // Only invoke ETA function if we have courier coordinates
        if (courierLat !== undefined && courierLng !== undefined && courierLat !== null && courierLng !== null) {
          const { data, error } = await supabase.functions.invoke('calculate-eta', {
            body: {
              orderId,
              courierLat,
              courierLng
            }
          });

          if (error) {
            const errorMsg = error?.message || String(error) || 'Edge function error';
            throw new Error(errorMsg);
          }

          if (data?.success) {
            setEta({
              eta_minutes: data.eta_minutes || 0,
              distance_miles: parseFloat(data.distance_miles || '0'),
              last_updated: new Date().toISOString(),
              route: data.route
            });
            return;
          } else if (data?.error) {
            throw new Error(data.error);
          }
        } else {
          // If no courier coordinates, skip edge function and go straight to database
          throw new Error('Courier coordinates not available');
        }
      } catch (functionError: any) {
        const errorMsg = functionError?.message || String(functionError) || 'Unknown error';
        const errorCode = functionError?.code || 'UNKNOWN';
        console.warn('ETA calculation via function failed, trying direct database query:', {
          message: errorMsg,
          code: errorCode
        });

        // Fallback: Load ETA directly from database
        const { data: orderData, error: queryError } = await supabase
          .from('orders')
          .select('eta_minutes, eta_updated_at')
          .eq('id', orderId)
          .single();

        if (queryError) {
          const dbErrorMsg = queryError?.message || String(queryError) || 'Database query failed';
          console.error('Failed to fetch ETA from database:', {
            message: dbErrorMsg,
            code: queryError?.code || 'DB_ERROR'
          });
          throw new Error(`Unable to calculate ETA: ${dbErrorMsg}`);
        }

        if (orderData?.eta_minutes) {
          setEta({
            eta_minutes: orderData.eta_minutes,
            distance_miles: 0,
            last_updated: orderData.eta_updated_at || new Date().toISOString()
          });
        }
      }
    } catch (error: any) {
      const errorMsg = error?.message || String(error) || 'Unknown ETA calculation error';
      const errorCode = error?.code || 'UNKNOWN';
      console.error('ETA calculation error:', {
        message: errorMsg,
        code: errorCode,
        details: errorMsg
      });

      // Silent fail - ETA is optional
      setEta(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!orderId) return;

    // Subscribe to courier location updates for this order
    const channel = supabase
      .channel(`eta-tracking-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          const updated = payload.new as any;
          if (updated.eta_minutes) {
            setEta(prev => ({
              ...prev,
              eta_minutes: updated.eta_minutes,
              last_updated: updated.eta_updated_at || new Date().toISOString()
            } as ETAData));
          }
        }
      )
      .on('system', { event: 'CHANNEL_ERROR' }, () => {
        console.error('ETA tracking channel error');
      })
      .on('system', { event: 'TIMED_OUT' }, () => {
        console.warn('ETA tracking channel timed out, will retry');
      })
      .subscribe();

    // Initial ETA calculation
    calculateETA();

    // Recalculate every 5 minutes (reduced frequency for better performance)
    const interval = setInterval(() => calculateETA(), 300000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [orderId]);

  return {
    eta,
    loading,
    recalculate: calculateETA
  };
};
