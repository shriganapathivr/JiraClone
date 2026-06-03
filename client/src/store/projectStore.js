import { create } from 'zustand';
import api from '../lib/api.js';

// Central store for the currently-selected project and its issues/sprints.
export const useProjectStore = create((set, get) => ({
  projects: [],
  current: null,
  issues: [],
  sprints: [],
  loading: false,

  async loadProjects() {
    const { data } = await api.get('/projects');
    set({ projects: data });
    return data;
  },

  async selectProject(id) {
    set({ loading: true });
    const [{ data: project }, { data: issues }, { data: sprints }] = await Promise.all([
      api.get(`/projects/${id}`),
      api.get('/issues', { params: { project: id } }),
      api.get('/sprints', { params: { project: id } }),
    ]);
    set({ current: project, issues, sprints, loading: false });
  },

  async refreshIssues() {
    const id = get().current?._id;
    if (!id) return;
    const { data } = await api.get('/issues', { params: { project: id } });
    set({ issues: data });
  },

  async refreshSprints() {
    const id = get().current?._id;
    if (!id) return;
    const { data } = await api.get('/sprints', { params: { project: id } });
    set({ sprints: data });
  },

  // Optimistic local update of a single issue (used after edits).
  upsertIssue(issue) {
    const issues = get().issues.slice();
    const idx = issues.findIndex((i) => i._id === issue._id);
    if (idx >= 0) issues[idx] = issue;
    else issues.unshift(issue);
    set({ issues });
  },

  removeIssue(id) {
    set({ issues: get().issues.filter((i) => i._id !== id) });
  },

  // Replace the whole issues array (used by optimistic drag-and-drop).
  setIssues(issues) {
    set({ issues });
  },
}));
