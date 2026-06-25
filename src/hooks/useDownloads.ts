'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useSession } from '@/hooks/useAuth';
import type { Download } from '@/types';
import type { CreateDownloadInput, UpdateDownloadInput } from '@/lib/validations/downloads';

export function useDownloads() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['downloads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('downloads')
        .select(
          'id, title, slug, description, file_type, price_cents, preview_url, cover_path, featured, related_merch_id, fourthwall_product_id, created_at, updated_at, seo_title, seo_description, seo_keywords, og_image_url, focus_keyword, google_category'
        )
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Omit<Download, 'file_path' | 'file_size_bytes'>[];
    },
  });
}

export function useFeaturedDownloads() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['downloads', 'featured'],
    queryFn: async () => {
      const { data, error } = await supabase.from('downloads').select('*').eq('featured', true);
      if (error) throw error;
      return data as Download[];
    },
  });
}

export function useDownload(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['download', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('downloads').select('*').eq('id', id).single();
      if (error) throw error;
      return data as Download;
    },
    enabled: !!id,
  });
}

export function useUserPurchases() {
  const supabase = createClient();
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['purchases', session?.user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('download_purchases')
        .select('download_id')
        .eq('user_id', session!.user.id);
      if (error) throw error;
      return data.map((row) => row.download_id).filter((id): id is string => !!id);
    },
    enabled: !!session?.user.id,
  });
}

export function useAdminDownloads() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['admin', 'downloads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('downloads')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Download[];
    },
  });
}

export function useMutateDownload() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const createDownload = useMutation({
    mutationFn: async (input: CreateDownloadInput) => {
      const { data, error } = await supabase.from('downloads').insert(input).select().single();
      if (error) throw error;
      return data as Download;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['downloads'] });
    },
  });

  const updateDownload = useMutation({
    mutationFn: async (input: UpdateDownloadInput) => {
      const { id, ...rest } = input;
      const { data, error } = await supabase.from('downloads').update(rest).eq('id', id).select().single();
      if (error) throw error;
      return data as Download;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['downloads'] });
    },
  });

  const deleteDownload = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('downloads').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['downloads'] });
    },
  });

  return { createDownload, updateDownload, deleteDownload };
}
