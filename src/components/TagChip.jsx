/**
 * TagChip - Small pill-shaped badge for genres, streaming services, etc.
 */
export default function TagChip({ label, variant = 'default' }) {
  const variants = {
    default: 'bg-brand-bg text-brand-text-body',
    genre: 'bg-brand-purple/10 text-brand-purple',
    service: 'bg-brand-orange/10 text-brand-orange',
  };

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${variants[variant]}`}>
      {label}
    </span>
  );
}

