import { useAuthStore } from '../store/authStore.js';
import { useProjectStore } from '../store/projectStore.js';

// Centralizes who-can-do-what for the current user + currently open project.
// - isAdmin: the project head — full control everywhere (incl. creating projects).
// - isManager: a member the admin granted ticket-creation rights on this project.
// - canManageIssues: may create/assign/edit/delete issues in the current project.
export function usePermissions() {
  const user = useAuthStore((s) => s.user);
  const current = useProjectStore((s) => s.current);
  const isAdmin = user?.role === 'admin';
  const isManager = !!current?.managers?.some(
    (m) => String(m._id || m) === String(user?._id)
  );
  return { isAdmin, isManager, canManageIssues: isAdmin || isManager };
}
