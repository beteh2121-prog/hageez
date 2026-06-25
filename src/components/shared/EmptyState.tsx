import { PackageOpen } from 'lucide-react';

export default function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center text-charcoal/50">
      <PackageOpen className="h-10 w-10" />
      <p>{message}</p>
    </div>
  );
}
