import type { Metadata } from 'next';
import { createStaticClient } from '@/lib/supabase/static';
import SectionHeader from '@/components/shared/SectionHeader';
import MerchBrowser from '@/features/merch/components/MerchBrowser';
import type { Merch } from '@/types';

export const revalidate = 3600;
export const metadata: Metadata = {
  title: 'Merch',
  description: 'Ethiopian Orthodox print-on-demand products via Fourthwall.',
};

async function getMerch(): Promise<Merch[]> {
  const supabase = createStaticClient();
  const { data } = await supabase
    .from('merch')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  return (data ?? []) as Merch[];
}

export default async function ShopPage() {
  const products = await getMerch();
  const categories = Array.from(
    new Set(products.map((p) => p.category).filter((c): c is string => !!c))
  ).sort();

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <SectionHeader
        label="Print on Demand via Fourthwall"
        title="Orthodox Merch"
        subtitle="Faith-inspired apparel and accessories. Each purchase is fulfilled and shipped by Fourthwall."
        className="mb-10"
      />

      <MerchBrowser products={products} categories={categories} />
    </div>
  );
}
