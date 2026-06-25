'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { CreateMerchSchema, type CreateMerchInput } from '@/lib/validations/merch';
import { useMutateProduct } from '@/hooks/useMerch';
import { slugify } from '@/lib/utils/slugify';
import SeoEditor from '@/components/admin/SeoEditor';
import FormField, { inputClass } from '@/components/admin/forms/FormField';
import TagInput from '@/components/admin/forms/TagInput';
import type { Merch } from '@/types';

interface MerchFormProps {
  initialData: Merch | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function MerchForm({ initialData, onClose, onSuccess }: MerchFormProps) {
  const { createProduct, updateProduct } = useMutateProduct();
  const [imageRows, setImageRows] = useState<{ url: string; alt: string }[]>(
    initialData?.images && initialData.images.length > 0 ? initialData.images : [{ url: '', alt: '' }]
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateMerchInput>({
    resolver: zodResolver(CreateMerchSchema),
    defaultValues: initialData
      ? {
          title: initialData.title,
          slug: initialData.slug,
          description: initialData.description ?? undefined,
          price_cents: initialData.price_cents,
          currency: initialData.currency === 'ETB' ? 'ETB' : 'USD',
          images: initialData.images,
          tags: initialData.tags,
          category: initialData.category ?? undefined,
          status: initialData.status,
          featured: initialData.featured,
          stock_count: initialData.stock_count ?? undefined,
          seo_title: initialData.seo_title ?? undefined,
          seo_description: initialData.seo_description ?? undefined,
          seo_keywords: initialData.seo_keywords ?? undefined,
          og_image_url: initialData.og_image_url ?? undefined,
          focus_keyword: initialData.focus_keyword ?? undefined,
          google_category: initialData.google_category ?? undefined,
        }
      : { status: 'active', currency: 'USD', featured: false, images: [], tags: [] },
  });

  const title = watch('title');
  const tags = watch('tags') ?? [];

  useEffect(() => {
    if (!initialData && title) {
      setValue('slug', slugify(title));
    }
  }, [title, initialData, setValue]);

  function updateImageRow(index: number, field: 'url' | 'alt', value: string) {
    setImageRows((prev) => {
      const next = prev.map((row, i) => (i === index ? { ...row, [field]: value } : row));
      setValue('images', next.filter((row) => row.url && row.alt));
      return next;
    });
  }

  function addImageRow() {
    setImageRows((prev) => [...prev, { url: '', alt: '' }]);
  }

  function removeImageRow(index: number) {
    setImageRows((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setValue('images', next.filter((row) => row.url && row.alt));
      return next;
    });
  }

  async function onSubmit(data: CreateMerchInput) {
    try {
      if (initialData) {
        await updateProduct.mutateAsync({ id: initialData.id, ...data });
        toast.success('Product updated');
      } else {
        await createProduct.mutateAsync(data);
        toast.success('Product created');
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
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

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Price (cents)" error={errors.price_cents?.message}>
          <input type="number" {...register('price_cents', { valueAsNumber: true })} className={inputClass} />
        </FormField>
        <FormField label="Currency" error={errors.currency?.message}>
          <select {...register('currency')} className={inputClass}>
            <option value="USD">USD</option>
            <option value="ETB">ETB</option>
          </select>
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Status" error={errors.status?.message}>
          <select {...register('status')} className={inputClass}>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="draft">Draft</option>
          </select>
        </FormField>
        <FormField label="Category" error={errors.category?.message}>
          <input {...register('category')} className={inputClass} />
        </FormField>
      </div>

      <label className="flex items-center gap-2 text-sm text-charcoal/70">
        <input type="checkbox" {...register('featured')} />
        Featured
      </label>

      <FormField label="Stock Count" error={errors.stock_count?.message}>
        <input type="number" {...register('stock_count', { valueAsNumber: true })} className={inputClass} />
      </FormField>

      <div>
        <label className="text-sm font-medium text-charcoal/70">Images</label>
        <div className="mt-1 flex flex-col gap-2">
          {imageRows.map((row, index) => (
            <div key={index} className="flex gap-2">
              <input
                placeholder="Image URL"
                value={row.url}
                onChange={(e) => updateImageRow(index, 'url', e.target.value)}
                className={inputClass + ' mt-0'}
              />
              <input
                placeholder="Alt text"
                value={row.alt}
                onChange={(e) => updateImageRow(index, 'alt', e.target.value)}
                className={inputClass + ' mt-0'}
              />
              <button
                type="button"
                onClick={() => removeImageRow(index)}
                aria-label="Remove image"
                className="text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addImageRow} className="mt-2 text-sm text-gold hover:underline">
          + Add image
        </button>
        {errors.images && <p className="mt-1 text-xs text-red-600">{errors.images.message}</p>}
      </div>

      <div>
        <label className="text-sm font-medium text-charcoal/70">Tags</label>
        <div className="mt-1">
          <TagInput values={tags} onChange={(values) => setValue('tags', values)} max={10} placeholder="Add a tag…" />
        </div>
      </div>

      <SeoEditor register={register} errors={errors} watch={watch} setValue={setValue} />

      <div className="mt-2 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className="btn-primary disabled:opacity-60">
          {initialData ? 'Save Changes' : 'Create Product'}
        </button>
      </div>
    </form>
  );
}
