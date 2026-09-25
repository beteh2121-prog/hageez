'use client';

import { useState } from 'react';
import { Search, BookOpen } from 'lucide-react';
import BookCard from '@/features/books/components/BookCard';
import type { KdpBook } from '@/types';

const LANGUAGES = ['all', 'English', 'Amharic', "Ge'ez", 'Bilingual'];

interface BooksBrowserProps {
  books: KdpBook[];
  categories: string[];
}

export default function BooksBrowser({ books, categories }: BooksBrowserProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [language, setLanguage] = useState('all');

  const filtered = books.filter((book) => {
    const query = search.toLowerCase();
    const matchesSearch =
      !query || book.title.toLowerCase().includes(query) || book.author.toLowerCase().includes(query);
    const matchesCategory = category === 'all' || book.categories.includes(category);
    const matchesLanguage = language === 'all' || book.language === language;
    return matchesSearch && matchesCategory && matchesLanguage;
  });

  return (
    <div>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal/40" />
          <input
            type="text"
            placeholder="Search books or authors…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="filter-select w-full pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="filter-select">
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="filter-select">
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang === 'all' ? 'All Languages' : lang}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="py-24 text-center text-charcoal/40">
          <BookOpen className="mx-auto mb-4 h-14 w-14 opacity-30" />
          <p className="font-serif text-lg">No books found</p>
          <p className="mt-1 text-sm">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
