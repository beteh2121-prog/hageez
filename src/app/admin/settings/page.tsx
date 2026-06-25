'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import Breadcrumb from '@/components/admin/Breadcrumb';
import { useProfile, useUpdateProfile } from '@/hooks/useAuth';
import { UpdateProfileSchema, type UpdateProfileInput } from '@/lib/validations/auth';
import { inputClass } from '@/components/admin/forms/FormField';

export default function AdminSettingsPage() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileInput>({ resolver: zodResolver(UpdateProfileSchema) });

  useEffect(() => {
    if (profile) {
      reset({ full_name: profile.full_name ?? '', avatar_url: profile.avatar_url ?? '' });
    }
  }, [profile, reset]);

  async function onSubmit(data: UpdateProfileInput) {
    try {
      await updateProfile.mutateAsync(data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    }
  }

  return (
    <div>
      <Breadcrumb items={[{ label: 'Settings' }]} />
      <h1 className="mb-6 font-serif text-2xl text-brown">Settings</h1>

      <div className="max-w-md rounded-brand-md border border-gold/10 bg-white p-6 shadow-gold-sm">
        <p className="mb-4 font-serif text-lg text-brown">Your Profile</p>

        {isLoading ? (
          <p className="text-sm text-charcoal/50">Loading…</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-charcoal/70">Email</label>
              <input value={profile?.email ?? ''} disabled className={inputClass + ' bg-cream-dark/50'} />
            </div>

            <div>
              <label className="text-sm font-medium text-charcoal/70">Role</label>
              <input value={profile?.role ?? ''} disabled className={inputClass + ' bg-cream-dark/50 capitalize'} />
            </div>

            <div>
              <label className="text-sm font-medium text-charcoal/70">Full Name</label>
              <input {...register('full_name')} className={inputClass} />
              {errors.full_name && <p className="mt-1 text-xs text-red-600">{errors.full_name.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-charcoal/70">Avatar URL</label>
              <input {...register('avatar_url')} className={inputClass} />
              {errors.avatar_url && <p className="mt-1 text-xs text-red-600">{errors.avatar_url.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary mt-2 self-start disabled:opacity-60">
              {isSubmitting ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
