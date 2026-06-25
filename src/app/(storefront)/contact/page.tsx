export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-serif text-4xl text-brown">Contact Us</h1>
      <p className="mt-6 leading-relaxed text-charcoal/70">
        Questions about an order, a download, or anything else? Reach us at{' '}
        <a href="mailto:support@yourdomain.com" className="text-gold hover:underline">
          support@yourdomain.com
        </a>{' '}
        and we&apos;ll get back to you as soon as possible.
      </p>
    </div>
  );
}
