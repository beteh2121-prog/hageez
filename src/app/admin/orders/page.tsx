'use client';

import { Fragment, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Breadcrumb from '@/components/admin/Breadcrumb';
import { useMutateOrder, useOrders } from '@/hooks/useOrders';
import { formatDate } from '@/lib/utils/formatDate';
import { formatPrice } from '@/lib/utils/formatPrice';
import { cn } from '@/lib/utils/cn';
import type { OrderStatus } from '@/types';

const STATUS_OPTIONS: OrderStatus[] = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

const STATUS_BADGE_CLASS: Record<OrderStatus, string> = {
  pending: 'bg-gray-100 text-gray-600',
  paid: 'bg-blue-100 text-blue-700',
  processing: 'bg-amber-100 text-amber-700',
  shipped: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-red-100 text-red-700',
};

export default function AdminOrdersPage() {
  const [page, setPage] = useState(0);
  const { data, isLoading } = useOrders(page);
  const { updateOrderStatus } = useMutateOrder();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <div>
      <Breadcrumb items={[{ label: 'Orders' }]} />
      <h1 className="mb-6 font-serif text-2xl text-brown">Orders</h1>

      {isLoading ? (
        <p className="text-charcoal/50">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-brand-md border border-gold/10 bg-white shadow-gold-sm">
          <table className="w-full text-sm">
            <thead className="bg-cream-dark text-left text-charcoal/60">
              <tr>
                <th className="w-8 px-4 py-3" />
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {(data?.orders ?? []).map((order) => {
                const isExpanded = expandedId === order.id;
                return (
                  <Fragment key={order.id}>
                    <tr className="border-t border-gold/5">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : order.id)}
                          aria-label="Expand order"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-charcoal/50" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-charcoal/50" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">{order.fourthwall_order_id ?? order.id.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-charcoal/60">{formatDate(order.created_at, true)}</td>
                      <td className="px-4 py-3">{formatPrice(order.total_cents ?? 0, order.currency)}</td>
                      <td className="px-4 py-3">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            updateOrderStatus.mutate({ id: order.id, status: e.target.value as OrderStatus })
                          }
                          className={cn('rounded-full border-none px-2 py-1 text-xs', STATUS_BADGE_CLASS[order.status])}
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-t border-gold/5 bg-cream-dark/40">
                        <td />
                        <td colSpan={4} className="px-4 py-4">
                          <div className="grid grid-cols-2 gap-4 text-xs text-charcoal/70">
                            <div>
                              <p className="mb-1 font-medium text-charcoal/80">Shipping Address</p>
                              <pre className="whitespace-pre-wrap font-mono text-[11px]">
                                {order.shipping_address ? JSON.stringify(order.shipping_address, null, 2) : 'N/A'}
                              </pre>
                            </div>
                            <div>
                              <p className="mb-1 font-medium text-charcoal/80">Line Items</p>
                              <pre className="whitespace-pre-wrap font-mono text-[11px]">
                                {order.line_items && order.line_items.length > 0
                                  ? JSON.stringify(order.line_items, null, 2)
                                  : 'N/A'}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {(data?.orders ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-charcoal/50">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-4 text-sm">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="text-gold disabled:opacity-30"
          >
            Previous
          </button>
          <span className="text-charcoal/50">
            Page {page + 1} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="text-gold disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
