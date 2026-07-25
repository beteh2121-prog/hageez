import { createStaticClient } from './static';

export interface SiteSettings {
  name: string;
  description: string;
  logo_text: string;
  logo_icon: string;
}

export interface HeroSettings {
  tagline: string;
  title: string;
  subtitle: string;
  cta_primary_text: string;
  cta_primary_href: string;
  cta_secondary_text: string;
  cta_secondary_href: string;
}

export interface StatItem {
  num: string;
  label: string;
}

export interface TestimonialSettings {
  quote: string;
  attribution: string;
}

export interface FooterSettings {
  tagline: string;
  facebook_url: string;
  instagram_url: string;
  youtube_url: string;
  support_email: string;
}

export interface SitePage {
  id: string;
  title: string;
  slug: string;
  body: string | null;
  published: boolean;
  show_in_nav: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_SITE: SiteSettings = {
  name: 'Ethiopian Orthodox Heritage',
  description: 'Ethiopian Orthodox faith, culture, and crafts.',
  logo_text: 'Ethiopian Orthodox Heritage',
  logo_icon: '✝',
};

export const DEFAULT_HERO: HeroSettings = {
  tagline: 'Ethiopian Orthodox Tewahedo',
  title: 'Rooted in Faith, Crafted with Purpose',
  subtitle: 'A curated marketplace of books, ebooks, merch, and spiritual resources.',
  cta_primary_text: 'Browse Books',
  cta_primary_href: '/books',
  cta_secondary_text: 'Free Downloads',
  cta_secondary_href: '/downloads',
};

export const DEFAULT_STATS: StatItem[] = [
  { num: '240+', label: 'Books & Ebooks' },
  { num: '18', label: 'Free Downloads' },
  { num: '4.9★', label: 'Avg. Rating' },
  { num: '12k+', label: 'Readers' },
];

export const DEFAULT_TESTIMONIAL: TestimonialSettings = {
  quote:
    'This is the most complete collection of Ethiopian Orthodox spiritual resources I have found outside of Ethiopia itself.',
  attribution: '— Reader, Addis Ababa',
};

export const DEFAULT_FOOTER: FooterSettings = {
  tagline:
    'A curated marketplace dedicated to Ethiopian Orthodox Tewahedo literature, theology, crafts, and cultural resources.',
  facebook_url: 'https://facebook.com',
  instagram_url: 'https://instagram.com',
  youtube_url: 'https://youtube.com',
  support_email: 'support@yourdomain.com',
};

export interface AllSiteSettings {
  site: SiteSettings;
  hero: HeroSettings;
  stats: StatItem[];
  testimonial: TestimonialSettings;
  footer: FooterSettings;
}

export async function getAllSettings(): Promise<AllSiteSettings> {
  try {
    const supabase = createStaticClient();
    const { data } = await supabase.from('site_settings').select('key, value');
    const map: Record<string, unknown> = {};
    (data ?? []).forEach((row: { key: string; value: unknown }) => {
      map[row.key] = row.value;
    });
    return {
      site: (map['site'] as SiteSettings) ?? DEFAULT_SITE,
      hero: (map['hero'] as HeroSettings) ?? DEFAULT_HERO,
      stats: (map['stats'] as StatItem[]) ?? DEFAULT_STATS,
      testimonial: (map['testimonial'] as TestimonialSettings) ?? DEFAULT_TESTIMONIAL,
      footer: (map['footer'] as FooterSettings) ?? DEFAULT_FOOTER,
    };
  } catch {
    return {
      site: DEFAULT_SITE,
      hero: DEFAULT_HERO,
      stats: DEFAULT_STATS,
      testimonial: DEFAULT_TESTIMONIAL,
      footer: DEFAULT_FOOTER,
    };
  }
}

export async function getPublishedPages(): Promise<SitePage[]> {
  try {
    const supabase = createStaticClient();
    const { data } = await supabase
      .from('site_pages')
      .select('*')
      .eq('published', true)
      .order('sort_order', { ascending: true });
    return (data ?? []) as SitePage[];
  } catch {
    return [];
  }
}

export async function getPageBySlug(slug: string): Promise<SitePage | null> {
  try {
    const supabase = createStaticClient();
    const { data } = await supabase
      .from('site_pages')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single();
    return data as SitePage | null;
  } catch {
    return null;
  }
}
