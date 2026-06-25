import { z } from 'zod';

export const AsinSchema = z
  .string()
  .length(10, 'ASIN must be exactly 10 characters')
  .regex(/^[A-Z0-9]{10}$/, 'ASIN must be uppercase letters and numbers only');

export const MarketplaceSchema = z.enum(['com', 'co.uk', 'de', 'ca', 'com.au']);

export const CreateBookSchema = z.object({
  asin: AsinSchema,
  title: z.string().min(2).max(200),
  subtitle: z.string().max(300).optional(),
  author: z.string().min(2).max(150),
  description: z.string().max(5000).optional(),
  custom_description: z.string().max(10000).optional(),
  cover_image_url: z.string().url().optional(),
  affiliate_tag: z.string().min(3).max(50),
  marketplace: MarketplaceSchema.default('com'),
  price_usd: z.number().positive().optional(),
  page_count: z.number().int().positive().optional(),
  published_date: z.string().optional(),
  language: z.string().default('English'),
  categories: z.array(z.string()).max(5).default([]),
  tags: z.array(z.string()).max(10).default([]),
  is_featured: z.boolean().default(false),
  is_published: z.boolean().default(true),
  related_blog_slug: z.string().optional(),
  related_merch_id: z.string().uuid().optional(),
  sort_order: z.number().int().default(0),
  seo_title: z.string().max(60).optional(),
  seo_description: z.string().max(160).optional(),
  seo_keywords: z.array(z.string()).max(15).optional(),
  og_image_url: z.string().url().optional(),
  focus_keyword: z.string().max(100).optional(),
  google_category: z.string().max(200).optional(),
});

export const UpdateBookSchema = CreateBookSchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateBookInput = z.infer<typeof CreateBookSchema>;
export type UpdateBookInput = z.infer<typeof UpdateBookSchema>;
