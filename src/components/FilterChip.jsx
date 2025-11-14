/**
 * FilterChip - Interactive pill button for filters and context chips
 */
export default function FilterChip({ label, active = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 rounded-full text-sm font-medium transition-all
        ${active 
          ? 'bg-brand-orange text-white' 
          : 'bg-white text-brand-orange border border-brand-orange hover:bg-brand-orange/5'
        }
      `}
    >
      {label}
    </button>
  );
}

