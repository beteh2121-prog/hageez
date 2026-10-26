import { notFound, permanentRedirect } from 'next/navigation';
import { createStaticClient } from '@/lib/supabase/static';
import { productPath } from '@/lib/fourthwall/routes';

export const dynamic = 'force-dynamic';

/**
 * Old product links (/shop/<uuid>) keep working: they permanently redirect to
 * the Fourthwall-style address, e.g. /USD/product/launch-t-shirt.
 */
export default async function LegacyProductRedirect({ params }: { params: { id: string } }) {
  const { data } = await createStaticClient()
    .from('merch')
    .select('slug')
    .eq('id', params.id)
    .maybeSingle();

  const slug = (data as { slug: string } | null)?.slug;
  if (!slug) notFound();

  permanentRedirect(productPath(slug));
}
