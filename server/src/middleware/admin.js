import ApiError from '../utils/ApiError.js';

// Gate for project-head–only actions (create/assign/delete projects, issues, sprints).
// Must run after `protect`, which sets req.user.
export function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    throw new ApiError(403, 'Only the project head (admin) can perform this action');
  }
  next();
}
