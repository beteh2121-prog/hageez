'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, Trash2, Save } from 'lucide-react';
import Breadcrumb from '@/components/admin/Breadcrumb';
import { createClient } from '@/lib/supabase/client';
import { inputClass } from '@/components/admin/forms/FormField';
import {
  DEFAULT_SITE, DEFAULT_HERO, DEFAULT_STATS, DEFAULT_TESTIMONIAL, DEFAULT_FOOTER,
  type SiteSettings, type HeroSettings, type StatItem,
  type TestimonialSettings, type FooterSettings,
} from '@/lib/supabase/settings';

interface FormValues {
  site: SiteSettings;
  hero: HeroSettings;
  stats: StatItem[];
  testimonial: TestimonialSettings;
  footer: FooterSettings;
}

const SECTION_CLASS = 'rounded-[8px] border border-gold/10 bg-white p-6 shadow-gold-sm';
const LABEL_CLASS = 'block text-sm font-medium text-charcoal/70 mb-1';

async function loadSettings(): Promise<FormValues> {
  const supabase = createClient();
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
}

export default function SiteSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { register, control, handleSubmit, reset } = useForm<FormValues>();
  const { fields: statFields, append: appendStat, remove: removeStat } = useFieldArray({
    control,
    name: 'stats',
  });

  useEffect(() => {
    loadSettings().then((s) => {
      reset(s);
      setLoading(false);
    });
  }, [reset]);

  async function onSubmit(data: FormValues) {
    setSaving(true);
    const supabase = createClient();
    const entries = [
      { key: 'site', value: data.site },
      { key: 'hero', value: data.hero },
      { key: 'stats', value: data.stats },
      { key: 'testimonial', value: data.testimonial },
      { key: 'footer', value: data.footer },
    ];
    const { error } = await supabase.from('site_settings').upsert(entries, { onConflict: 'key' });
    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Settings saved! Changes will appear on the site within 5 minutes.');
    }
  }

  if (loading) {
    return <div className="p-6 text-charcoal/50">Loading settings…</div>;
  }

  return (
    <div>
      <Breadcrumb items={[{ label: 'Site Settings' }]} />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl text-brown">Site Settings</h1>
        <button
          type="button"
          onClick={handleSubmit(onSubmit)}
          disabled={saving}
          className="btn-primary inline-flex items-center gap-2 disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving…' : 'Save All Changes'}
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">

        <div className={SECTION_CLASS}>
          <h2 className="mb-4 font-serif text-lg text-brown">General</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Site Name</label>
              <input {...register('site.name')} className={inputClass} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Site Description</label>
              <input {...register('site.description')} className={inputClass} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Logo Text</label>
              <input {...register('site.logo_text')} className={inputClass} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Logo Icon (emoji or symbol)</label>
              <input {...register('site.logo_icon')} className={inputClass} placeholder="✝" />
            </div>
          </div>
        </div>

        <div className={SECTION_CLASS}>
          <h2 className="mb-4 font-serif text-lg text-brown">Hero Section</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className={LABEL_CLASS}>Tagline (small text above title)</label>
              <input {...register('hero.tagline')} className={inputClass} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Main Title</label>
              <input {...register('hero.title')} className={inputClass} />
              <p className="mt-1 text-xs text-charcoal/40">
                Include the word &quot;Faith&quot; if you want it highlighted in gold.
              </p>
            </div>
            <div>
              <label className={LABEL_CLASS}>Subtitle / Description</label>
              <textarea {...register('hero.subtitle')} rows={3} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASS}>Primary Button Text</label>
                <input {...register('hero.cta_primary_text')} className={inputClass} />
              </div>
              <div>
                <label className={LABEL_CLASS}>Primary Button Link</label>
                <input {...register('hero.cta_primary_href')} className={inputClass} placeholder="/books" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASS}>Secondary Button Text</label>
                <input {...register('hero.cta_secondary_text')} className={inputClass} />
              </div>
              <div>
                <label className={LABEL_CLASS}>Secondary Button Link</label>
                <input {...register('hero.cta_secondary_href')} className={inputClass} placeholder="/downloads" />
              </div>
            </div>
          </div>
        </div>

        <div className={SECTION_CLASS}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-lg text-brown">Stats Bar</h2>
            <button
              type="button"
              onClick={() => appendStat({ num: '', label: '' })}
              className="btn-secondary inline-flex items-center gap-1 text-sm"
            >
              <Plus className="h-3.5 w-3.5" /> Add Stat
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {statFields.map((field, i) => (
              <div key={field.id} className="flex gap-2">
                <input {...register(`stats.${i}.num`)} placeholder="240+" className={`${inputClass} w-24`} />
                <input {...register(`stats.${i}.label`)} placeholder="Books & Ebooks" className={inputClass} />
                <button type="button" onClick={() => removeStat(i)} className="text-red-500 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {statFields.length === 0 && (
              <p className="text-sm text-charcoal/40">No stats yet — click &quot;Add Stat&quot; to add one.</p>
            )}
          </div>
        </div>

        <div className={SECTION_CLASS}>
          <h2 className="mb-4 font-serif text-lg text-brown">Testimonial</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className={LABEL_CLASS}>Quote</label>
              <textarea {...register('testimonial.quote')} rows={3} className={inputClass} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Attribution (e.g. — Reader, Addis Ababa)</label>
              <input {...register('testimonial.attribution')} className={inputClass} />
            </div>
          </div>
        </div>

        <div className={SECTION_CLASS}>
          <h2 className="mb-4 font-serif text-lg text-brown">Footer</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className={LABEL_CLASS}>Tagline</label>
              <textarea {...register('footer.tagline')} rows={2} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASS}>Facebook URL</label>
                <input {...register('footer.facebook_url')} className={inputClass} />
              </div>
              <div>
                <label className={LABEL_CLASS}>Instagram URL</label>
                <input {...register('footer.instagram_url')} className={inputClass} />
              </div>
              <div>
                <label className={LABEL_CLASS}>YouTube URL</label>
                <input {...register('footer.youtube_url')} className={inputClass} />
              </div>
              <div>
                <label className={LABEL_CLASS}>Support Email</label>
                <input {...register('footer.support_email')} className={inputClass} type="email" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pb-6">
          <button type="submit" disabled={saving} className="btn-primary inline-flex items-center gap-2 disabled:opacity-60">
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save All Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
