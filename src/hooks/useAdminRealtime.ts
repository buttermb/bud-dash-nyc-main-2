import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useAdminRealtime(
  table: 'orders' | 'couriers' | 'deliveries',
  onDataChange: () => void,
  enabled: boolean = true
) {
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase.channel(`admin-${table}`);
    channelRef.current = channel;

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table
      },
      (payload) => {
        console.log(`[${table}] Change detected:`, payload.eventType);
        onDataChange();
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[${table}] Realtime subscription established`);
      } else if (status === 'CLOSED') {
        console.log(`[${table}] Realtime subscription closed`);
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, onDataChange, enabled]);

  return {
    isSubscribed: channelRef.current?.state === 'joined'
  };
}
