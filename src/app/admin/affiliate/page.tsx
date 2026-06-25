'use client';

import { Download as DownloadIcon } from 'lucide-react';
import Breadcrumb from '@/components/admin/Breadcrumb';
import { useAffiliateStats } from '@/hooks/useAffiliateStats';

function exportToCsv(rows: { title: string; asin: string; author: string; total_clicks: number; clicks_7d: number; clicks_30d: number; unique_sessions: number }[]) {
  const header = ['Title', 'ASIN', 'Author', 'Total Clicks', 'Clicks (7d)', 'Clicks (30d)', 'Unique Sessions'];
  const csvRows = [
    header.join(','),
    ...rows.map((row) =>
      [row.title, row.asin, row.author, row.total_clicks, row.clicks_7d, row.clicks_30d, row.unique_sessions]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(',')
    ),
  ];

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `affiliate-stats-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function AdminAffiliatePage() {
  const { data: stats, isLoading } = useAffiliateStats();

  return (
    <div>
      <Breadcrumb items={[{ label: 'Affiliate' }]} />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl text-brown">Affiliate Analytics</h1>
        <button
          type="button"
          disabled={!stats || stats.length === 0}
          onClick={() => stats && exportToCsv(stats)}
          className="btn-secondary inline-flex items-center gap-2 disabled:opacity-50"
        >
          <DownloadIcon className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {isLoading ? (
        <p className="text-charcoal/50">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-brand-md border border-gold/10 bg-white shadow-gold-sm">
          <table className="w-full text-sm">
            <thead className="bg-cream-dark text-left text-charcoal/60">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Author</th>
                <th className="px-4 py-3 font-medium">Total Clicks</th>
                <th className="px-4 py-3 font-medium">7 Days</th>
                <th className="px-4 py-3 font-medium">30 Days</th>
                <th className="px-4 py-3 font-medium">Unique Sessions</th>
              </tr>
            </thead>
            <tbody>
              {(stats ?? []).map((book) => (
                <tr key={book.id} className="border-t border-gold/5">
                  <td className="px-4 py-3">{book.title}</td>
                  <td className="px-4 py-3 text-charcoal/60">{book.author}</td>
                  <td className="px-4 py-3 font-medium text-brown">{book.total_clicks}</td>
                  <td className="px-4 py-3">{book.clicks_7d}</td>
                  <td className="px-4 py-3">{book.clicks_30d}</td>
                  <td className="px-4 py-3">{book.unique_sessions}</td>
                </tr>
              ))}
              {(stats ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-charcoal/50">
                    No affiliate clicks recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
