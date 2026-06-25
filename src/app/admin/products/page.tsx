'use client';

import { useState } from 'react';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, Plus, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Breadcrumb from '@/components/admin/Breadcrumb';
import ModalManager, { type ModalType } from '@/components/admin/ModalManager';
import { useAdminProducts, useMutateProduct } from '@/hooks/useMerch';
import { formatPrice } from '@/lib/utils/formatPrice';
import { cn } from '@/lib/utils/cn';
import type { Merch } from '@/types';

export default function AdminProductsPage() {
  const { data: products, isLoading } = useAdminProducts();
  const { deleteProduct, toggleFeatured } = useMutateProduct();
  const [modal, setModal] = useState<{ type: ModalType; data: Merch | null } | null>(null);

  const columns: ColumnDef<Merch>[] = [
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <button type="button" className="flex items-center gap-1" onClick={() => column.toggleSorting()}>
          Title <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
    },
    {
      accessorKey: 'price_cents',
      header: 'Price',
      cell: ({ row }) => formatPrice(row.original.price_cents, row.original.currency),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <span className="capitalize">{row.original.status}</span>,
    },
    {
      accessorKey: 'featured',
      header: 'Featured',
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => toggleFeatured.mutate({ id: row.original.id, featured: !row.original.featured })}
          aria-label="Toggle featured"
        >
          <Star className={cn('h-4 w-4', row.original.featured ? 'fill-gold text-gold' : 'text-charcoal/30')} />
        </button>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setModal({ type: 'EditMerch', data: row.original })}
            className="text-sm text-gold hover:underline"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={async () => {
              if (!window.confirm(`Delete "${row.original.title}"? This cannot be undone.`)) return;
              try {
                await deleteProduct.mutateAsync(row.original.id);
                toast.success('Product deleted');
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Failed to delete');
              }
            }}
            className="text-sm text-red-600 hover:underline"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: products ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div>
      <Breadcrumb items={[{ label: 'Products' }]} />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl text-brown">Products</h1>
        <button
          type="button"
          onClick={() => setModal({ type: 'AddMerch', data: null })}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {isLoading ? (
        <p className="text-charcoal/50">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-brand-md border border-gold/10 bg-white shadow-gold-sm">
          <table className="w-full text-sm">
            <thead className="bg-cream-dark text-left text-charcoal/60">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-4 py-3 font-medium">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-t border-gold/5">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
              {table.getRowModel().rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-charcoal/50">
                    No products yet.
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
