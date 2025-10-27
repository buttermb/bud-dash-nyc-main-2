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
    if (!orderId) {
      console.debug('calculateETA: No orderId provided, skipping');
      return;
    }

    setLoading(true);
    try {
      // Try to use Edge Function first
      try {
        // Only invoke ETA function if we have courier coordinates
        if (courierLat !== undefined && courierLng !== undefined && courierLat !== null && courierLng !== null) {
          console.debug(`Calculating ETA via edge function for order ${orderId}`);
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
            console.debug(`ETA calculated successfully: ${data.eta_minutes} minutes`);
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
          console.debug('No courier coordinates available, skipping edge function');
          throw new Error('Courier coordinates not available');
        }
      } catch (functionError: any) {
        const errorMsg = functionError?.message || String(functionError) || 'Unknown error';
        const errorCode = functionError?.code || 'UNKNOWN';
        console.warn(`ETA calculation via function failed for order ${orderId}:`, errorMsg);

        // Fallback: Load ETA directly from database
        console.debug(`Attempting to fetch ETA from database for order ${orderId}`);
        const { data: orderData, error: queryError } = await supabase
          .from('orders')
          .select('eta_minutes, eta_updated_at')
          .eq('id', orderId)
          .single();

        if (queryError) {
          let dbErrorMsg = 'Database query failed';
          if (typeof queryError === 'object' && queryError !== null) {
            if ('message' in queryError) {
              dbErrorMsg = queryError.message;
            } else if ('error' in queryError) {
              dbErrorMsg = String(queryError.error);
            } else {
              try {
                dbErrorMsg = JSON.stringify(queryError);
              } catch {
                dbErrorMsg = Object.prototype.toString.call(queryError);
              }
            }
          } else {
            dbErrorMsg = String(queryError);
          }
          console.error(`Failed to fetch ETA from database for order ${orderId}:`, dbErrorMsg);
          throw new Error(`Unable to calculate ETA: ${dbErrorMsg}`);
        }

        if (orderData?.eta_minutes) {
          console.debug(`ETA loaded from database: ${orderData.eta_minutes} minutes`);
          setEta({
            eta_minutes: orderData.eta_minutes,
            distance_miles: 0,
            last_updated: orderData.eta_updated_at || new Date().toISOString()
          });
        } else {
          console.debug(`Order ${orderId} has no ETA data yet`);
        }
      }
    } catch (error: any) {
      let errorMsg = 'Unknown ETA calculation error';
      if (typeof error === 'object' && error !== null) {
        if ('message' in error) {
          errorMsg = error.message;
        } else {
          try {
            errorMsg = JSON.stringify(error);
          } catch {
            errorMsg = Object.prototype.toString.call(error);
          }
        }
      } else if (error) {
        errorMsg = String(error);
      }
      console.error(`ETA calculation error for order ${orderId}:`, errorMsg);

      // Silent fail - ETA is optional
      setEta(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!orderId) return;

    let channel: any = null;
    let subscriptionFailed = false;

    try {
      // Subscribe to courier location updates for this order
      channel = supabase
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
            if (updated.eta_minutes !== undefined && updated.eta_minutes !== null) {
              setEta(prev => ({
                ...prev,
                eta_minutes: updated.eta_minutes,
                last_updated: updated.eta_updated_at || new Date().toISOString()
              } as ETAData));
            }
          }
        )
        .on('system', { event: 'CHANNEL_ERROR' }, (err) => {
          subscriptionFailed = true;
          const errorMsg = err?.error?.message || err?.message || String(err) || 'Unknown subscription error';
          console.error('ETA tracking channel error:', errorMsg);
        })
        .on('system', { event: 'TIMED_OUT' }, () => {
          console.warn('ETA tracking channel timed out, will fall back to polling');
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.debug('ETA tracking subscription established');
          } else if (status === 'CHANNEL_ERROR') {
            subscriptionFailed = true;
            console.error('ETA tracking subscription failed to connect');
          } else if (status === 'CLOSED') {
            console.debug('ETA tracking subscription closed');
          }
        });
    } catch (subscriptionError: any) {
      subscriptionFailed = true;
      const errorMsg = subscriptionError?.message || String(subscriptionError) || 'Failed to subscribe to ETA updates';
      console.error('Error setting up ETA tracking subscription:', errorMsg);
    }

    // Initial ETA calculation - only if we have coordinates
    // Otherwise just set up the realtime listener
    // calculateETA(); // Skip initial calc if no courier location available

    // Recalculate every 5 minutes (reduced frequency for better performance)
    // This acts as a fallback if realtime subscription fails
    const interval = setInterval(() => calculateETA(), 300000);

    return () => {
      if (channel) {
        supabase.removeChannel(channel).catch((err: any) => {
          console.debug('Error removing ETA tracking channel:', err?.message || String(err));
        });
      }
      clearInterval(interval);
    };
  }, [orderId]);

  return {
    eta,
    loading,
    recalculate: calculateETA
  };
};
