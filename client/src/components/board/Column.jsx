import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import SortableIssueCard from './SortableIssueCard.jsx';
import { STATUS_META } from '../../lib/constants.js';

export default function Column({ status, issues, onCardClick, onAdd, canAdd = true }) {
  const meta = STATUS_META[status];
  const { setNodeRef, isOver } = useDroppable({ id: status, data: { status } });

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: meta.color }} />
          <h3 className="text-xs font-bold uppercase tracking-wide text-muted">{status}</h3>
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-elevated px-1.5 text-[11px] font-bold text-muted">
            {issues.length}
          </span>
        </div>
        {canAdd && (
          <button onClick={() => onAdd(status)} className="rounded-md p-1 text-faint hover:bg-elevated hover:text-accent" title={`Add issue to ${status}`}>
            <Plus size={16} />
          </button>
        )}
      </div>

      <motion.div
        ref={setNodeRef}
        animate={{ backgroundColor: isOver ? meta.tint : 'rgba(0,0,0,0)' }}
        className="flex min-h-[120px] flex-1 flex-col gap-2.5 rounded-xl p-2 transition-colors"
        style={{ outline: isOver ? `2px dashed ${meta.color}` : '2px dashed transparent' }}
      >
        <SortableContext items={issues.map((i) => i._id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence>
            {issues.map((issue) => (
              <SortableIssueCard key={issue._id} issue={issue} onClick={() => onCardClick(issue._id)} />
            ))}
          </AnimatePresence>
        </SortableContext>

        {issues.length === 0 && (
          canAdd ? (
            <button
              onClick={() => onAdd(status)}
              className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border py-6 text-xs text-faint hover:border-accent hover:text-accent"
            >
              Drop or create an issue
            </button>
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border py-6 text-xs text-faint">
              Drop issues here
            </div>
          )
        )}
      </motion.div>
    </div>
  );
}
