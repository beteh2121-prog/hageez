import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="mb-6 flex items-center gap-2 text-sm text-charcoal/50">
      <Link href="/admin/dashboard" className="hover:text-gold">
        Admin
      </Link>
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-2">
          <ChevronRight className="h-3 w-3" />
          {item.href ? (
            <Link href={item.href} className="hover:text-gold">
              {item.label}
            </Link>
          ) : (
            <span className="text-charcoal/80">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
