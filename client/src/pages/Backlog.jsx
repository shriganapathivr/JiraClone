import { useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, ListOrdered } from 'lucide-react';
import Topbar from '../components/layout/Topbar.jsx';
import PageTransition from '../components/layout/PageTransition.jsx';
import FilterBar, { applyFilters } from '../components/issues/FilterBar.jsx';
import CreateIssueModal from '../components/issues/CreateIssueModal.jsx';
import IssueDetailPanel from '../components/issues/IssueDetailPanel.jsx';
import BacklogRow from '../components/backlog/BacklogRow.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import { useProjectData } from '../hooks/useProjectData.js';
import { useProjectStore } from '../store/projectStore.js';
import { useAuthStore } from '../store/authStore.js';
import { toast } from '../store/toastStore.js';
import api from '../lib/api.js';

export default function Backlog() {
  const { loaded } = useProjectData();
  const { issues, sprints, setIssues, upsertIssue } = useProjectStore();
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');
  const [filters, setFilters] = useState({});
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // Backlog = issues not assigned to any sprint, ordered.
  const backlog = useMemo(() => {
    const base = issues.filter((i) => !i.sprint).sort((a, b) => a.order - b.order);
    return applyFilters(base, filters);
  }, [issues, filters]);

  const totalPoints = backlog.reduce((sum, i) => sum + (i.storyPoints || 0), 0);

  async function onDragEnd(e) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = backlog.findIndex((i) => i._id === active.id);
    const newIndex = backlog.findIndex((i) => i._id === over.id);
    const reordered = arrayMove(backlog, oldIndex, newIndex);

    const orderById = new Map(reordered.map((i, idx) => [i._id, idx]));
    setIssues(issues.map((i) => (orderById.has(i._id) ? { ...i, order: orderById.get(i._id) } : i)));

    try {
      await api.patch('/issues/reorder', {
        updates: reordered.map((i, idx) => ({ id: i._id, order: idx })),
      });
    } catch {
      toast.error('Could not save order');
    }
  }

  async function onMoveToSprint(issue, sprintId) {
    try {
      const { data } = await api.put(`/issues/${issue._id}`, { sprint: sprintId });
      upsertIssue(data);
      toast.success(sprintId ? 'Moved to sprint' : 'Moved to backlog');
    } catch {
      toast.error('Could not move issue');
    }
  }

  return (
    <>
      <Topbar title="Backlog">
        {isAdmin && (
          <button className="btn-primary" onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Create
          </button>
        )}
      </Topbar>

      <PageTransition className="p-6">
        <div className="mb-5"><FilterBar filters={filters} setFilters={setFilters} /></div>

        {!loaded ? (
          <div className="card space-y-2 p-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : backlog.length === 0 ? (
          <EmptyState
            icon={ListOrdered}
            title="Backlog is empty"
            description="Issues without a sprint live here."
            action={isAdmin ? <button className="btn-primary" onClick={() => setCreateOpen(true)}><Plus size={16} /> Create issue</button> : null}
          />
        ) : (
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="font-display text-sm font-semibold">
                Backlog <span className="text-faint">· {backlog.length} issues</span>
              </h3>
              <span className="chip bg-elevated text-muted">{totalPoints} pts</span>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={backlog.map((i) => i._id)} strategy={verticalListSortingStrategy}>
                <div>
                  {backlog.map((issue) => (
                    <BacklogRow
                      key={issue._id}
                      issue={issue}
                      sprints={sprints}
                      canManage={isAdmin}
                      onClick={() => setSelectedId(issue._id)}
                      onMoveToSprint={onMoveToSprint}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </PageTransition>

      <CreateIssueModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <IssueDetailPanel issueId={selectedId} open={!!selectedId} onClose={() => setSelectedId(null)} />
    </>
  );
}
