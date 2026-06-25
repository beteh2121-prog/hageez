'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Merch } from '@/types';
import type { CreateMerchInput, UpdateMerchInput } from '@/lib/validations/merch';

interface ProductFilters {
  tag?: string;
  status?: string;
}

export function useProducts(filters?: ProductFilters) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      let query = supabase.from('merch').select('*').eq('status', 'active');

      if (filters?.tag) {
        query = query.contains('tags', [filters.tag]);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data as Merch[];
    },
    staleTime: 60_000,
  });
}

export function useFeaturedContent() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['featured'],
    queryFn: async () => {
      const { data, error } = await supabase.from('featured_content').select('*');
      if (error) throw error;
      return data;
    },
    staleTime: 120_000,
  });
}

export function useProduct(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('merch').select('*').eq('id', id).single();
      if (error) throw error;
      return data as Merch;
    },
    enabled: !!id,
  });
}

export function useAdminProducts() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin', 'products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('merch')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Merch[];
    },
  });
}

export function useMutateProduct() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const createProduct = useMutation({
    mutationFn: async (input: CreateMerchInput) => {
      const { data, error } = await supabase.from('merch').insert(input).select().single();
      if (error) throw error;
      return data as Merch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const updateProduct = useMutation({
    mutationFn: async (input: UpdateMerchInput) => {
      const { id, ...rest } = input;
      const { data, error } = await supabase.from('merch').update(rest).eq('id', id).select().single();
      if (error) throw error;
      return data as Merch;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['product', input.id] });
      const previous = queryClient.getQueryData<Merch>(['product', input.id]);
      if (previous) {
        queryClient.setQueryData(['product', input.id], { ...previous, ...input });
      }
      return { previous };
    },
    onError: (_err, input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['product', input.id], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('merch').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const toggleFeatured = useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      const { error } = await supabase.from('merch').update({ featured }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  return { createProduct, updateProduct, deleteProduct, toggleFeatured };
}
