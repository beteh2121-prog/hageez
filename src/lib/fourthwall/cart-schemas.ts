import { z } from 'zod';
import { CART_MAX_LINE_QUANTITY } from '@/lib/fourthwall/cart-types';

export const VariantIdSchema = z
  .string()
  .min(8)
  .max(64)
  .regex(/^[A-Za-z0-9-]+$/, 'Invalid variant id');

export const CartMutationSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('add'),
    variantId: VariantIdSchema,
    quantity: z.number().int().min(1).max(CART_MAX_LINE_QUANTITY).default(1),
  }),
  z.object({
    action: z.literal('set'),
    variantId: VariantIdSchema,
    quantity: z.number().int().min(0).max(CART_MAX_LINE_QUANTITY),
  }),
  z.object({
    action: z.literal('remove'),
    variantId: VariantIdSchema,
  }),
]);

export const CheckoutRequestSchema = z.object({
  variantId: VariantIdSchema.optional(),
  quantity: z.number().int().min(1).max(CART_MAX_LINE_QUANTITY).default(1),
});

export type CartMutationInput = z.infer<typeof CartMutationSchema>;
