import { NavLink, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Trello, ListOrdered, Rocket, Settings, FolderKanban, Plus } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore.js';

const NAV = [
  { to: 'board', label: 'Board', icon: Trello },
  { to: 'backlog', label: 'Backlog', icon: ListOrdered },
  { to: 'sprints', label: 'Sprints', icon: Rocket },
  { to: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { projectId } = useParams();
  const current = useProjectStore((s) => s.current);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <Link to="/projects" className="flex items-center gap-2.5 px-5 py-4">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent font-display text-lg font-bold text-accent-ink">
          Z
        </div>
        <span className="wordmark text-2xl leading-none">Zira</span>
      </Link>

      <div className="px-3">
        <Link
          to="/projects"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-elevated hover:text-ink"
        >
          <FolderKanban size={18} />
          All projects
        </Link>
      </div>

      {projectId && current && (
        <>
          <div className="mt-4 px-5">
            <div className="flex items-center gap-2.5 rounded-xl bg-elevated px-3 py-2.5">
              <div
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg font-display text-xs font-bold text-accent-ink"
                style={{ background: 'rgb(var(--accent))' }}
              >
                {current.key?.slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{current.name}</p>
                <p className="text-xs text-faint">{current.key}</p>
              </div>
            </div>
          </div>

          <nav className="mt-3 flex-1 space-y-1 px-3">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={`/projects/${projectId}/${to}`}>
                {({ isActive }) => (
                  <span
                    className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive ? 'text-accent' : 'text-muted hover:bg-elevated hover:text-ink'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-lg bg-accent-soft"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    )}
                    <Icon size={18} className="relative z-10" />
                    <span className="relative z-10">{label}</span>
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </>
      )}

      <div className="mt-auto p-4 text-xs text-faint">v1.0 · MERN</div>
    </aside>
  );
}
