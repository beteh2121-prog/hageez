'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { LoginSchema, type LoginInput } from '@/lib/validations/auth';
import { useSignIn } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const signIn = useSignIn();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(LoginSchema) });

  async function onSubmit(data: LoginInput) {
    try {
      await signIn.mutateAsync(data);
      router.push('/account');
    } catch {
      // Error is surfaced below via signIn.error.
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
      <h1 className="font-serif text-3xl text-brown">Welcome Back</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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

        {signIn.isError && (
          <p className="text-sm text-red-600">
            {signIn.error instanceof Error ? signIn.error.message : 'Unable to sign in'}
          </p>
        )}

        <button type="submit" disabled={signIn.isPending} className="btn-primary mt-2 disabled:opacity-60">
          {signIn.isPending ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-sm text-charcoal/60">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-gold hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
