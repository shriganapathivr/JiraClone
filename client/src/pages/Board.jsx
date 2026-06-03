import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Plus, Rocket } from 'lucide-react';
import Topbar from '../components/layout/Topbar.jsx';
import PageTransition from '../components/layout/PageTransition.jsx';
import Column from '../components/board/Column.jsx';
import IssueCard from '../components/issues/IssueCard.jsx';
import FilterBar, { applyFilters } from '../components/issues/FilterBar.jsx';
import CreateIssueModal from '../components/issues/CreateIssueModal.jsx';
import IssueDetailPanel from '../components/issues/IssueDetailPanel.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { CardSkeleton } from '../components/ui/Skeleton.jsx';
import { STATUSES } from '../lib/constants.js';
import { useProjectData } from '../hooks/useProjectData.js';
import { useProjectStore } from '../store/projectStore.js';
import { toast } from '../store/toastStore.js';
import api from '../lib/api.js';

export default function Board() {
  const { loaded } = useProjectData();
  const { issues, sprints, setIssues } = useProjectStore();
  const [filters, setFilters] = useState({});
  const [activeId, setActiveId] = useState(null);
  const [createStatus, setCreateStatus] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const activeSprint = sprints.find((s) => s.status === 'active');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // Board shows the active sprint's issues; falls back to all issues if none active.
  const boardIssues = useMemo(() => {
    const base = activeSprint
      ? issues.filter((i) => i.sprint?._id === activeSprint._id || i.sprint === activeSprint._id)
      : issues;
    return applyFilters(base, filters);
  }, [issues, activeSprint, filters]);

  const columns = useMemo(() => {
    const map = Object.fromEntries(STATUSES.map((s) => [s, []]));
    boardIssues.forEach((i) => map[i.status]?.push(i));
    STATUSES.forEach((s) => map[s].sort((a, b) => a.order - b.order));
    return map;
  }, [boardIssues]);

  const activeIssue = activeId ? issues.find((i) => i._id === activeId) : null;

  function findStatusOf(id) {
    const issue = issues.find((i) => i._id === id);
    return issue?.status;
  }

  function onDragStart(e) {
    setActiveId(e.active.id);
  }

  // Live cross-column movement while dragging.
  function onDragOver(e) {
    const { active, over } = e;
    if (!over) return;
    const activeStatus = findStatusOf(active.id);
    const overStatus = STATUSES.includes(over.id) ? over.id : findStatusOf(over.id);
    if (!overStatus || activeStatus === overStatus) return;

    setIssues(
      issues.map((i) => (i._id === active.id ? { ...i, status: overStatus } : i))
    );
  }

  async function onDragEnd(e) {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;

    const overStatus = STATUSES.includes(over.id) ? over.id : findStatusOf(over.id);
    if (!overStatus) return;

    // Reorder within the destination column.
    const colItems = issues
      .filter((i) => i.status === overStatus)
      .sort((a, b) => a.order - b.order);
    const oldIndex = colItems.findIndex((i) => i._id === active.id);
    const overIndex = colItems.findIndex((i) => i._id === over.id);
    const newIndex = overIndex === -1 ? colItems.length - 1 : overIndex;

    const reordered =
      oldIndex === -1 ? colItems : arrayMove(colItems, oldIndex, newIndex);

    // Rebuild the full issues array with fresh order values for this column.
    const orderById = new Map(reordered.map((i, idx) => [i._id, idx]));
    const next = issues.map((i) =>
      orderById.has(i._id)
        ? { ...i, status: overStatus, order: orderById.get(i._id) }
        : i
    );
    setIssues(next);

    // Persist the affected column.
    const updates = reordered.map((i, idx) => ({ id: i._id, status: overStatus, order: idx }));
    try {
      await api.patch('/issues/reorder', { updates });
    } catch {
      toast.error('Could not save board changes');
    }
  }

  return (
    <>
      <Topbar title="Board">
        <button className="btn-primary" onClick={() => setCreateStatus('To Do')}>
          <Plus size={16} /> Create
        </button>
      </Topbar>

      <PageTransition className="flex flex-col p-6">
        {!loaded ? (
          <div className="flex gap-4">
            {STATUSES.map((s) => (
              <div key={s} className="w-72 space-y-2.5">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <FilterBar filters={filters} setFilters={setFilters} />
              {activeSprint ? (
                <span className="chip bg-accent-soft text-accent">
                  <Rocket size={13} /> {activeSprint.name}
                </span>
              ) : (
                <span className="text-xs text-faint">No active sprint — showing all issues</span>
              )}
            </div>

            {boardIssues.length === 0 && !filters.search && !activeSprint ? (
              <EmptyState
                icon={Rocket}
                title="Your board is empty"
                description="Create an issue or start a sprint from the Sprints tab to populate the board."
                action={<button className="btn-primary" onClick={() => setCreateStatus('To Do')}><Plus size={16} /> Create issue</button>}
              />
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
              >
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {STATUSES.map((status) => (
                    <Column
                      key={status}
                      status={status}
                      issues={columns[status]}
                      onCardClick={setSelectedId}
                      onAdd={setCreateStatus}
                    />
                  ))}
                </div>
                <DragOverlay>
                  {activeIssue ? <IssueCard issue={activeIssue} dragging /> : null}
                </DragOverlay>
              </DndContext>
            )}
          </>
        )}
      </PageTransition>

      <CreateIssueModal
        open={!!createStatus}
        onClose={() => setCreateStatus(null)}
        defaultStatus={createStatus}
        defaultSprint={activeSprint?._id || null}
      />
      <IssueDetailPanel issueId={selectedId} open={!!selectedId} onClose={() => setSelectedId(null)} />
    </>
  );
}
