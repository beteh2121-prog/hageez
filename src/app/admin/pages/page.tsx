'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as Dialog from '@radix-ui/react-dialog';
import { Plus, Trash2, X, ExternalLink } from 'lucide-react';
import Breadcrumb from '@/components/admin/Breadcrumb';
import { createClient } from '@/lib/supabase/client';
import { inputClass } from '@/components/admin/forms/FormField';
import { cn } from '@/lib/utils/cn';
import type { SitePage } from '@/lib/supabase/settings';

interface PageFormValues {
  title: string;
  slug: string;
  body: string;
  published: boolean;
  show_in_nav: boolean;
  sort_order: number;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}

export default function AdminPagesPage() {
  const [pages, setPages] = useState<SitePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<SitePage | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, watch, setValue, reset } = useForm<PageFormValues>({
    defaultValues: { title: '', slug: '', body: '', published: false, show_in_nav: false, sort_order: 0 },
  });

  const title = watch('title');

  async function loadPages() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from('site_pages').select('*').order('sort_order', { ascending: true });
    setPages((data ?? []) as SitePage[]);
    setLoading(false);
  }

  useEffect(() => {
    loadPages();
  }, []);

  useEffect(() => {
    if (!editingPage && title) {
      setValue('slug', slugify(title));
    }
  }, [title, editingPage, setValue]);

  function openAddModal() {
    setEditingPage(null);
    reset({ title: '', slug: '', body: '', published: false, show_in_nav: false, sort_order: pages.length });
    setModalOpen(true);
  }

  function openEditModal(page: SitePage) {
    setEditingPage(page);
    reset({
      title: page.title,
      slug: page.slug,
      body: page.body ?? '',
      published: page.published,
      show_in_nav: page.show_in_nav,
      sort_order: page.sort_order,
    });
    setModalOpen(true);
  }

  async function onSubmit(data: PageFormValues) {
    setSaving(true);
    const supabase = createClient();

    if (editingPage) {
      const { error } = await supabase.from('site_pages').update(data).eq('id', editingPage.id);
      setSaving(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Page updated');
    } else {
      const { error } = await supabase.from('site_pages').insert(data);
      setSaving(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Page created');
    }

    setModalOpen(false);
    loadPages();
  }

  async function handleDelete(page: SitePage) {
    if (!window.confirm(`Delete "${page.title}"? This cannot be undone.`)) return;
    const supabase = createClient();
    const { error } = await supabase.from('site_pages').delete().eq('id', page.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Page deleted');
    loadPages();
  }

  async function togglePublished(page: SitePage) {
    const supabase = createClient();
    const { error } = await supabase
      .from('site_pages')
      .update({ published: !page.published })
      .eq('id', page.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    loadPages();
  }

  return (
    <div>
      <Breadcrumb items={[{ label: 'Pages' }]} />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl text-brown">Pages</h1>
        <button type="button" onClick={openAddModal} className="btn-primary inline-flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Page
        </button>
      </div>

      {loading ? (
        <p className="text-charcoal/50">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-brand-md border border-gold/10 bg-white shadow-gold-sm">
          <table className="w-full text-sm">
            <thead className="bg-cream-dark text-left text-charcoal/60">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">URL</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">In Nav</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.id} className="border-t border-gold/5">
                  <td className="px-4 py-3">{page.title}</td>
                  <td className="px-4 py-3">
                    {page.published ? (
                      <a
                        href={`/pages/${page.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-gold hover:underline"
                      >
                        /pages/{page.slug} <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-charcoal/40">/pages/{page.slug}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => togglePublished(page)}
                      className={cn(
                        'rounded-full px-2 py-1 text-xs',
                        page.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      )}
                    >
                      {page.published ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-4 py-3">{page.show_in_nav ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button type="button" onClick={() => openEditModal(page)} className="text-sm text-gold hover:underline">
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDelete(page)} className="text-red-600 hover:underline">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pages.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-charcoal/50">
                    No custom pages yet. Click &quot;Add Page&quot; to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-brand-md bg-white p-6 shadow-gold-md">
            <div className="mb-4 flex items-center justify-between">
              <Dialog.Title className="font-serif text-xl text-brown">
                {editingPage ? 'Edit Page' : 'Add Page'}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button type="button" aria-label="Close" className="text-charcoal/50 hover:text-charcoal">
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-charcoal/70">Title</label>
                <input {...register('title', { required: true })} className={inputClass} />
              </div>

              <div>
                <label className="text-sm font-medium text-charcoal/70">URL Slug</label>
                <input {...register('slug', { required: true })} className={inputClass} />
                <p className="mt-1 text-xs text-charcoal/40">Will appear at yoursite.com/pages/{watch('slug') || 'your-slug'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-charcoal/70">Content (HTML)</label>
                <textarea {...register('body')} rows={10} className={`${inputClass} font-mono text-xs`} placeholder="<p>Write your page content here. Basic HTML tags like &lt;p&gt;, &lt;h2&gt;, &lt;ul&gt;, &lt;a&gt; are supported.</p>" />
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm text-charcoal/70">
                  <input type="checkbox" {...register('published')} />
                  Published (visible to the public)
                </label>
                <label className="flex items-center gap-2 text-sm text-charcoal/70">
                  <input type="checkbox" {...register('show_in_nav')} />
                  Show in navigation menu
                </label>
              </div>

              <div>
                <label className="text-sm font-medium text-charcoal/70">Sort Order</label>
                <input type="number" {...register('sort_order', { valueAsNumber: true })} className={inputClass} />
              </div>

              <div className="mt-2 flex justify-end gap-3">
                <Dialog.Close asChild>
                  <button type="button" className="btn-secondary">Cancel</button>
                </Dialog.Close>
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                  {saving ? 'Saving…' : editingPage ? 'Save Changes' : 'Create Page'}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
