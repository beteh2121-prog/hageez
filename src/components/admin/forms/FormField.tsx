import { cn } from '@/lib/utils/cn';

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

export const inputClass =
  'mt-1 w-full rounded-brand border border-gold/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold';

export default function FormField({ label, error, hint, className, children }: FormFieldProps) {
  return (
    <div className={cn(className)}>
      <label className="text-sm font-medium text-charcoal/70">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-charcoal/50">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
