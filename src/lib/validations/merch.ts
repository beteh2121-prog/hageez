import { z } from 'zod';

export const MerchImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().min(1),
});

export const CreateMerchSchema = z.object({
  title: z.string().min(3).max(100),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .min(3)
    .max(100),
  description: z.string().max(2000).optional(),
  price_cents: z.number().int().positive().max(10_000_000),
  currency: z.enum(['USD', 'ETB']).default('USD'),
  images: z.array(MerchImageSchema).min(1).max(10),
  tags: z.array(z.string().max(30)).max(10).default([]),
  category: z.string().optional(),
  status: z.enum(['active', 'archived', 'draft']),
  featured: z.boolean().default(false),
  stock_count: z.number().int().positive().optional(),
  seo_title: z.string().max(60).optional(),
  seo_description: z.string().max(160).optional(),
  seo_keywords: z.array(z.string()).max(15).optional(),
  og_image_url: z.string().url().optional().or(z.literal('')),
  focus_keyword: z.string().max(100).optional(),
  google_category: z.string().max(200).optional(),
});

export const UpdateMerchSchema = CreateMerchSchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateMerchInput = z.infer<typeof CreateMerchSchema>;
export type UpdateMerchInput = z.infer<typeof UpdateMerchSchema>;
export type MerchImage = z.infer<typeof MerchImageSchema>;
