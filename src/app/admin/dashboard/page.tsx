'use client';

import Link from 'next/link';
import Breadcrumb from '@/components/admin/Breadcrumb';
import { useDashboardStats } from '@/hooks/useDashboard';
import { formatPrice } from '@/lib/utils/formatPrice';

const STAT_CARD_CLASS = 'rounded-brand-md border border-gold/10 bg-white p-5 shadow-gold-sm';

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <div>
      <Breadcrumb items={[{ label: 'Dashboard' }]} />
      <h1 className="font-serif text-2xl text-brown">Dashboard</h1>

      {isLoading ? (
        <p className="mt-6 text-charcoal/50">Loading…</p>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className={STAT_CARD_CLASS}>
              <p className="text-sm text-charcoal/50">Total Revenue</p>
              <p className="mt-1 font-serif text-2xl text-brown">{formatPrice(stats?.totalRevenue ?? 0)}</p>
            </div>
            <div className={STAT_CARD_CLASS}>
              <p className="text-sm text-charcoal/50">Active Products</p>
              <p className="mt-1 font-serif text-2xl text-brown">{stats?.activeProducts ?? 0}</p>
            </div>
            <div className={STAT_CARD_CLASS}>
              <p className="text-sm text-charcoal/50">Downloads Sold</p>
              <p className="mt-1 font-serif text-2xl text-brown">{stats?.downloadsSold ?? 0}</p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-brand-md border border-gold/10 bg-white p-5 shadow-gold-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-serif text-lg text-brown">Recent Orders</p>
                <Link href="/admin/orders" className="text-sm text-gold hover:underline">
                  View all
                </Link>
              </div>
              {stats?.recentOrders.length ? (
                <ul className="flex flex-col gap-2 text-sm">
                  {stats.recentOrders.map((order) => (
                    <li key={order.id} className="flex items-center justify-between border-b border-gold/5 py-2">
                      <span className="text-charcoal/70">{order.fourthwall_order_id ?? order.id.slice(0, 8)}</span>
                      <span className="capitalize text-charcoal/50">{order.status}</span>
                      <span className="font-medium text-brown">{formatPrice(order.total_cents ?? 0)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-charcoal/50">No orders yet.</p>
              )}
            </div>

            <div className="rounded-brand-md border border-gold/10 bg-white p-5 shadow-gold-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-serif text-lg text-brown">Top Affiliate Books</p>
                <Link href="/admin/affiliate" className="text-sm text-gold hover:underline">
                  View all
                </Link>
              </div>
              {stats?.topBooks.length ? (
                <ul className="flex flex-col gap-2 text-sm">
                  {stats.topBooks.slice(0, 5).map((book) => (
                    <li key={book.id} className="flex items-center justify-between border-b border-gold/5 py-2">
                      <span className="text-charcoal/70">{book.title}</span>
                      <span className="font-medium text-brown">{book.total_clicks} clicks</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-charcoal/50">No affiliate clicks yet.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
