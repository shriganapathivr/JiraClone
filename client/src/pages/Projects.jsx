import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, FolderKanban, Trash2, Users } from 'lucide-react';
import Topbar from '../components/layout/Topbar.jsx';
import PageTransition from '../components/layout/PageTransition.jsx';
import Modal from '../components/ui/Modal.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { CardSkeleton } from '../components/ui/Skeleton.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { useProjectStore } from '../store/projectStore.js';
import { useAuthStore } from '../store/authStore.js';
import { toast } from '../store/toastStore.js';
import api from '../lib/api.js';

const GRADIENTS = [
  'linear-gradient(135deg,#8b6dff,#5b3df5)',
  'linear-gradient(135deg,#4c9aff,#2b6fe0)',
  'linear-gradient(135deg,#36b37e,#1f8f63)',
  'linear-gradient(135deg,#ff8a5c,#f0562d)',
  'linear-gradient(135deg,#a368fc,#7a3ff0)',
];

export default function Projects() {
  const navigate = useNavigate();
  const { projects, loadProjects } = useProjectStore();
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadProjects().finally(() => setLoading(false));
  }, [loadProjects]);

  async function onDelete(e, project) {
    e.stopPropagation();
    if (!confirm(`Delete project "${project.name}" and all its issues?`)) return;
    try {
      await api.delete(`/projects/${project._id}`);
      await loadProjects();
      toast.success('Project deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete project');
    }
  }

  return (
    <>
      <Topbar title="Projects">
        <button className="btn-primary" onClick={() => setOpen(true)}>
          <Plus size={16} /> New project
        </button>
      </Topbar>

      <PageTransition className="p-6">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="Create your first project to start tracking issues, planning sprints, and shipping work."
            action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Create project</button>}
          />
        ) : (
          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.06 } } }}
          >
            {projects.map((p, i) => (
              <motion.button
                key={p._id}
                variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => navigate(`/projects/${p._id}/board`)}
                className="card group relative overflow-hidden p-5 text-left"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-xl font-display text-lg font-bold text-white shadow"
                    style={{ background: GRADIENTS[i % GRADIENTS.length] }}
                  >
                    {p.key?.slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-display text-base font-semibold">{p.name}</h3>
                    <p className="text-xs font-medium text-faint">{p.key}</p>
                  </div>
                  {p.owner?._id === user?._id && (
                    <span
                      onClick={(e) => onDelete(e, p)}
                      className="rounded-md p-1.5 text-faint opacity-0 transition hover:bg-elevated hover:text-red-500 group-hover:opacity-100"
                      title="Delete project"
                    >
                      <Trash2 size={15} />
                    </span>
                  )}
                </div>
                <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm text-muted">
                  {p.description || 'No description provided.'}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {(p.members || []).slice(0, 4).map((m) => (
                      <Avatar key={m._id} user={m} size="sm" className="ring-2 ring-surface" />
                    ))}
                  </div>
                  <span className="flex items-center gap-1 text-xs text-faint">
                    <Users size={13} /> {p.members?.length || 0}
                  </span>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </PageTransition>

      <CreateProjectModal open={open} onClose={() => setOpen(false)} onCreated={loadProjects} />
    </>
  );
}

function CreateProjectModal({ open, onClose, onCreated }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', key: '', description: '' });
  const [saving, setSaving] = useState(false);

  function onName(e) {
    const name = e.target.value;
    // Auto-suggest a key from the name until the user edits it themselves.
    setForm((f) => ({
      ...f,
      name,
      key: f.keyTouched ? f.key : name.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase(),
    }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post('/projects', {
        name: form.name,
        key: form.key,
        description: form.description,
      });
      toast.success('Project created');
      await onCreated?.();
      onClose();
      setForm({ name: '', key: '', description: '' });
      navigate(`/projects/${data._id}/board`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create project');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create project">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label">Project name</label>
          <input className="input" required value={form.name} onChange={onName} placeholder="Marketing Website" />
        </div>
        <div>
          <label className="label">Key</label>
          <input
            className="input font-mono uppercase"
            required
            value={form.key}
            maxLength={10}
            onChange={(e) => setForm({ ...form, key: e.target.value.toUpperCase(), keyTouched: true })}
            placeholder="MKT"
          />
          <p className="mt-1 text-xs text-faint">Used to prefix issue IDs, e.g. {form.key || 'MKT'}-1.</p>
        </div>
        <div>
          <label className="label">Description</label>
          <textarea
            className="input min-h-[80px] resize-y"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What is this project about?"
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <Spinner size={16} /> : 'Create project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
