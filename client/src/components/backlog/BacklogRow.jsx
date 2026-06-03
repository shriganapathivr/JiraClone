import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import { TypeIcon, PriorityIcon, StatusChip } from '../issues/Badges.jsx';

export default function BacklogRow({ issue, onClick, sprints, onMoveToSprint, canManage = true }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: issue._id,
    data: { issue },
  });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-3 border-b border-border px-3 py-2.5 last:border-0 hover:bg-elevated"
    >
      <button {...attributes} {...listeners} className="cursor-grab text-faint opacity-0 group-hover:opacity-100 active:cursor-grabbing">
        <GripVertical size={16} />
      </button>
      <TypeIcon type={issue.type} size={14} />
      <span className="font-mono text-xs font-medium text-faint">{issue.key}</span>
      <button onClick={onClick} className="flex-1 truncate text-left text-sm font-medium hover:text-accent">
        {issue.title}
      </button>
      <PriorityIcon priority={issue.priority} size={15} />
      <div className="hidden sm:block"><StatusChip status={issue.status} /></div>
      {typeof issue.storyPoints === 'number' && (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-elevated px-1.5 text-[10px] font-bold text-muted">
          {issue.storyPoints}
        </span>
      )}
      {canManage && (
        <select
          value={issue.sprint?._id || issue.sprint || ''}
          onChange={(e) => onMoveToSprint(issue, e.target.value || null)}
          onClick={(e) => e.stopPropagation()}
          className="input h-8 w-auto py-0 text-xs"
          title="Move to sprint"
        >
          <option value="">Backlog</option>
          {sprints.filter((s) => s.status !== 'completed').map((s) => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>
      )}
      <Avatar user={issue.assignee} size="sm" />
    </div>
  );
}
