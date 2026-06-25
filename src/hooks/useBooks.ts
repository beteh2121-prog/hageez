'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { KdpBook } from '@/types';
import type { CreateBookInput, UpdateBookInput } from '@/lib/validations/books';

interface BookFilters {
  category?: string;
  tag?: string;
  featured?: boolean;
}

export function useBooks(filters?: BookFilters) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['books', filters],
    queryFn: async () => {
      let query = supabase.from('kdp_books').select('*').eq('is_published', true);

      if (filters?.category) query = query.contains('categories', [filters.category]);
      if (filters?.tag) query = query.contains('tags', [filters.tag]);
      if (filters?.featured !== undefined) query = query.eq('is_featured', filters.featured);

      const { data, error } = await query
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as KdpBook[];
    },
    staleTime: 300_000,
  });
}

export function useFeaturedBooks() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['books', 'featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kdp_books')
        .select('*')
        .eq('is_featured', true)
        .eq('is_published', true)
        .limit(6);
      if (error) throw error;
      return data as KdpBook[];
    },
    staleTime: 600_000,
  });
}

export function useBook(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['book', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('kdp_books').select('*').eq('id', id).single();
      if (error) throw error;
      return data as KdpBook;
    },
    enabled: !!id,
  });
}

export function useBookByAsin(asin: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['book', 'asin', asin],
    queryFn: async () => {
      const { data, error } = await supabase.from('kdp_books').select('*').eq('asin', asin).single();
      if (error) throw error;
      return data as KdpBook;
    },
    enabled: !!asin,
  });
}

export function useAdminBooks() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin', 'books'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kdp_books')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as KdpBook[];
    },
    staleTime: 0,
  });
}

export function useMutateBook() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const createBook = useMutation({
    mutationFn: async (input: CreateBookInput) => {
      const { data, error } = await supabase.from('kdp_books').insert(input).select().single();
      if (error) throw error;
      return data as KdpBook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });

  const updateBook = useMutation({
    mutationFn: async (input: UpdateBookInput) => {
      const { id, ...rest } = input;
      const { data, error } = await supabase.from('kdp_books').update(rest).eq('id', id).select().single();
      if (error) throw error;
      return data as KdpBook;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['book', input.id] });
      const previous = queryClient.getQueryData<KdpBook>(['book', input.id]);
      if (previous) {
        queryClient.setQueryData(['book', input.id], { ...previous, ...input });
      }
      return { previous };
    },
    onError: (_err, input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['book', input.id], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });

  const deleteBook = useMutation({
    mutationFn: async ({ id, showConfirm }: { id: string; showConfirm?: boolean }) => {
      if (showConfirm && typeof window !== 'undefined') {
        const confirmed = window.confirm('Delete this book? This cannot be undone.');
        if (!confirmed) return null;
      }
      const { error } = await supabase.from('kdp_books').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });

  const togglePublished = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase.from('kdp_books').update({ is_published }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });

  const toggleFeatured = useMutation({
    mutationFn: async ({ id, is_featured }: { id: string; is_featured: boolean }) => {
      const { error } = await supabase.from('kdp_books').update({ is_featured }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });

  const reorderBooks = useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      await Promise.all(
        items.map((item) => supabase.from('kdp_books').update({ sort_order: item.sort_order }).eq('id', item.id))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });

  return { createBook, updateBook, deleteBook, togglePublished, toggleFeatured, reorderBooks };
}
