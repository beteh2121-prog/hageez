'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { CreateBookSchema, type CreateBookInput } from '@/lib/validations/books';
import { useMutateBook } from '@/hooks/useBooks';
import SeoEditor from '@/components/admin/SeoEditor';
import FormField, { inputClass } from '@/components/admin/forms/FormField';
import TagInput from '@/components/admin/forms/TagInput';
import type { KdpBook } from '@/types';

interface BookFormProps {
  initialData: KdpBook | null;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FetchAsinResponse {
  manualEntryRequired?: boolean;
  message?: string;
  title?: string;
  author?: string;
  coverUrl?: string;
  priceUsd?: number;
  pageCount?: number;
  publishedDate?: string;
}

export default function BookForm({ initialData, onClose, onSuccess }: BookFormProps) {
  const { createBook, updateBook } = useMutateBook();
  const [fetchingAsin, setFetchingAsin] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateBookInput>({
    resolver: zodResolver(CreateBookSchema),
    defaultValues: initialData
      ? {
          asin: initialData.asin,
          title: initialData.title,
          subtitle: initialData.subtitle ?? undefined,
          author: initialData.author,
          description: initialData.description ?? undefined,
          custom_description: initialData.custom_description ?? undefined,
          cover_image_url: initialData.cover_image_url ?? undefined,
          affiliate_tag: initialData.affiliate_tag,
          marketplace: initialData.marketplace,
          price_usd: initialData.price_usd ?? undefined,
          page_count: initialData.page_count ?? undefined,
          published_date: initialData.published_date ?? undefined,
          language: initialData.language,
          categories: initialData.categories,
          tags: initialData.tags,
          is_featured: initialData.is_featured,
          is_published: initialData.is_published,
          related_blog_slug: initialData.related_blog_slug ?? undefined,
          related_merch_id: initialData.related_merch_id ?? undefined,
          sort_order: initialData.sort_order,
          seo_title: initialData.seo_title ?? undefined,
          seo_description: initialData.seo_description ?? undefined,
          seo_keywords: initialData.seo_keywords ?? undefined,
          og_image_url: initialData.og_image_url ?? undefined,
          focus_keyword: initialData.focus_keyword ?? undefined,
        }
      : {
          marketplace: 'com',
          language: 'English',
          is_featured: false,
          is_published: true,
          sort_order: 0,
          affiliate_tag: process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG ?? '',
          categories: [],
          tags: [],
        },
  });

  const asin = watch('asin');
  const coverImageUrl = watch('cover_image_url');
  const categories = watch('categories') ?? [];
  const tags = watch('tags') ?? [];
  const isValidAsin = /^[A-Z0-9]{10}$/.test(asin ?? '');

  async function fetchFromAmazon() {
    setFetchingAsin(true);
    try {
      const res = await fetch('/api/admin/books/fetch-asin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asin }),
      });
      const result = (await res.json()) as FetchAsinResponse;

      if (result.manualEntryRequired) {
        toast.message(result.message ?? 'Please enter book details manually.');
        return;
      }

      if (result.title) setValue('title', result.title);
      if (result.author) setValue('author', result.author);
      if (result.coverUrl) setValue('cover_image_url', result.coverUrl);
      if (result.priceUsd) setValue('price_usd', result.priceUsd);
      if (result.pageCount) setValue('page_count', result.pageCount);
      if (result.publishedDate) setValue('published_date', result.publishedDate);
    } catch {
      toast.error('Could not reach the Amazon lookup endpoint');
    } finally {
      setFetchingAsin(false);
    }
  }

