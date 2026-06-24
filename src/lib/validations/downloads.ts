import { z } from 'zod';

export const CreateDownloadSchema = z
  .object({
    title: z.string().min(3).max(100),
    slug: z
      .string()
      .regex(/^[a-z0-9-]+$/)
      .min(3)
      .max(100),
    description: z.string().max(2000).optional(),
    file_path: z.string().min(1),
    file_type: z.enum(['pdf', 'epub', 'mp3', 'video']),
    file_size_bytes: z.number().int().positive().optional(),
    price_cents: z.number().int().min(0).max(10_000_000),
    preview_url: z.string().url().optional(),
    cover_path: z.string().optional(),
    featured: z.boolean().default(false),
    related_merch_id: z.string().uuid().optional(),
    fourthwall_product_id: z.string().optional(),
    seo_title: z.string().max(60).optional(),
    seo_description: z.string().max(160).optional(),
    seo_keywords: z.array(z.string()).max(15).optional(),
    og_image_url: z.string().url().optional().or(z.literal('')),
    focus_keyword: z.string().max(100).optional(),
    google_category: z.string().max(200).optional(),
  })
  .refine((data) => data.price_cents === 0 || !!data.fourthwall_product_id, {
    message: 'Paid downloads require a Fourthwall product ID',
    path: ['fourthwall_product_id'],
  });

export const UpdateDownloadSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(3).max(100).optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .min(3)
    .max(100)
    .optional(),
  description: z.string().max(2000).optional(),
  file_path: z.string().min(1).optional(),
  file_type: z.enum(['pdf', 'epub', 'mp3', 'video']).optional(),
  file_size_bytes: z.number().int().positive().optional(),
  price_cents: z.number().int().min(0).max(10_000_000).optional(),
  preview_url: z.string().url().optional(),
  cover_path: z.string().optional(),
  featured: z.boolean().optional(),
  related_merch_id: z.string().uuid().optional(),
  fourthwall_product_id: z.string().optional(),
  seo_title: z.string().max(60).optional(),
  seo_description: z.string().max(160).optional(),
  seo_keywords: z.array(z.string()).max(15).optional(),
  og_image_url: z.string().url().optional().or(z.literal('')),
  focus_keyword: z.string().max(100).optional(),
  google_category: z.string().max(200).optional(),
});

export type CreateDownloadInput = z.infer<typeof CreateDownloadSchema>;
export type UpdateDownloadInput = z.infer<typeof UpdateDownloadSchema>;
