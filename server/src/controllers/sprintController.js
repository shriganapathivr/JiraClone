import Sprint from '../models/Sprint.js';
import Issue from '../models/Issue.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// GET /api/sprints?project=
export const getSprints = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.project) filter.project = req.query.project;
  const sprints = await Sprint.find(filter).sort('-createdAt');
  res.json(sprints);
});

// POST /api/sprints
export const createSprint = asyncHandler(async (req, res) => {
  const { name, goal, project, startDate, endDate } = req.body;
  const sprint = await Sprint.create({ name, goal, project, startDate, endDate });
  res.status(201).json(sprint);
});

// PUT /api/sprints/:id
export const updateSprint = asyncHandler(async (req, res) => {
  const sprint = await Sprint.findById(req.params.id);
  if (!sprint) throw new ApiError(404, 'Sprint not found');
  const { name, goal, startDate, endDate } = req.body;
  if (name !== undefined) sprint.name = name;
  if (goal !== undefined) sprint.goal = goal;
  if (startDate !== undefined) sprint.startDate = startDate;
  if (endDate !== undefined) sprint.endDate = endDate;
  await sprint.save();
  res.json(sprint);
});

// POST /api/sprints/:id/start — only one active sprint per project.
export const startSprint = asyncHandler(async (req, res) => {
  const sprint = await Sprint.findById(req.params.id);
  if (!sprint) throw new ApiError(404, 'Sprint not found');
  await Sprint.updateMany(
    { project: sprint.project, status: 'active' },
    { status: 'completed' }
  );
  sprint.status = 'active';
  if (!sprint.startDate) sprint.startDate = new Date();
  await sprint.save();
  res.json(sprint);
});

// POST /api/sprints/:id/complete — moves unfinished issues back to backlog.
export const completeSprint = asyncHandler(async (req, res) => {
  const sprint = await Sprint.findById(req.params.id);
  if (!sprint) throw new ApiError(404, 'Sprint not found');
  sprint.status = 'completed';
  if (!sprint.endDate) sprint.endDate = new Date();
  await sprint.save();
  // Unfinished issues drop back to the backlog.
  await Issue.updateMany(
    { sprint: sprint._id, status: { $ne: 'Done' } },
    { sprint: null }
  );
  res.json(sprint);
});

// DELETE /api/sprints/:id
export const deleteSprint = asyncHandler(async (req, res) => {
  const sprint = await Sprint.findById(req.params.id);
  if (!sprint) throw new ApiError(404, 'Sprint not found');
  await Issue.updateMany({ sprint: sprint._id }, { sprint: null });
  await sprint.deleteOne();
  res.json({ message: 'Sprint deleted' });
});
