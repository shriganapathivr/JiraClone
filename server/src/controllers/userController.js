import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// GET /api/users?search= — for assignee pickers and member selection.
export const getUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }
  const users = await User.find(filter).select('name email avatar').sort('name').limit(50);
  res.json(users);
});
