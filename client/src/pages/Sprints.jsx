import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Rocket, Play, CheckCircle2, Trash2, Target } from 'lucide-react';
import Topbar from '../components/layout/Topbar.jsx';
import PageTransition from '../components/layout/PageTransition.jsx';
import Modal from '../components/ui/Modal.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import IssueDetailPanel from '../components/issues/IssueDetailPanel.jsx';
import { TypeIcon, PriorityIcon, StatusChip } from '../components/issues/Badges.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import { useProjectData } from '../hooks/useProjectData.js';
import { useProjectStore } from '../store/projectStore.js';
import { toast } from '../store/toastStore.js';
import { formatDate } from '../lib/format.js';
import api from '../lib/api.js';

const STATUS_STYLE = {
  active: { label: 'Active', cls: 'bg-accent-soft text-accent' },
  planned: { label: 'Planned', cls: 'bg-elevated text-muted' },
  completed: { label: 'Completed', cls: 'bg-emerald-500/15 text-emerald-500' },
};

export default function Sprints() {
  const { loaded } = useProjectData();
  const { sprints, issues, current, refreshSprints, refreshIssues } = useProjectStore();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [busy, setBusy] = useState(null);

  const issuesBySprint = useMemo(() => {
    const map = {};
    issues.forEach((i) => {
      const sid = i.sprint?._id || i.sprint;
      if (sid) (map[sid] ||= []).push(i);
    });
    return map;
  }, [issues]);

  const ordered = useMemo(() => {
    const rank = { active: 0, planned: 1, completed: 2 };
    return [...sprints].sort((a, b) => rank[a.status] - rank[b.status]);
  }, [sprints]);

  async function action(id, verb) {
    setBusy(id + verb);
    try {
      await api.post(`/sprints/${id}/${verb}`);
      await Promise.all([refreshSprints(), refreshIssues()]);
      toast.success(verb === 'start' ? 'Sprint started 🚀' : 'Sprint completed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setBusy(null);
    }
  }

  async function onDelete(id) {
    if (!confirm('Delete this sprint? Its issues return to the backlog.')) return;
    try {
      await api.delete(`/sprints/${id}`);
      await Promise.all([refreshSprints(), refreshIssues()]);
      toast.success('Sprint deleted');
    } catch {
      toast.error('Could not delete sprint');
    }
  }

  return (
    <>
      <Topbar title="Sprints">
        <button className="btn-primary" onClick={() => setOpen(true)}>
          <Plus size={16} /> New sprint
        </button>
      </Topbar>

      <PageTransition className="space-y-4 p-6">
        {!loaded ? (
          [...Array(2)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)
        ) : ordered.length === 0 ? (
          <EmptyState
            icon={Rocket}
            title="No sprints yet"
            description="Plan a sprint, fill it with issues from the backlog, then start it to drive your board."
            action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Create sprint</button>}
          />
        ) : (
          <motion.div
            className="space-y-4"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          >
            {ordered.map((sprint) => {
              const list = issuesBySprint[sprint._id] || [];
              const done = list.filter((i) => i.status === 'Done').length;
              const pct = list.length ? Math.round((done / list.length) * 100) : 0;
              const style = STATUS_STYLE[sprint.status];
              return (
                <motion.div
                  key={sprint._id}
                  variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
                  className="card overflow-hidden"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-lg font-semibold">{sprint.name}</h3>
                        <span className={`chip ${style.cls}`}>{style.label}</span>
                      </div>
                      {sprint.goal && (
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                          <Target size={13} /> {sprint.goal}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-faint">
                        {formatDate(sprint.startDate)} → {formatDate(sprint.endDate)} · {list.length} issues
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {sprint.status === 'planned' && (
                        <button className="btn-primary" disabled={busy === sprint._id + 'start'} onClick={() => action(sprint._id, 'start')}>
                          {busy === sprint._id + 'start' ? <Spinner size={15} /> : <><Play size={15} /> Start</>}
                        </button>
                      )}
                      {sprint.status === 'active' && (
                        <button className="btn-outline" disabled={busy === sprint._id + 'complete'} onClick={() => action(sprint._id, 'complete')}>
                          {busy === sprint._id + 'complete' ? <Spinner size={15} /> : <><CheckCircle2 size={15} /> Complete</>}
                        </button>
                      )}
                      <button className="btn-ghost h-9 w-9 rounded-lg p-0 hover:text-red-500" onClick={() => onDelete(sprint._id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="px-4 pt-3">
                    <div className="mb-1 flex justify-between text-xs text-faint">
                      <span>{done}/{list.length} done</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-elevated">
                      <motion.div
                        className="h-full rounded-full bg-accent"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                  </div>

                  {/* Issues */}
                  <div className="p-3">
                    {list.length === 0 ? (
                      <p className="px-2 py-4 text-center text-sm text-faint">
                        No issues — add some from the Backlog.
                      </p>
                    ) : (
                      list.slice(0, 8).map((issue) => (
                        <button
                          key={issue._id}
                          onClick={() => setSelectedId(issue._id)}
                          className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-elevated"
                        >
                          <TypeIcon type={issue.type} size={13} />
                          <span className="font-mono text-xs text-faint">{issue.key}</span>
                          <span className="flex-1 truncate text-sm">{issue.title}</span>
                          <PriorityIcon priority={issue.priority} size={14} />
                          <StatusChip status={issue.status} />
                          <Avatar user={issue.assignee} size="sm" />
                        </button>
                      ))
                    )}
                    {list.length > 8 && (
                      <p className="px-2 pt-1 text-xs text-faint">+{list.length - 8} more…</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </PageTransition>

      <CreateSprintModal open={open} onClose={() => setOpen(false)} projectId={current?._id} onCreated={refreshSprints} />
      <IssueDetailPanel issueId={selectedId} open={!!selectedId} onClose={() => setSelectedId(null)} />
    </>
  );
}

function CreateSprintModal({ open, onClose, projectId, onCreated }) {
  const [form, setForm] = useState({ name: '', goal: '', startDate: '', endDate: '' });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/sprints', { ...form, project: projectId });
      toast.success('Sprint created');
      await onCreated?.();
      onClose();
      setForm({ name: '', goal: '', startDate: '', endDate: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create sprint');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create sprint">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label">Sprint name</label>
          <input className="input" required value={form.name} onChange={set('name')} placeholder="Sprint 2 — Polish" />
        </div>
        <div>
          <label className="label">Goal</label>
          <input className="input" value={form.goal} onChange={set('goal')} placeholder="What should this sprint achieve?" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Start date</label>
            <input type="date" className="input" value={form.startDate} onChange={set('startDate')} />
          </div>
          <div>
            <label className="label">End date</label>
            <input type="date" className="input" value={form.endDate} onChange={set('endDate')} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <Spinner size={16} /> : 'Create sprint'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
