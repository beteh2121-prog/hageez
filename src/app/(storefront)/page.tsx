import Link from 'next/link';

export default function HomePage() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <h1 className="font-serif text-4xl text-brown sm:text-5xl">
        Rooted in Faith. Crafted with Purpose.
      </h1>
      <p className="max-w-xl text-charcoal/70">
        Ethiopian Orthodox crafts, digital resources, and books — curated with reverence and
        built for the modern faithful.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Link href="/shop" className="btn-primary">
          Shop the Collection
        </Link>
        <Link href="/books" className="btn-secondary">
          Browse Books
        </Link>
      </div>
    </section>
  );
}
