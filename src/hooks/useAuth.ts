'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useClearCart } from '@/hooks/useCart';
import type { Profile } from '@/types';
import type { LoginInput, SignupInput, UpdateProfileInput } from '@/lib/validations/auth';

export function useSession() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });
}

export function useProfile() {
  const supabase = createClient();
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['profile', session?.user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session!.user.id)
        .single();
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!session?.user.id,
  });
}

export function useSignIn() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const { data, error } = await supabase.auth.signInWithPassword(input);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
    },
  });
}

export function useSignUp() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SignupInput) => {
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: { data: { full_name: input.full_name } },
      });
      if (error) throw error;
      // No separate profiles insert here — the auth.users trigger in
      // supabase/sql/profile_trigger.sql creates the profiles row and
      // reads full_name from this signUp call's user metadata.
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
    },
  });
}

export function useSignOut() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const router = useRouter();
  const clearCart = useClearCart();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      clearCart.mutate();
      queryClient.invalidateQueries({ queryKey: ['session'] });
      router.push('/');
    },
  });
}

export function useUpdateProfile() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(input)
        .eq('id', session!.user.id)
        .select()
        .single();
      if (error) throw error;
      return data as Profile;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['profile', session?.user.id] });
      const previous = queryClient.getQueryData<Profile>(['profile', session?.user.id]);
      if (previous) {
        queryClient.setQueryData(['profile', session?.user.id], { ...previous, ...input });
      }
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['profile', session?.user.id], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', session?.user.id] });
    },
  });
}
