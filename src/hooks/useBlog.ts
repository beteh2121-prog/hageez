'use client';

import { useQuery } from '@tanstack/react-query';
import { getAllPosts, getPostBySlug, getFeaturedPosts, getAllTags } from '@/lib/sanity/queries';

export function usePosts() {
  return useQuery({
    queryKey: ['posts'],
    queryFn: getAllPosts,
    staleTime: 300_000,
  });
}

export function usePost(slug: string) {
  return useQuery({
    queryKey: ['post', slug],
    queryFn: () => getPostBySlug(slug),
    enabled: !!slug,
  });
}

export function useFeaturedPosts() {
  return useQuery({
    queryKey: ['posts', 'featured'],
    queryFn: getFeaturedPosts,
  });
}

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: getAllTags,
  });
}
