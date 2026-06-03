import { initials } from '../../lib/format.js';

const SIZES = { xs: 'h-5 w-5 text-[9px]', sm: 'h-7 w-7 text-[11px]', md: 'h-9 w-9 text-xs', lg: 'h-12 w-12 text-sm' };

export default function Avatar({ user, size = 'md', className = '' }) {
  const dim = SIZES[size] || SIZES.md;
  if (!user) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full bg-elevated text-faint font-semibold ring-1 ring-border ${dim} ${className}`}
        title="Unassigned"
      >
        ?
      </span>
    );
  }
  return (
    <span
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden bg-accent/15 text-accent font-bold ring-1 ring-border ${dim} ${className}`}
      title={user.name}
    >
      {user.avatar ? (
        <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
      ) : (
        initials(user.name)
      )}
    </span>
  );
}
