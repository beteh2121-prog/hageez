'use client';

import { useState } from 'react';
import { Plus, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Breadcrumb from '@/components/admin/Breadcrumb';
import ModalManager, { type ModalType } from '@/components/admin/ModalManager';
import { useAdminDownloads, useMutateDownload } from '@/hooks/useDownloads';
import { formatPrice } from '@/lib/utils/formatPrice';
import type { Download } from '@/types';

export default function AdminDownloadsPage() {
  const { data: downloads, isLoading } = useAdminDownloads();
  const { deleteDownload } = useMutateDownload();
  const [modal, setModal] = useState<{ type: ModalType; data: Download | null } | null>(null);
  const [resendTarget, setResendTarget] = useState<Download | null>(null);
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);

  async function handleResend() {
    if (!resendTarget || !resendEmail) return;
    setResending(true);
    try {
      const res = await fetch('/api/admin/downloads/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ download_id: resendTarget.id, email: resendEmail }),
      });
      const result = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(result.error ?? 'Failed to resend');
        return;
      }
      toast.success(`Resent "${resendTarget.title}" to ${resendEmail}`);
      setResendTarget(null);
      setResendEmail('');
    } catch {
      toast.error('Could not reach the resend endpoint');
    } finally {
      setResending(false);
    }
  }

  return (
    <div>
      <Breadcrumb items={[{ label: 'Downloads' }]} />

      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl text-brown">Downloads</h1>
        <button
          type="button"
          onClick={() => setModal({ type: 'AddDownload', data: null })}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Download
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
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(downloads ?? []).map((download) => {
                const isManual = download.source === 'manual';
                return (
                  <tr key={download.id} className="border-t border-gold/5">
                    <td className="px-4 py-3">{download.title}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          isManual
                            ? 'rounded-full bg-gray-100 px-2 py-1 text-xs capitalize text-gray-600'
                            : 'rounded-full bg-gold/10 px-2 py-1 text-xs capitalize text-gold-dark'
                        }
                      >
                        {download.source}
                      </span>
                    </td>
                    <td className="px-4 py-3 uppercase text-charcoal/60">{download.file_type ?? '—'}</td>
                    <td className="px-4 py-3">{formatPrice(download.price_cents)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        {isManual && (
                          <>
                            <button
                              type="button"
                              onClick={() => setModal({ type: 'EditDownload', data: download })}
                              className="text-sm text-gold hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setResendTarget(download)}
                              aria-label="Resend email"
                              className="text-charcoal/60 hover:text-gold"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {!isManual && <span className="text-xs text-charcoal/40">Managed by sync</span>}
                        <button
                          type="button"
                          onClick={async () => {
                            if (!window.confirm(`Delete "${download.title}"? This cannot be undone.`)) return;
                            try {
                              await deleteDownload.mutateAsync(download.id);
                              toast.success('Download deleted');
                            } catch (err) {
                              toast.error(err instanceof Error ? err.message : 'Failed to delete');
                            }
                          }}
                          aria-label="Delete download"
                          className="text-red-600 hover:underline"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {(downloads ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-charcoal/50">
                    No downloads yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {resendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-brand-md bg-white p-6">
            <p className="font-serif text-lg text-brown">Resend &quot;{resendTarget.title}&quot;</p>
            <input
              type="email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              placeholder="customer@example.com"
              className="mt-4 w-full rounded-brand border border-gold/30 px-3 py-2 text-sm"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setResendTarget(null);
                  setResendEmail('');
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!resendEmail || resending}
                onClick={handleResend}
                className="btn-primary disabled:opacity-60"
              >
                {resending ? 'Sending…' : 'Resend'}
              </button>
            </div>
          </div>
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
