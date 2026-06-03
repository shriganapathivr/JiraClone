import { Search, X } from 'lucide-react';
import { motion } from 'framer-motion';
import Avatar from '../ui/Avatar.jsx';
import { ISSUE_TYPES, PRIORITIES } from '../../lib/constants.js';
import { useProjectStore } from '../../store/projectStore.js';

// Compact, controlled filter toolbar shared by Board and Backlog.
export default function FilterBar({ filters, setFilters, showStatus = false }) {
  const current = useProjectStore((s) => s.current);
  const members = current?.members || [];

  const update = (k, v) => setFilters((f) => ({ ...f, [k]: v }));
  const active =
    filters.search || filters.type || filters.priority || filters.assignee || filters.status;

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
        <input
          value={filters.search || ''}
          onChange={(e) => update('search', e.target.value)}
          placeholder="Search issues…"
          className="input w-56 pl-9"
        />
      </div>

      {/* Assignee avatars as quick toggles */}
      <div className="flex items-center -space-x-1.5">
        {members.map((m) => {
          const on = filters.assignee === m._id;
          return (
            <button
              key={m._id}
              onClick={() => update('assignee', on ? '' : m._id)}
              className={`rounded-full ring-2 transition ${on ? 'ring-accent z-10 scale-110' : 'ring-surface hover:z-10'}`}
              title={`Filter by ${m.name}`}
            >
              <Avatar user={m} size="sm" />
            </button>
          );
        })}
      </div>

      <select className="input w-auto" value={filters.type || ''} onChange={(e) => update('type', e.target.value)}>
        <option value="">All types</option>
        {ISSUE_TYPES.map((t) => <option key={t}>{t}</option>)}
      </select>

      <select className="input w-auto" value={filters.priority || ''} onChange={(e) => update('priority', e.target.value)}>
        <option value="">All priorities</option>
        {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
      </select>

      {active && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setFilters({})}
          className="btn-ghost gap-1 text-xs"
        >
          <X size={14} /> Clear
        </motion.button>
      )}
    </div>
  );
}

// Pure client-side filtering used across views.
export function applyFilters(issues, filters) {
  return issues.filter((i) => {
    if (filters.search && !i.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.type && i.type !== filters.type) return false;
    if (filters.priority && i.priority !== filters.priority) return false;
    if (filters.status && i.status !== filters.status) return false;
    if (filters.assignee && i.assignee?._id !== filters.assignee) return false;
    return true;
  });
}
