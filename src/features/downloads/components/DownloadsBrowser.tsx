'use client';

import { useState } from 'react';
import { Search, Download as DownloadIcon } from 'lucide-react';
import DownloadCard from '@/features/downloads/components/DownloadCard';
import type { Download } from '@/types';

const FILE_TYPES = ['all', 'pdf', 'epub', 'mp3', 'video'];

interface DownloadsBrowserProps {
  downloads: Download[];
}

export default function DownloadsBrowser({ downloads }: DownloadsBrowserProps) {
  const [search, setSearch] = useState('');
  const [fileType, setFileType] = useState('all');
  const [showFreeOnly, setShowFreeOnly] = useState(false);

  const freeCount = downloads.filter((d) => d.price_cents === 0).length;
  const paidCount = downloads.length - freeCount;

  const filtered = downloads.filter((item) => {
    const query = search.toLowerCase();
    const matchesSearch = !query || item.title.toLowerCase().includes(query);
    const matchesType = fileType === 'all' || item.file_type === fileType;
    const matchesFree = !showFreeOnly || item.price_cents === 0;
    return matchesSearch && matchesType && matchesFree;
  });

  return (
    <div>
      <div className="mb-8 grid grid-cols-3 gap-4">
        {[
          { label: 'Total Resources', value: downloads.length },
          { label: 'Free Downloads', value: freeCount },
          { label: 'Premium Titles', value: paidCount },
        ].map((stat) => (
          <div key={stat.label} className="rounded-brand-md border border-gold/10 bg-white p-4 text-center">
            <div className="font-serif text-2xl font-bold text-gold">{stat.value}</div>
            <div className="mt-0.5 text-xs text-charcoal/50">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-8 flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal/40" />
          <input
            type="text"
            placeholder="Search resources…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="filter-select w-full pl-9"
          />
        </div>
        <select value={fileType} onChange={(e) => setFileType(e.target.value)} className="filter-select">
          {FILE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type === 'all' ? 'All File Types' : type.toUpperCase()}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setShowFreeOnly((prev) => !prev)}
          className={showFreeOnly ? 'filter-pill active' : 'filter-pill'}
        >
          Free Only
        </button>
      </div>

      {filtered.length > 0 ? (
        <div className="flex flex-col gap-3">
          {filtered.map((item) => (
            <DownloadCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="py-24 text-center text-charcoal/40">
          <DownloadIcon className="mx-auto mb-4 h-14 w-14 opacity-30" />
          <p className="font-serif text-lg">No resources found</p>
        </div>
      )}
    </div>
  );
}
