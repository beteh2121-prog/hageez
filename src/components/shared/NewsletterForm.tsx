'use client';

import { toast } from 'sonner';

export default function NewsletterForm() {
  return (
    <form
      className="mt-6 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        toast.success('Newsletter coming soon!');
      }}
    >
      <input
        type="email"
        required
        placeholder="name@example.com"
        className="flex-1 rounded-[2px] border border-brown/15 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
      />
      <button type="submit" className="btn-dark px-5 py-2.5">
        Subscribe
      </button>
    </form>
  );
}
