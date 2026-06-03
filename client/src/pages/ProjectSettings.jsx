import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Save, Trash2, UserPlus, X } from 'lucide-react';
import Topbar from '../components/layout/Topbar.jsx';
import PageTransition from '../components/layout/PageTransition.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import { useProjectData } from '../hooks/useProjectData.js';
import { useProjectStore } from '../store/projectStore.js';
import { useAuthStore } from '../store/authStore.js';
import { toast } from '../store/toastStore.js';
import api from '../lib/api.js';

export default function ProjectSettings() {
  const { loaded } = useProjectData();
  const navigate = useNavigate();
  const { current, selectProject, loadProjects } = useProjectStore();
  const user = useAuthStore((s) => s.user);
  const [form, setForm] = useState({ name: '', description: '' });
  const [members, setMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [saving, setSaving] = useState(false);

  const isOwner = current?.owner?._id === user?._id;

  useEffect(() => {
    if (current) {
      setForm({ name: current.name, description: current.description || '' });
      setMembers(current.members || []);
    }
  }, [current]);

  useEffect(() => {
    api.get('/users').then(({ data }) => setAllUsers(data)).catch(() => {});
  }, []);

  async function onSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/projects/${current._id}`, {
        name: form.name,
        description: form.description,
        members: members.map((m) => m._id),
      });
      await Promise.all([selectProject(current._id), loadProjects()]);
      toast.success('Project saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  function addMember(id) {
    const u = allUsers.find((x) => x._id === id);
    if (u && !members.some((m) => m._id === id)) setMembers([...members, u]);
  }

  function removeMember(id) {
    if (id === current.owner._id) return; // owner stays
    setMembers(members.filter((m) => m._id !== id));
  }

  async function onDelete() {
    if (!confirm(`Delete "${current.name}" and everything in it? This cannot be undone.`)) return;
    try {
      await api.delete(`/projects/${current._id}`);
      await loadProjects();
      toast.success('Project deleted');
      navigate('/projects');
    } catch {
      toast.error('Could not delete project');
    }
  }

  if (!loaded || !current) {
    return (
      <>
        <Topbar title="Settings" />
        <PageTransition className="grid place-items-center p-20"><Spinner size={28} /></PageTransition>
      </>
    );
  }

  const candidates = allUsers.filter((u) => !members.some((m) => m._id === u._id));

  return (
    <>
      <Topbar title="Project settings" />
      <PageTransition className="mx-auto max-w-2xl space-y-5 p-6">
        <form onSubmit={onSave} className="card space-y-4 p-5">
          <h3 className="font-display text-base font-semibold">Details</h3>
          <div>
            <label className="label">Project name</label>
            <input className="input" disabled={!isOwner} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Key</label>
            <input className="input font-mono" value={current.key} disabled />
            <p className="mt-1 text-xs text-faint">The project key is fixed once created.</p>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-[90px] resize-y" disabled={!isOwner} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          {isOwner && (
            <div className="flex justify-end">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? <Spinner size={16} /> : <><Save size={16} /> Save changes</>}
              </button>
            </div>
          )}
        </form>

        <div className="card space-y-3 p-5">
          <h3 className="font-display text-base font-semibold">Members</h3>
          <div className="space-y-2">
            {members.map((m) => (
              <motion.div key={m._id} layout className="flex items-center gap-3 rounded-lg bg-canvas px-3 py-2">
                <Avatar user={m} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.name}</p>
                  <p className="truncate text-xs text-faint">{m.email}</p>
                </div>
                {m._id === current.owner._id ? (
                  <span className="chip bg-accent-soft text-accent">Owner</span>
                ) : isOwner ? (
                  <button onClick={() => removeMember(m._id)} className="text-faint hover:text-red-500"><X size={16} /></button>
                ) : null}
              </motion.div>
            ))}
          </div>
          {isOwner && candidates.length > 0 && (
            <div className="flex items-center gap-2 pt-1">
              <UserPlus size={16} className="text-faint" />
              <select className="input" defaultValue="" onChange={(e) => { addMember(e.target.value); e.target.value = ''; }}>
                <option value="" disabled>Add a member…</option>
                {candidates.map((u) => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
              </select>
            </div>
          )}
          {isOwner && <p className="text-xs text-faint">Remember to Save changes above to persist members.</p>}
        </div>

        {isOwner && (
          <div className="card border-red-500/30 p-5">
            <h3 className="font-display text-base font-semibold text-red-500">Danger zone</h3>
            <p className="mt-1 text-sm text-muted">Deleting a project removes all its issues, sprints, and comments.</p>
            <button onClick={onDelete} className="btn mt-3 bg-red-500 text-white hover:brightness-110">
              <Trash2 size={16} /> Delete project
            </button>
          </div>
        )}
      </PageTransition>
    </>
  );
}
