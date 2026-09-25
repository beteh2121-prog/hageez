'use client';

import { useState } from 'react';
import { Search, ShoppingBag } from 'lucide-react';
import MerchCard from '@/features/merch/components/MerchCard';
import type { Merch } from '@/types';

interface MerchBrowserProps {
  products: Merch[];
  categories: string[];
}

export default function MerchBrowser({ products, categories }: MerchBrowserProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const filtered = products.filter((product) => {
    const query = search.toLowerCase();
    const matchesSearch = !query || product.title.toLowerCase().includes(query);
    const matchesCategory = category === 'all' || product.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal/40" />
          <input
            type="text"
            placeholder="Search merch…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="filter-select w-full pl-9"
          />
        </div>
        {categories.length > 0 && (
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="filter-select">
            <option value="all">All Types</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        )}
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => (
            <MerchCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="py-24 text-center text-charcoal/40">
          <ShoppingBag className="mx-auto mb-4 h-14 w-14 opacity-30" />
          <p className="font-serif text-lg">No merch found</p>
        </div>
      )}
    </div>
  );
}
