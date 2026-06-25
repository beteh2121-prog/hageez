'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  max?: number;
  placeholder?: string;
}

export default function TagInput({ values, onChange, max = 50, placeholder }: TagInputProps) {
  const [input, setInput] = useState('');

  function addTag() {
    const value = input.trim();
    if (!value || values.length >= max || values.includes(value)) return;
    onChange([...values, value]);
    setInput('');
  }

  function removeTag(value: string) {
    onChange(values.filter((v) => v !== value));
  }

  return (
    <div className="flex flex-wrap gap-2 rounded-brand border border-gold/30 p-2">
      {values.map((value) => (
        <span
          key={value}
          className="flex items-center gap-1 rounded-full bg-gold/15 px-3 py-1 text-xs text-gold-dark"
        >
          {value}
          <button type="button" onClick={() => removeTag(value)} aria-label={`Remove ${value}`}>
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag();
          }
        }}
        placeholder={values.length < max ? placeholder : `Max ${max} reached`}
        disabled={values.length >= max}
        className="min-w-[100px] flex-1 border-none bg-transparent text-sm outline-none disabled:cursor-not-allowed"
      />
    </div>
  );
}
