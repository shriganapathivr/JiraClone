import Comment from '../models/Comment.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// GET /api/comments?issue=
export const getComments = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.issue) filter.issue = req.query.issue;
  const comments = await Comment.find(filter)
    .populate('author', 'name email avatar')
    .sort('createdAt');
  res.json(comments);
});

// POST /api/comments
export const createComment = asyncHandler(async (req, res) => {
  const { body, issue } = req.body;
  const comment = await Comment.create({ body, issue, author: req.user._id });
  const populated = await comment.populate('author', 'name email avatar');
  res.status(201).json(populated);
});

// DELETE /api/comments/:id — author only.
export const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw new ApiError(404, 'Comment not found');
  if (comment.author.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You can only delete your own comments');
  }
  await comment.deleteOne();
  res.json({ message: 'Comment deleted' });
});
