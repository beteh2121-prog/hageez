import { notFound, redirect } from 'next/navigation';
import { isKnownCurrency } from '@/lib/fourthwall/routes';

/** /USD on its own isn't a page — send shoppers to the shop. */
export default function CurrencyIndexPage({ params }: { params: { currency: string } }) {
  if (!isKnownCurrency(params.currency)) notFound();
  redirect('/shop');
}
