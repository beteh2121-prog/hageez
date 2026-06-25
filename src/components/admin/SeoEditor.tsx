'use client';

import * as Accordion from '@radix-ui/react-accordion';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import type { FieldErrors, FieldValues, Path, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { cn } from '@/lib/utils/cn';
import TagInput from '@/components/admin/forms/TagInput';
import { inputClass } from '@/components/admin/forms/FormField';

export interface SeoEditableFields {
  focus_keyword?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  google_category?: string;
  og_image_url?: string;
}

interface SeoEditorProps<T extends FieldValues & SeoEditableFields> {
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  watch: UseFormWatch<T>;
  setValue: UseFormSetValue<T>;
}

function counterColor(length: number, warnAt: number, maxAt: number): string {
  if (length >= maxAt) return 'text-red-600';
  if (length >= warnAt) return 'text-amber-600';
  return 'text-green-700';
}

export default function SeoEditor<T extends FieldValues & SeoEditableFields>({
  register,
  errors,
  watch,
  setValue,
}: SeoEditorProps<T>) {
  const focusKeyword = watch('focus_keyword' as Path<T>) as string | undefined;
  const seoTitle = (watch('seo_title' as Path<T>) as string | undefined) ?? '';
  const seoDescription = (watch('seo_description' as Path<T>) as string | undefined) ?? '';
  const seoKeywords = (watch('seo_keywords' as Path<T>) as string[] | undefined) ?? [];
  const ogImageUrl = watch('og_image_url' as Path<T>) as string | undefined;

  const hasSeo = !!focusKeyword || !!seoTitle || !!seoDescription;
  const fieldErrors = errors as FieldErrors<SeoEditableFields>;

  return (
    <Accordion.Root type="single" collapsible className="mt-6 rounded-brand-md border border-gold/20">
      <Accordion.Item value="seo">
        <Accordion.Trigger className="flex w-full items-center justify-between px-4 py-3 text-left font-serif text-sm uppercase tracking-wide text-brown">
          <span className="flex items-center gap-2">
            SEO &amp; Visibility
            {hasSeo && <span aria-hidden className="h-2 w-2 rounded-full bg-gold" />}
          </span>
          <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
        </Accordion.Trigger>

        <Accordion.Content className="flex flex-col gap-5 border-t border-gold/10 px-4 py-4">
          <div>
            <label className="text-sm font-medium text-charcoal/70">Focus Keyword</label>
            <input {...register('focus_keyword' as Path<T>)} className={inputClass} />
            <p className="mt-1 text-xs text-charcoal/50">
              The single keyword phrase you want this page to rank for in Google. Example: &quot;Ethiopian
              Orthodox Timkat celebration book&quot;
            </p>
            {fieldErrors.focus_keyword && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.focus_keyword.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-charcoal/70">SEO Title</label>
            <input {...register('seo_title' as Path<T>)} className={inputClass} />
            <p className={cn('mt-1 text-xs', counterColor(seoTitle.length, 55, 60))}>
              {seoTitle.length}/60{seoTitle.length >= 60 && ' — Over limit'}
            </p>
            {seoTitle && (
              <div className="mt-2 rounded border border-gray-200 bg-white p-3">
                <p className="truncate text-sm text-blue-700">{seoTitle}</p>
                <p className="text-xs text-green-700">yourdomain.com</p>
              </div>
            )}
            {fieldErrors.seo_title && <p className="mt-1 text-xs text-red-600">{fieldErrors.seo_title.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-charcoal/70">Meta Description</label>
            <textarea {...register('seo_description' as Path<T>)} rows={3} className={inputClass} />
            <p className={cn('mt-1 text-xs', counterColor(seoDescription.length, 140, 160))}>
              {seoDescription.length}/160
            </p>
            {(seoTitle || seoDescription) && (
              <div className="mt-2 rounded border border-gray-200 bg-white p-3">
                <p className="truncate text-sm text-blue-700">{seoTitle || 'Page title'}</p>
                <p className="text-xs text-green-700">yourdomain.com</p>
                <p className="mt-1 text-xs text-charcoal/60">{seoDescription}</p>
              </div>
            )}
            {fieldErrors.seo_description && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.seo_description.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-charcoal/70">SEO Keywords</label>
            <div className="mt-1">
              <TagInput
                values={seoKeywords}
                onChange={(values) => setValue('seo_keywords' as Path<T>, values as never, { shouldDirty: true })}
                max={15}
                placeholder="Type and press Enter…"
              />
            </div>
            <p className="mt-1 text-xs text-charcoal/50">
              Add search phrases like: &quot;ethiopian orthodox books&quot;, &quot;tewahedo liturgy&quot;
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-charcoal/70">Google Category</label>
            <input {...register('google_category' as Path<T>)} className={inputClass} />
            <p className="mt-1 text-xs text-charcoal/50">
              Example: &quot;Media &gt; Books&quot; or &quot;Apparel &gt; T-Shirts&quot;
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-charcoal/70">Custom OG Image URL</label>
            <div className="mt-1 flex items-center gap-3">
              <input {...register('og_image_url' as Path<T>)} className={cn(inputClass, 'mt-0 flex-1')} />
              {ogImageUrl && (
                <Image
                  src={ogImageUrl}
                  alt="OG preview"
                  width={60}
                  height={60}
                  className="rounded-brand object-cover"
                />
              )}
            </div>
            <p className="mt-1 text-xs text-charcoal/50">Overrides product/cover image for social sharing</p>
          </div>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  );
}
