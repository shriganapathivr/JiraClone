import { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import Spinner from '../ui/Spinner.jsx';
import Avatar from '../ui/Avatar.jsx';
import { TypeIcon } from './Badges.jsx';
import { ISSUE_TYPES, STATUSES, PRIORITIES } from '../../lib/constants.js';
import { useProjectStore } from '../../store/projectStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { toast } from '../../store/toastStore.js';
import api from '../../lib/api.js';

const EMPTY = {
  title: '',
  description: '',
  type: 'Task',
  status: 'To Do',
  priority: 'Medium',
  assignee: '',
  storyPoints: '',
  labels: '',
};

export default function CreateIssueModal({ open, onClose, defaultStatus, defaultSprint }) {
  const { current, upsertIssue } = useProjectStore();
  const user = useAuthStore((s) => s.user);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const members = current?.members || [];

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post('/issues', {
        title: form.title,
        description: form.description,
        type: form.type,
        status: defaultStatus || form.status,
        priority: form.priority,
        project: current._id,
        assignee: form.assignee || null,
        reporter: user._id,
        storyPoints: form.storyPoints ? Number(form.storyPoints) : null,
        labels: form.labels.split(',').map((l) => l.trim()).filter(Boolean),
        sprint: defaultSprint || null,
      });
      upsertIssue(data);
      toast.success(`Created ${data.key}`);
      setForm(EMPTY);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create issue');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create issue" maxWidth="max-w-xl">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Type</label>
            <div className="flex gap-1.5">
              {ISSUE_TYPES.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setForm({ ...form, type: t })}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-lg border px-1 py-2 text-xs font-semibold transition ${
                    form.type === t ? 'border-accent bg-accent-soft text-accent' : 'border-border text-muted hover:bg-elevated'
                  }`}
                >
                  <TypeIcon type={t} size={14} />
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Priority</label>
            <select className="input" value={form.priority} onChange={set('priority')}>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Title</label>
          <input className="input" required autoFocus value={form.title} onChange={set('title')} placeholder="Short, descriptive summary" />
        </div>

        <div>
          <label className="label">Description (markdown)</label>
          <textarea className="input min-h-[100px] resize-y font-mono text-xs" value={form.description} onChange={set('description')} placeholder="Add details, acceptance criteria…" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {!defaultStatus && (
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={set('status')}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">Assignee</label>
            <select className="input" value={form.assignee} onChange={set('assignee')}>
              <option value="">Unassigned</option>
              {members.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Story points</label>
            <input type="number" min="0" className="input" value={form.storyPoints} onChange={set('storyPoints')} placeholder="—" />
          </div>
          <div>
            <label className="label">Labels (comma separated)</label>
            <input className="input" value={form.labels} onChange={set('labels')} placeholder="frontend, urgent" />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <Spinner size={16} /> : 'Create issue'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
