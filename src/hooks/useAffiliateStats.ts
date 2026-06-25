'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { AffiliateStats } from '@/types';

export function useAffiliateStats() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin', 'affiliate', 'stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('affiliate_stats')
        .select('*')
        .order('total_clicks', { ascending: false });
      if (error) throw error;
      return data as AffiliateStats[];
    },
    staleTime: 60_000,
  });
}
