'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, BookOpen, Plus, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Breadcrumb from '@/components/admin/Breadcrumb';
import ModalManager, { type ModalType } from '@/components/admin/ModalManager';
import { useAdminBooks, useMutateBook } from '@/hooks/useBooks';
import { cn } from '@/lib/utils/cn';
import type { KdpBook } from '@/types';

export default function AdminBooksPage() {
  const { data: books, isLoading } = useAdminBooks();
  const { deleteBook, togglePublished, toggleFeatured, reorderBooks } = useMutateBook();
  const [modal, setModal] = useState<{ type: ModalType; data: KdpBook | null } | null>(null);

  // Drag-and-drop would need a new dependency (e.g. @dnd-kit) not in the
  // current package.json. Up/down arrows give the same outcome — swap
  // sort_order with the adjacent row — without adding that dependency.
  function moveBook(index: number, direction: -1 | 1) {
    if (!books) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= books.length) return;

    const current = books[index];
    const target = books[targetIndex];
    if (!current || !target) return;

    reorderBooks.mutate([
      { id: current.id, sort_order: target.sort_order },
      { id: target.id, sort_order: current.sort_order },
    ]);
  }

  return (
    <div>
      <Breadcrumb items={[{ label: 'Books' }]} />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl text-brown">Books</h1>
        <button
          type="button"
          onClick={() => setModal({ type: 'AddBook', data: null })}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Book
        </button>
      </div>

      {isLoading ? (
        <p className="text-charcoal/50">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-brand-md border border-gold/10 bg-white shadow-gold-sm">
          <table className="w-full text-sm">
            <thead className="bg-cream-dark text-left text-charcoal/60">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Author</th>
                <th className="px-4 py-3 font-medium">Published</th>
                <th className="px-4 py-3 font-medium">Featured</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(books ?? []).map((book, index) => (
                <tr key={book.id} className="border-t border-gold/5">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => moveBook(index, -1)}
                        disabled={index === 0}
                        aria-label="Move up"
                        className="text-charcoal/50 hover:text-gold disabled:opacity-30"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBook(index, 1)}
                        disabled={index === (books?.length ?? 0) - 1}
                        aria-label="Move down"
                        className="text-charcoal/50 hover:text-gold disabled:opacity-30"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-gold" />
                      {book.title}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-charcoal/60">{book.author}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => togglePublished.mutate({ id: book.id, is_published: !book.is_published })}
                      className={cn(
                        'rounded-full px-2 py-1 text-xs',
                        book.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      )}
                    >
                      {book.is_published ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleFeatured.mutate({ id: book.id, is_featured: !book.is_featured })}
                      aria-label="Toggle featured"
                    >
                      <Star className={cn('h-4 w-4', book.is_featured ? 'fill-gold text-gold' : 'text-charcoal/30')} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setModal({ type: 'EditBook', data: book })}
                        className="text-sm text-gold hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await deleteBook.mutateAsync({ id: book.id, showConfirm: true });
                            toast.success('Book deleted');
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : 'Failed to delete');
                          }
                        }}
                        aria-label="Delete book"
                        className="text-red-600 hover:underline"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {(books ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-charcoal/50">
                    No books yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <ModalManager
          modalType={modal.type}
          initialData={modal.data}
          onClose={() => setModal(null)}
          onSuccess={() => setModal(null)}
        />
      )}
    </div>
  );
}
