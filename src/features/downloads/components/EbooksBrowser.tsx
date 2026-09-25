'use client';

import { useState } from 'react';
import { Search, Download as DownloadIcon } from 'lucide-react';
import EbookCard from '@/features/downloads/components/EbookCard';
import type { Download } from '@/types';

interface EbooksBrowserProps {
  ebooks: Download[];
}

export default function EbooksBrowser({ ebooks }: EbooksBrowserProps) {
  const [search, setSearch] = useState('');
  const [showFreeOnly, setShowFreeOnly] = useState(false);

  const filtered = ebooks.filter((ebook) => {
    const query = search.toLowerCase();
    const matchesSearch = !query || ebook.title.toLowerCase().includes(query);
    const matchesFree = !showFreeOnly || ebook.price_cents === 0;
    return matchesSearch && matchesFree;
  });

  return (
    <div>
      <div className="mb-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal/40" />
          <input
            type="text"
            placeholder="Search eBooks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="filter-select w-full pl-9"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFreeOnly((prev) => !prev)}
          className={showFreeOnly ? 'filter-pill active' : 'filter-pill'}
        >
          Free Only
        </button>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((ebook) => (
            <EbookCard key={ebook.id} ebook={ebook} />
          ))}
        </div>
      ) : (
        <div className="py-24 text-center text-charcoal/40">
          <DownloadIcon className="mx-auto mb-4 h-14 w-14 opacity-30" />
          <p className="font-serif text-lg">No eBooks found</p>
        </div>
      )}
    </div>
  );
}
