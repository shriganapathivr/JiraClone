import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import { TypeIcon, PriorityIcon, LabelChip } from './Badges.jsx';

// Presentational issue card. Drag wiring is supplied by the parent (board/backlog).
export default function IssueCard({ issue, onClick, dragging = false }) {
  return (
    <motion.div
      layout
      onClick={onClick}
      whileHover={{ y: -2 }}
      className={`card cursor-pointer space-y-2.5 p-3.5 transition-shadow hover:shadow-float ${
        dragging ? 'rotate-2 shadow-float ring-2 ring-accent/40' : ''
      }`}
    >
      <p className="text-sm font-medium leading-snug text-ink line-clamp-3">{issue.title}</p>

      {issue.labels?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {issue.labels.slice(0, 3).map((l) => <LabelChip key={l} label={l} />)}
        </div>
      )}

      <div className="flex items-center justify-between pt-0.5">
        <div className="flex items-center gap-2">
          <TypeIcon type={issue.type} size={13} />
          <span className="font-mono text-xs font-medium text-faint">{issue.key}</span>
          <PriorityIcon priority={issue.priority} size={14} />
        </div>
        <div className="flex items-center gap-2 text-faint">
          {issue.commentCount > 0 && (
            <span className="flex items-center gap-0.5 text-xs">
              <MessageSquare size={12} /> {issue.commentCount}
            </span>
          )}
          {typeof issue.storyPoints === 'number' && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-elevated px-1.5 text-[10px] font-bold text-muted">
              {issue.storyPoints}
            </span>
          )}
          <Avatar user={issue.assignee} size="sm" />
        </div>
      </div>
    </motion.div>
  );
}
