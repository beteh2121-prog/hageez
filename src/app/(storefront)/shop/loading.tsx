export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="h-9 w-64 animate-pulse rounded bg-cream-dark" />
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded-brand-md bg-cream-dark" />
        ))}
      </div>
    </div>
  );
}
