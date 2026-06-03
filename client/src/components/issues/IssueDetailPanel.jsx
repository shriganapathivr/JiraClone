import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { X, Trash2, Send, Pencil, Check } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import Spinner from '../ui/Spinner.jsx';
import { TypeIcon, PriorityIcon } from './Badges.jsx';
import { ISSUE_TYPES, STATUSES, PRIORITIES } from '../../lib/constants.js';
import { useProjectStore } from '../../store/projectStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { toast } from '../../store/toastStore.js';
import { timeAgo } from '../../lib/format.js';
import api from '../../lib/api.js';

export default function IssueDetailPanel({ issueId, open, onClose }) {
  const { current, upsertIssue, removeIssue } = useProjectStore();
  const user = useAuthStore((s) => s.user);
  const members = current?.members || [];

  const [issue, setIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [draft, setDraft] = useState({});
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!open || !issueId) return;
    setLoading(true);
    api
      .get(`/issues/${issueId}`)
      .then(({ data }) => {
        setIssue(data);
        setComments(data.comments || []);
        setDraft({ title: data.title, description: data.description });
      })
      .catch(() => toast.error('Could not load issue'))
      .finally(() => setLoading(false));
  }, [issueId, open]);

  async function patch(fields) {
    const { data } = await api.put(`/issues/${issue._id}`, fields);
    setIssue((prev) => ({ ...data, comments: prev?.comments }));
    upsertIssue(data);
  }

  async function onField(field, value) {
    try {
      await patch({ [field]: value });
    } catch {
      toast.error('Update failed');
    }
  }

  async function saveTitle() {
    if (draft.title.trim() && draft.title !== issue.title) await onField('title', draft.title.trim());
    setEditingTitle(false);
  }

  async function saveDesc() {
    await onField('description', draft.description);
    setEditingDesc(false);
    toast.success('Description updated');
  }

  async function postComment(e) {
    e.preventDefault();
    if (!comment.trim()) return;
    setPosting(true);
    try {
      const { data } = await api.post('/comments', { body: comment, issue: issue._id });
      setComments((c) => [...c, data]);
      setComment('');
    } catch {
      toast.error('Could not post comment');
    } finally {
      setPosting(false);
    }
  }

  async function deleteComment(id) {
    try {
      await api.delete(`/comments/${id}`);
      setComments((c) => c.filter((x) => x._id !== id));
    } catch {
      toast.error('Could not delete comment');
    }
  }

  async function onDelete() {
    if (!confirm(`Delete ${issue.key}? This cannot be undone.`)) return;
    try {
      await api.delete(`/issues/${issue._id}`);
      removeIssue(issue._id);
      toast.success(`Deleted ${issue.key}`);
      onClose();
    } catch {
      toast.error('Could not delete issue');
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-40">
          <motion.div
            className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-surface shadow-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 32 }}
          >
            {loading || !issue ? (
              <div className="grid flex-1 place-items-center"><Spinner size={28} /></div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <TypeIcon type={issue.type} size={15} />
                    <span className="font-mono text-sm font-semibold text-muted">{issue.key}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={onDelete} className="btn-ghost h-8 w-8 rounded-lg p-0 hover:text-red-500" title="Delete issue">
                      <Trash2 size={16} />
                    </button>
                    <button onClick={onClose} className="btn-ghost h-8 w-8 rounded-lg p-0">
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
                  {/* Title */}
                  {editingTitle ? (
                    <div className="flex items-start gap-2">
                      <textarea
                        autoFocus
                        className="input flex-1 resize-none font-display text-lg font-bold"
                        rows={2}
                        value={draft.title}
                        onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                        onBlur={saveTitle}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), saveTitle())}
                      />
                    </div>
                  ) : (
                    <h2
                      className="group flex cursor-text items-start gap-2 font-display text-xl font-bold leading-snug"
                      onClick={() => setEditingTitle(true)}
                    >
                      {issue.title}
                      <Pencil size={14} className="mt-1.5 shrink-0 text-faint opacity-0 group-hover:opacity-100" />
                    </h2>
                  )}

                  {/* Fields grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                    <Field label="Status">
                      <select className="input" value={issue.status} onChange={(e) => onField('status', e.target.value)}>
                        {STATUSES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </Field>
                    <Field label="Assignee">
                      <select className="input" value={issue.assignee?._id || ''} onChange={(e) => onField('assignee', e.target.value || null)}>
                        <option value="">Unassigned</option>
                        {members.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
                      </select>
                    </Field>
                    <Field label="Type">
                      <select className="input" value={issue.type} onChange={(e) => onField('type', e.target.value)}>
                        {ISSUE_TYPES.map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </Field>
                    <Field label="Priority">
                      <div className="flex items-center gap-2">
                        <PriorityIcon priority={issue.priority} />
                        <select className="input" value={issue.priority} onChange={(e) => onField('priority', e.target.value)}>
                          {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                        </select>
                      </div>
                    </Field>
                    <Field label="Story points">
                      <input
                        type="number"
                        min="0"
                        className="input"
                        defaultValue={issue.storyPoints ?? ''}
                        onBlur={(e) => onField('storyPoints', e.target.value ? Number(e.target.value) : null)}
                        placeholder="—"
                      />
                    </Field>
                    <Field label="Reporter">
                      <div className="flex items-center gap-2 py-2">
                        <Avatar user={issue.reporter} size="sm" />
                        <span className="text-sm text-muted">{issue.reporter?.name || '—'}</span>
                      </div>
                    </Field>
                  </div>

                  {/* Labels */}
                  {issue.labels?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {issue.labels.map((l) => (
                        <span key={l} className="chip bg-elevated text-muted">{l}</span>
                      ))}
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="label mb-0">Description</span>
                      {!editingDesc && (
                        <button className="text-xs font-semibold text-accent hover:underline" onClick={() => setEditingDesc(true)}>
                          Edit
                        </button>
                      )}
                    </div>
                    {editingDesc ? (
                      <div className="space-y-2">
                        <textarea
                          autoFocus
                          className="input min-h-[140px] resize-y font-mono text-xs"
                          value={draft.description}
                          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                        />
                        <div className="flex justify-end gap-2">
                          <button className="btn-ghost" onClick={() => { setDraft({ ...draft, description: issue.description }); setEditingDesc(false); }}>Cancel</button>
                          <button className="btn-primary" onClick={saveDesc}><Check size={15} /> Save</button>
                        </div>
                      </div>
                    ) : issue.description ? (
                      <div className="prose-zira rounded-lg border border-border bg-canvas p-3.5">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{issue.description}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="rounded-lg border border-dashed border-border p-3.5 text-sm text-faint">No description yet — click Edit to add one.</p>
                    )}
                  </div>

                  {/* Comments */}
                  <div>
                    <span className="label">Comments · {comments.length}</span>
                    <div className="space-y-3">
                      <AnimatePresence initial={false}>
                        {comments.map((c) => (
                          <motion.div
                            key={c._id}
                            layout
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="group flex gap-3"
                          >
                            <Avatar user={c.author} size="sm" />
                            <div className="flex-1 rounded-lg bg-canvas border border-border px-3 py-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold">{c.author?.name}</span>
                                <span className="text-xs text-faint">{timeAgo(c.createdAt)}</span>
                              </div>
                              <p className="mt-0.5 whitespace-pre-wrap text-sm text-muted">{c.body}</p>
                            </div>
                            {c.author?._id === user?._id && (
                              <button onClick={() => deleteComment(c._id)} className="self-center text-faint opacity-0 transition hover:text-red-500 group-hover:opacity-100">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>

                    <form onSubmit={postComment} className="mt-4 flex items-start gap-2">
                      <Avatar user={user} size="sm" />
                      <div className="flex-1">
                        <textarea
                          className="input min-h-[60px] resize-y"
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Add a comment…"
                        />
                        <div className="mt-2 flex justify-end">
                          <button type="submit" className="btn-primary" disabled={posting || !comment.trim()}>
                            {posting ? <Spinner size={15} /> : <><Send size={14} /> Comment</>}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>

                  <p className="pb-2 text-center text-xs text-faint">
                    Created {timeAgo(issue.createdAt)} · Updated {timeAgo(issue.updatedAt)}
                  </p>
                </div>
              </>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <span className="label">{label}</span>
      {children}
    </div>
  );
}
