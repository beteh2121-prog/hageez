'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useSession } from '@/hooks/useAuth';
import type { Order, OrderStatus } from '@/types';

const PAGE_SIZE = 20;

export function useOrders(page: number = 0) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin', 'orders', page],
    queryFn: async () => {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error, count } = await supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);
      if (error) throw error;
      return { orders: data as Order[], total: count ?? 0 };
    },
  });
}

export function useOrder(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('orders').select('*').eq('id', id).single();
      if (error) throw error;
      return data as Order;
    },
    enabled: !!id,
  });
}

export function useUserOrders() {
  const supabase = createClient();
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['orders', 'mine', session?.user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', session!.user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
    enabled: !!session?.user.id,
  });
}

export function useOrderStats() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin', 'orders', 'stats'],
    queryFn: async () => {
      const { data, error } = await supabase.from('orders').select('status');
      if (error) throw error;

      const counts: Record<OrderStatus, number> = {
        pending: 0,
        paid: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        refunded: 0,
      };

      for (const row of data) {
        counts[row.status as OrderStatus] += 1;
      }

      return counts;
    },
  });
}

export function useMutateOrder() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { error } = await supabase.from('orders').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
  });

  return { updateOrderStatus };
}
