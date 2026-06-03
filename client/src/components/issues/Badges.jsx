import { TYPE_META, PRIORITY_META, STATUS_META } from '../../lib/constants.js';

export function TypeIcon({ type, size = 16 }) {
  const meta = TYPE_META[type] || TYPE_META.Task;
  const Icon = meta.icon;
  return (
    <span
      className="inline-grid place-items-center rounded-md"
      style={{ background: `${meta.color}22`, color: meta.color, width: size + 8, height: size + 8 }}
      title={type}
    >
      <Icon size={size} />
    </span>
  );
}

export function PriorityIcon({ priority, size = 16 }) {
  const meta = PRIORITY_META[priority] || PRIORITY_META.Medium;
  const Icon = meta.icon;
  return (
    <span title={`${priority} priority`} style={{ color: meta.color }} className="inline-flex">
      <Icon size={size} strokeWidth={2.5} />
    </span>
  );
}

export function StatusChip({ status }) {
  const meta = STATUS_META[status] || STATUS_META['To Do'];
  return (
    <span className="chip" style={{ background: meta.tint, color: meta.color }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
      {status}
    </span>
  );
}

export function LabelChip({ label }) {
  return <span className="chip bg-elevated text-muted">{label}</span>;
}
