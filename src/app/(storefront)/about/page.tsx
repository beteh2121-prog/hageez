import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import NewsletterForm from '@/components/shared/NewsletterForm';

export const metadata: Metadata = {
  title: 'About',
  description: 'About Ethiopian Orthodox Heritage — our mission and story.',
};

const OFFERINGS = [
  {
    icon: '📚',
    title: 'Physical Books (Amazon KDP)',
    desc: 'Our books are published through Amazon KDP and available on Amazon. Purchasing via our affiliate links supports this ministry at no extra cost to you.',
    href: '/books',
    cta: 'Browse Books',
  },
  {
    icon: '📱',
    title: 'eBooks & Digital Downloads',
    desc: 'PDF and ePub editions available for immediate download. Free and premium titles covering theology, liturgy, prayers, saints, and more.',
    href: '/ebooks',
    cta: 'Browse eBooks',
  },
  {
    icon: '🎁',
    title: 'Free Resources',
    desc: 'A growing library of free downloads: prayer guides, liturgical calendars, study materials — all freely available to the community.',
    href: '/downloads',
    cta: 'Free Downloads',
  },
  {
    icon: '👕',
    title: 'Orthodox Merch (Fourthwall)',
    desc: 'Faith-inspired print-on-demand apparel and accessories — t-shirts, mugs, tote bags, and more — produced and shipped by Fourthwall.',
    href: '/shop',
    cta: 'Shop Merch',
  },
];

export default function AboutPage() {
  return (
    <div>
      <section className="bg-brown-dark px-6 py-24 text-center text-cream">
        <span className="text-xs uppercase tracking-[0.3em] text-gold">Our Story</span>
        <h1 className="mt-3 font-serif text-4xl font-bold md:text-6xl">About Ethiopian Orthodox Heritage</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-cream/70">
          A ministry dedicated to preserving and sharing Ethiopian Orthodox Tewahedo Christianity through
          literature, digital resources, and faith-inspired goods.
        </p>
      </section>

      <div className="mx-auto max-w-4xl space-y-16 px-6 py-16">
        <section>
          <h2 className="font-serif text-3xl font-bold text-brown">Our Mission</h2>
          <div className="gold-rule mb-6 mt-3" />
          <div className="space-y-4 text-charcoal/70">
            <p>
              Ethiopian Orthodox Heritage was founded to make the rich theological heritage of the Ethiopian
              Orthodox Tewahedo Church accessible to believers and seekers around the world. We curate,
              publish, and distribute books, eBooks, and digital resources rooted in ancient Orthodox
              Christianity.
            </p>
            <p>
              We offer physical books through our Amazon affiliate program, eBooks for direct download via
              Gumroad, print-on-demand merch through Fourthwall, and a growing library of free spiritual
              resources.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-3xl font-bold text-brown">What We Offer</h2>
          <div className="gold-rule mb-8 mt-3" />
          <div className="grid gap-6 md:grid-cols-2">
            {OFFERINGS.map((item) => (
              <div key={item.title} className="rounded-brand-md border border-gold/10 bg-white p-6">
                <span className="mb-3 block text-3xl">{item.icon}</span>
                <h3 className="mb-2 font-serif text-lg font-semibold text-brown">{item.title}</h3>
                <p className="mb-4 text-sm leading-relaxed text-charcoal/60">{item.desc}</p>
                <Link href={item.href} className="btn-secondary gap-1 text-xs">
                  {item.cta} <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-brand-md border border-amber-200 bg-amber-50 p-6">
          <h3 className="mb-2 font-serif font-semibold text-amber-900">Affiliate Disclosure</h3>
          <p className="text-sm leading-relaxed text-amber-800">
            Ethiopian Orthodox Heritage participates in the Amazon Associates Program. When you purchase
            physical books through our Amazon links, we earn a small commission at no additional cost to
            you. This helps fund our mission to create free resources for the Orthodox community.
          </p>
        </section>

        <section className="rounded-brand-md bg-cream-dark/60 p-10 text-center">
          <h2 className="mb-2 font-serif text-2xl font-bold text-brown">Join Our Community</h2>
          <p className="mb-6 text-sm text-charcoal/60">
            Get new book releases, free downloads, and spiritual reflections in your inbox.
          </p>
          <div className="flex justify-center">
            <NewsletterForm />
          </div>
        </section>
      </div>
    </div>
  );
}
