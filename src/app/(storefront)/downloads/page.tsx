import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { FileText, BookOpen, Music, Video, ExternalLink } from 'lucide-react';
import { createStaticClient } from '@/lib/supabase/static';
import { formatPrice } from '@/lib/utils/formatPrice';
import type { Download } from '@/types';

export const revalidate = 1800;
export const metadata: Metadata = {
  title: 'Downloads',
  description: 'Free and paid digital resources — prayers, guides, liturgical texts.',
};

const FILTERS = ['All', 'Free', 'Prayers', 'Calendar', 'Liturgy', 'Guides'];

const FILE_ICON_MAP = {
  pdf: FileText,
  epub: BookOpen,
  mp3: Music,
  video: Video,
};

const ICON_EMOJIS = ['🙏','📅','🎵','📖','✝️','📜','🌿','🕊️'];

async function getDownloads(): Promise<Download[]> {
  const supabase = createStaticClient();
  const { data } = await supabase
    .from('downloads')
    .select('*')
    .order('price_cents', { ascending: true })
    .order('created_at', { ascending: false });
  return (data ?? []) as Download[];
}

export default async function DownloadsPage() {
  const downloads = await getDownloads();

  return (
    <div>
      <div className="page-header">
        <div className="mx-auto max-w-7xl">
          <h1 className="font-serif text-4xl font-medium text-cream">Downloads</h1>
          <p className="mt-2 text-cream/50">Free and paid digital resources — prayers, guides, liturgical texts</p>
        </div>
      </div>

      <div className="filter-bar">
        {FILTERS.map((f) => (
          <button key={f} className={`filter-pill ${f === 'All' ? 'active' : ''}`}>{f}</button>
        ))}
      </div>

      <div className="mx-auto max-w-4xl px-6 py-12">
        {downloads.length > 0 ? (
          <div className="flex flex-col gap-4">
            {downloads.map((dl, i) => {
              const Icon = dl.file_type ? FILE_ICON_MAP[dl.file_type] : FileText;
              return (
                <Link
                  key={dl.id}
                  href={`/downloads/${dl.slug}`}
                  className="group flex gap-5 rounded-[8px] border border-gold/10 bg-white p-5 hover:border-gold/30 transition-colors"
                >
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[8px] bg-gradient-to-br from-gold to-gold-dark text-2xl shadow-gold-sm">
                    {dl.cover_path ? (
                      <Image src={dl.cover_path} alt={dl.title} width={56} height={56} className="h-full w-full rounded-[8px] object-cover" />
                    ) : (
                      ICON_EMOJIS[i % ICON_EMOJIS.length]
                    )}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <h3 className="font-serif text-base font-medium text-brown group-hover:text-gold transition-colors">
                      {dl.title}
                    </h3>
                    {dl.description && (
                      <p className="mt-1 text-sm leading-relaxed text-charcoal/55 line-clamp-2">
                        {dl.description}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {dl.file_type && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-cream-dark px-2.5 py-0.5 text-[11px] text-charcoal/60 uppercase tracking-wide">
                          <Icon className="h-3 w-3" />
                          {dl.file_type}
                        </span>
                      )}
                      {dl.source === 'gumroad' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gold/10 px-2.5 py-0.5 text-[11px] text-gold-dark uppercase tracking-wide">
                          Gumroad
                        </span>
                      )}
                      {dl.price_cents === 0
                        ? <span className="badge-free">Free</span>
                        : <span className="price-text text-sm">{formatPrice(dl.price_cents)}</span>
                      }
                    </div>
                  </div>
                  {dl.source === 'gumroad' && (
                    <ExternalLink className="h-4 w-4 flex-shrink-0 self-center text-charcoal/25" />
                  )}
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {[
              { emoji:'🙏', name:'Daily Prayer Guide', desc:"Morning and evening prayers for the faithful. Includes full Ge'ez text with Amharic and English transliteration.", tags:['PDF','Prayers'], free:true },
              { emoji:'📅', name:'Fasting Calendar 2025', desc:'Complete Ethiopian Orthodox fasting schedule with explanations of each fast\'s significance.', tags:['PDF','Calendar'], free:true },
              { emoji:'🎵', name:'Mezmur Collection Vol. 1', desc:'24 traditional Ethiopian Orthodox hymns with sheet music, notation, and historical notes.', tags:['PDF','Liturgy'], free:false, price:'$9.99' },
              { emoji:'📖', name:"Ge'ez Alphabet Workbook", desc:"Learn the Ethiopic script from scratch. 40 pages with exercises, pronunciation guide, and vocabulary.", tags:['PDF'], free:true },
              { emoji:'✝️', name:'Timkat Ceremony Guide', desc:'Everything you need to know about the Ethiopian Epiphany celebration — history, prayers, and traditions.', tags:['PDF','Holidays'], free:false, price:'$4.99' },
            ].map((item) => (
              <div key={item.name} className="flex gap-5 rounded-[8px] border border-gold/10 bg-white p-5">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[8px] bg-gradient-to-br from-gold to-gold-dark text-2xl shadow-gold-sm">
                  {item.emoji}
                </div>
                <div className="flex-1">
                  <h3 className="font-serif text-base font-medium text-brown">{item.name}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-charcoal/55">{item.desc}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {item.tags.map((tag) => (
                      <span key={tag} className="inline-flex rounded-full bg-cream-dark px-2.5 py-0.5 text-[11px] text-charcoal/60 uppercase tracking-wide">{tag}</span>
                    ))}
                    {item.free
                      ? <span className="badge-free">Free</span>
                      : <span className="price-text text-sm">{item.price}</span>
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
