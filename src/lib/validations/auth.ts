import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const SignupSchema = LoginSchema.extend({
  full_name: z.string().min(2).max(80),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const UpdateProfileSchema = z.object({
  full_name: z.string().min(2).max(80).optional(),
  avatar_url: z.string().url().optional().or(z.literal('')),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type SignupInput = z.infer<typeof SignupSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
