import mongoose from 'mongoose';
import Issue from '../models/Issue.js';
import Project from '../models/Project.js';
import Comment from '../models/Comment.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const POPULATE = [
  { path: 'assignee', select: 'name email avatar' },
  { path: 'reporter', select: 'name email avatar' },
  { path: 'sprint', select: 'name status' },
];

// GET /api/issues?project=&status=&type=&priority=&assignee=&sprint=&search=
export const getIssues = asyncHandler(async (req, res) => {
  const { project, status, type, priority, assignee, sprint, search } = req.query;
  const filter = {};
  if (project) filter.project = project;
  if (status) filter.status = status;
  if (type) filter.type = type;
  if (priority) filter.priority = priority;
  if (assignee) filter.assignee = assignee === 'unassigned' ? null : assignee;
  if (sprint) filter.sprint = sprint === 'backlog' ? null : sprint;
  if (search) filter.title = { $regex: search, $options: 'i' };

  const issues = await Issue.find(filter)
    .populate(POPULATE)
    .sort({ order: 1, createdAt: -1 });
  res.json(issues);
});

// GET /api/issues/:id — includes comment thread.
export const getIssue = asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id).populate(POPULATE);
  if (!issue) throw new ApiError(404, 'Issue not found');
  const comments = await Comment.find({ issue: issue._id })
    .populate('author', 'name email avatar')
    .sort('createdAt');
  res.json({ ...issue.toObject(), comments });
});

// POST /api/issues — auto-numbers the key (ZIRA-1, ZIRA-2...).
export const createIssue = asyncHandler(async (req, res) => {
  const { project: projectId } = req.body;
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, 'Project not found');

  // Atomically increment the per-project counter.
  const updated = await Project.findByIdAndUpdate(
    projectId,
    { $inc: { issueCounter: 1 } },
    { new: true }
  );
  const number = updated.issueCounter;
  const key = `${project.key}-${number}`;

  // New issues go to the top of their column.
  const minOrder = await Issue.findOne({ project: projectId, status: req.body.status || 'To Do' })
    .sort('order')
    .select('order');
  const order = minOrder ? minOrder.order - 1 : 0;

  const issue = await Issue.create({
    ...req.body,
    key,
    number,
    project: projectId,
    reporter: req.body.reporter || req.user._id,
    order,
  });
  const populated = await issue.populate(POPULATE);
  res.status(201).json(populated);
});

// PUT /api/issues/:id
export const updateIssue = asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) throw new ApiError(404, 'Issue not found');

  const editable = [
    'title', 'description', 'type', 'status', 'priority',
    'assignee', 'storyPoints', 'labels', 'sprint', 'order',
  ];
  for (const field of editable) {
    if (req.body[field] !== undefined) issue[field] = req.body[field];
  }
  await issue.save();
  const populated = await issue.populate(POPULATE);
  res.json(populated);
});

// PATCH /api/issues/reorder — bulk status + order update for drag-and-drop.
// Body: { updates: [{ id, status, order }, ...] }
export const reorderIssues = asyncHandler(async (req, res) => {
  const { updates } = req.body;
  if (!Array.isArray(updates)) throw new ApiError(400, 'updates must be an array');

  const ops = updates.map((u) => ({
    updateOne: {
      filter: { _id: new mongoose.Types.ObjectId(u.id) },
      update: {
        $set: {
          ...(u.status !== undefined && { status: u.status }),
          ...(u.order !== undefined && { order: u.order }),
          ...(u.sprint !== undefined && { sprint: u.sprint }),
        },
      },
    },
  }));
  if (ops.length) await Issue.bulkWrite(ops);
  res.json({ message: 'Reordered', count: ops.length });
});

// DELETE /api/issues/:id
export const deleteIssue = asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) throw new ApiError(404, 'Issue not found');
  await Comment.deleteMany({ issue: issue._id });
  await issue.deleteOne();
  res.json({ message: 'Issue deleted' });
});
