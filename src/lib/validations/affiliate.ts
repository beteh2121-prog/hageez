import { z } from 'zod';
import { MarketplaceSchema } from './books';

export const AffiliateClickSchema = z.object({
  book_id: z.string().uuid(),
  session_id: z.string().max(100),
  referrer_url: z.string().url().optional(),
  marketplace: MarketplaceSchema.default('com'),
});

export type AffiliateClickInput = z.infer<typeof AffiliateClickSchema>;
