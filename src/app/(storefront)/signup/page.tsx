'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { SignupSchema, type SignupInput } from '@/lib/validations/auth';
import { useSignUp } from '@/hooks/useAuth';

export default function SignupPage() {
  const router = useRouter();
  const signUp = useSignUp();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({ resolver: zodResolver(SignupSchema) });

  async function onSubmit(data: SignupInput) {
    try {
      await signUp.mutateAsync(data);
      router.push('/account');
    } catch {
      // Error is surfaced below via signUp.error.
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
      <h1 className="font-serif text-3xl text-brown">Create Your Account</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <label htmlFor="full_name" className="text-sm text-charcoal/70">
            Full Name
          </label>
          <input
            id="full_name"
            type="text"
            {...register('full_name')}
            className="mt-1 w-full rounded-brand border border-gold/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
          />
          {errors.full_name && <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>}
        </div>

        <div>
          <label htmlFor="email" className="text-sm text-charcoal/70">
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className="mt-1 w-full rounded-brand border border-gold/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="password" className="text-sm text-charcoal/70">
            Password
          </label>
          <input
            id="password"
            type="password"
            {...register('password')}
            className="mt-1 w-full rounded-brand border border-gold/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
          />
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="text-sm text-charcoal/70">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            {...register('confirmPassword')}
            className="mt-1 w-full rounded-brand border border-gold/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        {signUp.isError && (
          <p className="text-sm text-red-600">
            {signUp.error instanceof Error ? signUp.error.message : 'Unable to create account'}
          </p>
        )}

        <button type="submit" disabled={signUp.isPending} className="btn-primary mt-2 disabled:opacity-60">
          {signUp.isPending ? 'Creating account…' : 'Sign Up'}
        </button>
      </form>

      <p className="text-center text-sm text-charcoal/60">
        Already have an account?{' '}
        <Link href="/login" className="text-gold hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
