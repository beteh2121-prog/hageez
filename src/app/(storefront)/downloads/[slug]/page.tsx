import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { buildDownloadSeo } from '@/lib/utils/buildSeoMetadata';
import { buildDigitalDocumentSchema } from '@/lib/utils/buildSchemaOrg';
import SchemaScript from '@/components/shared/SchemaScript';
import DownloadCta from '@/features/downloads/components/DownloadCta';
import type { Download } from '@/types';

export const revalidate = 1800;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const FOURTHWALL_STORE_URL = process.env.FOURTHWALL_STORE_URL ?? '';

export async function generateStaticParams() {
  const supabase = await createClient();
  const { data } = await supabase.from('downloads').select('slug');
  return (data ?? []).map((d) => ({ slug: d.slug }));
}

async function getDownload(slug: string): Promise<Download | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('downloads').select('*').eq('slug', slug).single();
  return data as Download | null;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const download = await getDownload(params.slug);
  if (!download) return { title: 'Download not found' };

  const seo = buildDownloadSeo(download, SITE_URL);
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: { canonical: seo.canonicalUrl },
  };
}

export default async function DownloadPage({ params }: { params: { slug: string } }) {
  const download = await getDownload(params.slug);
  if (!download) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <SchemaScript schema={buildDigitalDocumentSchema(download)} />

      <h1 className="font-serif text-3xl text-brown">{download.title}</h1>
      {download.description && <p className="mt-4 text-charcoal/70">{download.description}</p>}

      {download.preview_url && (
        <div className="mt-6 overflow-hidden rounded-brand-md border border-gold/20">
          <iframe src={download.preview_url} title={`Preview of ${download.title}`} className="h-96 w-full" />
        </div>
      )}

      <div className="mt-8">
        <DownloadCta download={download} storeUrl={FOURTHWALL_STORE_URL} />
      </div>
    </div>
  );
}
