import type { Metadata } from 'next';
import { Mail, MessageSquare } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with Ethiopian Orthodox Heritage.',
};

export default function ContactPage() {
  return (
    <div>
      <div className="page-header">
        <div className="mx-auto max-w-7xl">
          <h1 className="font-serif text-4xl font-medium text-cream">Contact Us</h1>
          <p className="mt-2 text-cream/50">Questions, suggestions, or partnership enquiries</p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="rounded-[8px] border border-gold/10 bg-white p-6">
            <Mail className="h-6 w-6 text-gold" />
            <h3 className="mt-3 font-serif text-lg text-brown">Email</h3>
            <p className="mt-1.5 text-sm text-charcoal/55">For orders, downloads, and general questions.</p>
            <a href="mailto:support@yourdomain.com" className="mt-4 block text-sm text-gold hover:underline">
              support@yourdomain.com
            </a>
          </div>
          <div className="rounded-[8px] border border-gold/10 bg-white p-6">
            <MessageSquare className="h-6 w-6 text-gold" />
            <h3 className="mt-3 font-serif text-lg text-brown">Partnerships</h3>
            <p className="mt-1.5 text-sm text-charcoal/55">Authors, publishers, and content creators.</p>
            <a href="mailto:hello@yourdomain.com" className="mt-4 block text-sm text-gold hover:underline">
              hello@yourdomain.com
            </a>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-charcoal/50">
          We typically respond within 24–48 hours.
        </p>
      </div>
    </div>
  );
}
