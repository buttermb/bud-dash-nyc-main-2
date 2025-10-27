import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminRealtime } from './useAdminRealtime';

export interface AdminCourier {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  license_number: string;
  vehicle_type: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_plate?: string;
  is_online: boolean;
  is_active: boolean;
  status: string;
  current_lat?: number;
  current_lng?: number;
  rating?: number;
  completed_deliveries?: number;
  created_at: string;
}

export function useAdminCouriers() {
  const [couriers, setCouriers] = useState<AdminCourier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCouriers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from('couriers')
        .select(`
          id,
          user_id,
          full_name,
          email,
          phone,
          license_number,
          vehicle_type,
          vehicle_make,
          vehicle_model,
          vehicle_plate,
          is_online,
          is_active,
          status,
          current_lat,
          current_lng,
          rating,
          completed_deliveries,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (err) throw err;

      setCouriers(data || []);
    } catch (err: any) {
      console.error('Error fetching couriers:', err);
      setError(err.message || 'Failed to fetch couriers');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchCouriers();
  }, []);

  // Setup realtime subscription
  useAdminRealtime('couriers', fetchCouriers);

  return { couriers, loading, error, refetch: fetchCouriers };
}
