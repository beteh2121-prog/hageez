interface SectionHeaderProps {
  label?: string;
  title: string;
  subtitle?: string;
  className?: string;
}

export default function SectionHeader({ label, title, subtitle, className }: SectionHeaderProps) {
  return (
    <div className={className}>
      {label && (
        <span className="mb-2 block text-xs uppercase tracking-[0.3em] text-gold">{label}</span>
      )}
      <h2 className="font-serif text-3xl font-bold text-brown md:text-4xl">{title}</h2>
      <div className="gold-rule mb-4 mt-3" />
      {subtitle && <p className="max-w-2xl text-charcoal/60">{subtitle}</p>}
    </div>
  );
}
