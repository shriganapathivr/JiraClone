import Project from '../models/Project.js';
import Issue from '../models/Issue.js';
import Sprint from '../models/Sprint.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// GET /api/projects — admin sees every project; members see their own.
export const getProjects = asyncHandler(async (req, res) => {
  const scope =
    req.user.role === 'admin'
      ? {}
      : { $or: [{ owner: req.user._id }, { members: req.user._id }] };
  const projects = await Project.find(scope)
    .populate('owner', 'name email avatar')
    .populate('members', 'name email avatar')
    .sort('-createdAt');
  res.json(projects);
});

// GET /api/projects/:id
export const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('owner', 'name email avatar')
    .populate('members', 'name email avatar');
  if (!project) throw new ApiError(404, 'Project not found');
  res.json(project);
});

// POST /api/projects
export const createProject = asyncHandler(async (req, res) => {
  const { name, key, description, members = [] } = req.body;
  const project = await Project.create({
    name,
    key,
    description,
    owner: req.user._id,
    members: Array.from(new Set([req.user._id.toString(), ...members])),
  });
  const populated = await project.populate([
    { path: 'owner', select: 'name email avatar' },
    { path: 'members', select: 'name email avatar' },
  ]);
  res.status(201).json(populated);
});

// PUT /api/projects/:id
export const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, 'Project not found');
  if (project.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Only the project owner can edit this project');
  }

  const { name, description, members } = req.body;
  if (name !== undefined) project.name = name;
  if (description !== undefined) project.description = description;
  if (members !== undefined) {
    project.members = Array.from(new Set([project.owner.toString(), ...members]));
  }
  await project.save();
  const populated = await project.populate([
    { path: 'owner', select: 'name email avatar' },
    { path: 'members', select: 'name email avatar' },
  ]);
  res.json(populated);
});

// DELETE /api/projects/:id — cascades to issues and sprints.
export const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, 'Project not found');
  if (project.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Only the project owner can delete this project');
  }
  await Issue.deleteMany({ project: project._id });
  await Sprint.deleteMany({ project: project._id });
  await project.deleteOne();
  res.json({ message: 'Project deleted' });
});
