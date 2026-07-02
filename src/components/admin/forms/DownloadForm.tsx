'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { CreateDownloadSchema, type CreateDownloadInput } from '@/lib/validations/downloads';
import { useMutateDownload } from '@/hooks/useDownloads';
import { useAdminProducts } from '@/hooks/useMerch';
import { slugify } from '@/lib/utils/slugify';
import SeoEditor from '@/components/admin/SeoEditor';
import FormField, { inputClass } from '@/components/admin/forms/FormField';
import type { Download } from '@/types';

interface DownloadFormProps {
  initialData: Download | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function DownloadForm({ initialData, onClose, onSuccess }: DownloadFormProps) {
  const { createDownload, updateDownload } = useMutateDownload();
  const { data: merchOptions } = useAdminProducts();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateDownloadInput>({
    resolver: zodResolver(CreateDownloadSchema),
    defaultValues: initialData
      ? {
          title: initialData.title,
          slug: initialData.slug,
          description: initialData.description ?? undefined,
          file_path: initialData.file_path ?? '',
          file_type: initialData.file_type ?? 'pdf',
          file_size_bytes: initialData.file_size_bytes ?? undefined,
          price_cents: initialData.price_cents,
          preview_url: initialData.preview_url ?? undefined,
          cover_path: initialData.cover_path ?? undefined,
          featured: initialData.featured,
          related_merch_id: initialData.related_merch_id ?? undefined,
          fourthwall_product_id: initialData.fourthwall_product_id ?? undefined,
          seo_title: initialData.seo_title ?? undefined,
          seo_description: initialData.seo_description ?? undefined,
          seo_keywords: initialData.seo_keywords ?? undefined,
          og_image_url: initialData.og_image_url ?? undefined,
          focus_keyword: initialData.focus_keyword ?? undefined,
          google_category: initialData.google_category ?? undefined,
        }
      : { file_type: 'pdf', price_cents: 0, featured: false },
  });

  const title = watch('title');
  const priceCents = watch('price_cents');

  useEffect(() => {
    if (!initialData && title) {
      setValue('slug', slugify(title));
    }
  }, [title, initialData, setValue]);

  async function onSubmit(data: CreateDownloadInput) {
    setFormError(null);
    try {
      if (initialData) {
        await updateDownload.mutateAsync({ id: initialData.id, ...data });
        toast.success('Download updated');
      } else {
        await createDownload.mutateAsync(data);
        toast.success('Download created');
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setFormError(message);
      toast.error(message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <FormField label="Title" error={errors.title?.message}>
        <input {...register('title')} className={inputClass} />
      </FormField>

      <FormField label="Slug" error={errors.slug?.message}>
        <input {...register('slug')} className={inputClass} />
      </FormField>

      <FormField label="Description" error={errors.description?.message}>
        <textarea {...register('description')} rows={3} className={inputClass} />
      </FormField>

      <FormField label="Storage Path" error={errors.file_path?.message} hint="Path inside the private 'downloads' bucket">
        <input {...register('file_path')} placeholder="downloads/my-file.pdf" className={inputClass} />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="File Type" error={errors.file_type?.message}>
          <select {...register('file_type')} className={inputClass}>
            <option value="pdf">PDF</option>
            <option value="epub">EPUB</option>
            <option value="mp3">MP3</option>
            <option value="video">Video</option>
          </select>
        </FormField>
        <FormField label="File Size (bytes)" error={errors.file_size_bytes?.message}>
          <input type="number" {...register('file_size_bytes', { valueAsNumber: true })} className={inputClass} />
        </FormField>
      </div>

      <FormField label="Price (USD)" error={errors.price_cents?.message} hint="Leave as $0.00 for a free download">
        <input
          type="number"
          step="0.01"
          min="0"
          defaultValue={initialData ? (initialData.price_cents / 100).toFixed(2) : '0.00'}
          onChange={(e) => setValue('price_cents', Math.round(Number(e.target.value) * 100))}
          className={inputClass}
        />
      </FormField>

      <FormField label="Preview URL" error={errors.preview_url?.message}>
        <input {...register('preview_url')} className={inputClass} />
      </FormField>

      <FormField label="Cover Path" error={errors.cover_path?.message}>
        <input {...register('cover_path')} className={inputClass} />
      </FormField>

      <label className="flex items-center gap-2 text-sm text-charcoal/70">
        <input type="checkbox" {...register('featured')} />
        Featured
      </label>

      <FormField label="Related Merch" error={errors.related_merch_id?.message}>
        <select {...register('related_merch_id')} className={inputClass}>
          <option value="">None</option>
          {merchOptions?.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        label="Fourthwall Product ID"
        error={errors.fourthwall_product_id?.message}
        hint={priceCents > 0 ? 'Required if price > $0' : undefined}
      >
        <input {...register('fourthwall_product_id')} className={inputClass} />
      </FormField>

      <SeoEditor register={register} errors={errors} watch={watch} setValue={setValue} />

      {formError && <p className="text-sm text-red-600">{formError}</p>}

      <div className="mt-2 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className="btn-primary disabled:opacity-60">
          {initialData ? 'Save Changes' : 'Create Download'}
        </button>
      </div>
    </form>
  );
}
