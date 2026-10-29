'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';

interface SyncResult {
  source: 'fourthwall' | 'gumroad';
  synced: number;
  errors: string[];
}

interface SyncResponse {
  success: boolean;
  totalSynced: number;
  totalErrors: number;
  results: SyncResult[];
  error?: string;
}

export default function CatalogSyncPanel() {
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResponse | null>(null);
  const queryClient = useQueryClient();

   async function runSync() {
    setSyncing(true);
    setLastResult(null);
    try {
      const res = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sources: ['fourthwall', 'gumroad'] }),
      });

      const text = await res.text();
      let data: SyncResponse | null = null;
      try {
        data = JSON.parse(text) as SyncResponse;
      } catch {
        data = null;
      }

      if (!data) {
        toast.error(`Sync failed (HTTP ${res.status}). Check the Worker logs in Cloudflare.`);
        return;
      }

      if (!res.ok || !data.results) {
        toast.error(data.error ?? `Sync failed (HTTP ${res.status})`);
        return;
      }

      setLastResult(data);

      if (data.totalErrors > 0) {
        toast.message(`Synced ${data.totalSynced} item(s) with ${data.totalErrors} error(s) — see details below.`);
      } else {
        toast.success(`Synced ${data.totalSynced} item(s) successfully.`);
      }

      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['downloads'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'downloads'] });
    } catch {
      toast.error('Could not reach the sync endpoint.');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="max-w-2xl rounded-brand-md border border-gold/10 bg-white p-6 shadow-gold-sm">
      <p className="mb-1 font-serif text-lg text-brown">Catalog Sync</p>
      <p className="mb-4 text-sm text-charcoal/60">
        Pulls your current Fourthwall and Gumroad catalogs into this site. Runs automatically every night, or
        click below to sync right now — useful after adding new products on either platform.
      </p>

      <p className="mb-4 rounded-brand bg-cream-dark/60 p-3 text-xs text-charcoal/60">
        To mark a Fourthwall product as a digital download (instead of physical merch), include{' '}
        <code className="rounded bg-white px-1">[digital]</code> anywhere in its product name on Fourthwall — e.g.
        &quot;Saints of Ethiopia eBook [digital]&quot;. Every Gumroad product is treated as a digital download
        automatically.
      </p>

      <button
        type="button"
        onClick={runSync}
        disabled={syncing}
        className="btn-primary inline-flex items-center gap-2 disabled:opacity-60"
      >
        <RefreshCw className={cn('h-4 w-4', syncing && 'animate-spin')} />
        {syncing ? 'Syncing…' : 'Sync Now'}
      </button>

      {lastResult && (
        <div className="mt-5 flex flex-col gap-3">
          {lastResult.results.map((result) => (
            <div key={result.source} className="rounded-brand border border-gold/10 p-3">
              <p className="text-sm font-medium capitalize text-brown">
                {result.source} — {result.synced} synced
                {result.errors.length > 0 && `, ${result.errors.length} error(s)`}
              </p>
              {result.errors.length > 0 && (
                <ul className="mt-2 flex flex-col gap-1 text-xs text-red-600">
                  {result.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