  async function onSubmit(data: CreateBookInput) {
    try {
      if (initialData) {
        await updateBook.mutateAsync({ id: initialData.id, ...data });
        toast.success('Book updated');
      } else {
        await createBook.mutateAsync(data);
        toast.success('Book created');
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex items-end gap-2">
        <FormField label="ASIN" error={errors.asin?.message} className="flex-1">
          <input {...register('asin')} className={inputClass} />
        </FormField>
        <button
          type="button"
          disabled={!isValidAsin || fetchingAsin}
          onClick={fetchFromAmazon}
          className="btn-secondary h-fit disabled:opacity-50"
        >
          {fetchingAsin ? 'Fetching…' : 'Fetch from Amazon'}
        </button>
      </div>

      <FormField label="Title" error={errors.title?.message}>
        <input {...register('title')} className={inputClass} />
      </FormField>

      <FormField label="Subtitle" error={errors.subtitle?.message}>
        <input {...register('subtitle')} className={inputClass} />
      </FormField>

      <FormField label="Author" error={errors.author?.message}>
        <input {...register('author')} className={inputClass} />
      </FormField>

      <FormField label="Description" error={errors.description?.message}>
        <textarea {...register('description')} rows={3} className={inputClass} />
      </FormField>

      <FormField label="Custom Description" error={errors.custom_description?.message}>
        <textarea {...register('custom_description')} rows={3} className={inputClass} />
      </FormField>

      <FormField label="Cover Image URL" error={errors.cover_image_url?.message}>
        <div className="flex items-center gap-3">
          <input {...register('cover_image_url')} className={inputClass + ' mt-0 flex-1'} />
          {coverImageUrl && (
            <Image
              src={coverImageUrl}
              alt="Cover preview"
              width={40}
              height={60}
              className="rounded-brand object-cover"
            />
          )}
        </div>
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Affiliate Tag" error={errors.affiliate_tag?.message}>
          <input {...register('affiliate_tag')} className={inputClass} />
        </FormField>
        <FormField label="Marketplace" error={errors.marketplace?.message}>
          <select {...register('marketplace')} className={inputClass}>
            <option value="com">amazon.com</option>
            <option value="co.uk">amazon.co.uk</option>
            <option value="de">amazon.de</option>
            <option value="ca">amazon.ca</option>
            <option value="com.au">amazon.com.au</option>
          </select>
        </FormField>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <FormField label="Price (USD)" error={errors.price_usd?.message}>
          <input type="number" step="0.01" {...register('price_usd', { valueAsNumber: true })} className={inputClass} />
        </FormField>
        <FormField label="Page Count" error={errors.page_count?.message}>
          <input type="number" {...register('page_count', { valueAsNumber: true })} className={inputClass} />
        </FormField>
        <FormField label="Published Date" error={errors.published_date?.message}>
          <input type="date" {...register('published_date')} className={inputClass} />
        </FormField>
      </div>

      <FormField label="Language" error={errors.language?.message}>
        <input {...register('language')} className={inputClass} />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-charcoal/70">Categories</label>
          <div className="mt-1">
            <TagInput
              values={categories}
              onChange={(values) => setValue('categories', values)}
              max={5}
              placeholder="Add a category…"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-charcoal/70">Tags</label>
          <div className="mt-1">
            <TagInput values={tags} onChange={(values) => setValue('tags', values)} max={10} placeholder="Add a tag…" />
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-charcoal/70">
          <input type="checkbox" {...register('is_featured')} />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm text-charcoal/70">
          <input type="checkbox" {...register('is_published')} />
          Published
        </label>
      </div>

      <FormField label="Related Blog Slug" error={errors.related_blog_slug?.message}>
        <input {...register('related_blog_slug')} className={inputClass} />
      </FormField>

      <FormField label="Sort Order" error={errors.sort_order?.message}>
        <input type="number" {...register('sort_order', { valueAsNumber: true })} className={inputClass} />
      </FormField>

      <SeoEditor register={register} errors={errors} watch={watch} setValue={setValue} />

      <div className="mt-2 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className="btn-primary disabled:opacity-60">
          {initialData ? 'Save Changes' : 'Create Book'}
        </button>
      </div>
    </form>
  );
}
