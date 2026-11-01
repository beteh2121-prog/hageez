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
      const res = await fetch('/api/admin/sync/trigger', { method: 'POST' });
      const data = (await res.json().catch(() => null)) as { started?: boolean; error?: string } | null;

      if (!res.ok || !data?.started) {
        toast.error(data?.error ?? `Could not start the sync (HTTP ${res.status}).`);
        return;
      }

      toast.success('Sync started. It takes 1–2 minutes — the lists refresh automatically.');
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
        queryClient.invalidateQueries({ queryKey: ['downloads'] });
        queryClient.invalidateQueries({ queryKey: ['admin', 'downloads'] });
      }, 90_000);
    } catch {
      toast.error('Could not reach the server.');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="max-w-2xl rounded-brand-md border border-gold/10 bg-white p-6 shadow-gold-sm">
      <p className="mb-1 font-serif text-lg text-brown">Catalog Sync</p>
      <p className="mb-4 text-sm text-charcoal/60">
        Pulls your current Fourthwall and Gumroad catalogs into this site. Runs automatically every night
        (on GitHub Actions), or click below to start it right now — useful after adding new products on either
        platform. Progress and errors are shown in the GitHub &quot;Actions&quot; tab.
      </p>

      <p className="mb-4 rounded-brand bg-cream-dark/60 p-3 text-xs text-charcoal/60">
        Every Fourthwall product is synced as physical merch. Every Gumroad product is treated as a digital
        download automatically.
      </p>

      <button
        type="button"
        onClick={runSync}
        disabled={syncing}
        className="btn-primary inline-flex items-center gap-2 disabled:opacity-60"
      >
        <RefreshCw className={cn('h-4 w-4', syncing && 'animate-spin')} />
        {syncing ? 'Starting…' : 'Sync Now'}
      </button>

      {lastResult && (
        <div className="mt-5 flex flex-col gap-3">
          {lastResult.results.map((result) => (
            <div key={result.source} className="rounded-brand border border-gold/10 p-3">
              <p className="text-sm font-medium capitalize text-brown">
                {result.source} — {result.synced} synced
                {result.errors.length > 0 && `, ${result.errors.length} error(s)`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
