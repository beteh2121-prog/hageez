import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Download, Package, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About',
  description: 'About Ethiopian Orthodox Heritage — our mission and story.',
};

export default function AboutPage() {
  return (
    <div>
      <div className="page-header">
        <div className="mx-auto max-w-7xl">
          <h1 className="font-serif text-4xl font-medium text-cream">About Us</h1>
          <p className="mt-2 text-cream/50">Our mission, our story, and why we built this</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="font-serif text-xl leading-relaxed text-brown">
          Ethiopian Orthodox Heritage is a curated marketplace dedicated to preserving and sharing the rich spiritual tradition of the Ethiopian Orthodox Tewahedo Church.
        </p>
        <p className="mt-6 leading-relaxed text-charcoal/70">
          From the liturgical compositions of St. Yared to the theological depths of the Fetha Negest, Ethiopian Orthodox tradition spans over 1,600 years of continuous Christian faith. We exist to make these resources accessible to the faithful everywhere.
        </p>
        <p className="mt-4 leading-relaxed text-charcoal/70">
          Every product on this site is chosen with reverence. We curate KDP books from serious scholars, partner with Gumroad for instant digital delivery, offer print-on-demand merch through Fourthwall, and host free liturgical resources for those who simply need them.
        </p>

        <div className="my-10 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

        <div className="grid grid-cols-2 gap-5">
          {[
            { icon: BookOpen, title: 'Curated Books', desc: 'Every KDP title is personally reviewed before it is listed.' },
            { icon: Download, title: 'Free Resources', desc: 'Prayers, calendars, and guides — always free.' },
            { icon: Package, title: 'Quality Merch', desc: 'Designs rooted in Ethiopian Orthodox iconography.' },
            { icon: Users, title: 'Community', desc: 'Built for the faithful, wherever they are in the world.' },
          ].map((item) => (
            <div key={item.title} className="rounded-[8px] border border-gold/10 bg-white p-5">
              <item.icon className="h-5 w-5 text-gold" />
              <h3 className="mt-3 font-serif text-base text-brown">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-charcoal/55">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/shop" className="btn-primary px-8 py-3 text-base">Explore the Collection</Link>
        </div>
      </div>
    </div>
  );
}
