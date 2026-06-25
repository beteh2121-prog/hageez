'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { DashboardStats, Order } from '@/types';
import { useAffiliateStats } from '@/hooks/useAffiliateStats';

export function useDashboardStats() {
  const supabase = createClient();
  const { data: affiliateStats } = useAffiliateStats();

  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async (): Promise<DashboardStats> => {
      const [ordersRevenue, downloadsRevenue, activeProducts, downloadsSold, recentOrders] = await Promise.all([
        supabase.from('orders').select('total_cents').in('status', ['paid', 'shipped', 'delivered']),
        supabase.from('download_purchases').select('amount_paid_cents'),
        supabase.from('merch').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('download_purchases').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(10),
      ]);

      const ordersTotal = (ordersRevenue.data ?? []).reduce((sum, row) => sum + (row.total_cents ?? 0), 0);
      const downloadsTotal = (downloadsRevenue.data ?? []).reduce(
        (sum, row) => sum + (row.amount_paid_cents ?? 0),
        0
      );

      return {
        totalRevenue: ordersTotal + downloadsTotal,
        activeProducts: activeProducts.count ?? 0,
        downloadsSold: downloadsSold.count ?? 0,
        recentOrders: (recentOrders.data ?? []) as Order[],
        topBooks: affiliateStats ?? [],
      };
    },
    staleTime: 30_000,
  });
}
