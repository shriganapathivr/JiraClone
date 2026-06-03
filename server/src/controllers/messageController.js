import mongoose from 'mongoose';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const PUBLIC = 'name email avatar role';

// Set of user ids (as strings) that share at least one project with `userId` —
// i.e. the teammates this user is allowed to chat with. Excludes the user.
export async function sharedProjectUserIds(userId) {
  const projects = await Project.find({
    $or: [{ owner: userId }, { members: userId }],
  }).select('owner members');
  const ids = new Set();
  for (const p of projects) {
    ids.add(String(p.owner));
    p.members.forEach((m) => ids.add(String(m)));
  }
  ids.delete(String(userId));
  return ids;
}

// Permission rule: admins may message anyone (and anyone may message an admin);
// members may also message teammates who share a project with them.
export async function assertCanMessage(sender, recipientId) {
  if (String(sender._id) === String(recipientId)) {
    throw new ApiError(400, 'You cannot message yourself');
  }
  const recipient = await User.findById(recipientId).select(PUBLIC);
  if (!recipient) throw new ApiError(404, 'Recipient not found');

  // The project head is always reachable, in either direction.
  if (sender.role === 'admin' || recipient.role === 'admin') return recipient;

  // Otherwise both must belong to a common project.
  const teammates = await sharedProjectUserIds(sender._id);
  if (!teammates.has(String(recipientId))) {
    throw new ApiError(403, 'You can only chat with the project head or teammates in your projects');
  }
  return recipient;
}

// Creates + returns a populated message. Shared by the REST route and sockets.
export async function persistMessage(sender, recipientId, body) {
  const text = (body || '').trim();
  if (!text) throw new ApiError(400, 'Message cannot be empty');
  await assertCanMessage(sender, recipientId);
  const msg = await Message.create({ sender: sender._id, recipient: recipientId, body: text });
  return msg.populate([
    { path: 'sender', select: PUBLIC },
    { path: 'recipient', select: PUBLIC },
  ]);
}

// GET /api/messages/contacts — who the current user can chat with, plus
// last message + unread count for each.
export const getContacts = asyncHandler(async (req, res) => {
  const me = req.user;
  let people;
  if (me.role === 'admin') {
    // The project head can reach everyone.
    people = await User.find({ _id: { $ne: me._id } }).select(PUBLIC).sort('name');
  } else {
    // Members see the project head(s) plus teammates from their projects.
    const teammates = await sharedProjectUserIds(me._id);
    people = await User.find({
      _id: { $ne: me._id },
      $or: [{ role: 'admin' }, { _id: { $in: [...teammates] } }],
    })
      .select(PUBLIC)
      .sort('name');
  }

  const contacts = await Promise.all(
    people.map(async (u) => {
      const last = await Message.findOne({
        $or: [
          { sender: me._id, recipient: u._id },
          { sender: u._id, recipient: me._id },
        ],
      }).sort('-createdAt');
      const unread = await Message.countDocuments({
        sender: u._id,
        recipient: me._id,
        read: false,
      });
      return {
        user: u,
        lastMessage: last ? { body: last.body, createdAt: last.createdAt } : null,
        unread,
      };
    })
  );

  // Surface people you've actually talked to first, then most recent.
  contacts.sort((a, b) => {
    const at = a.lastMessage ? new Date(a.lastMessage.createdAt) : 0;
    const bt = b.lastMessage ? new Date(b.lastMessage.createdAt) : 0;
    return bt - at;
  });
  res.json(contacts);
});

// GET /api/messages/:userId — full conversation; marks their messages read.
export const getConversation = asyncHandler(async (req, res) => {
  const me = req.user;
  const otherId = req.params.userId;
  await assertCanMessage(me, otherId);

  const messages = await Message.find({
    $or: [
      { sender: me._id, recipient: otherId },
      { sender: otherId, recipient: me._id },
    ],
  })
    .populate('sender', PUBLIC)
    .populate('recipient', PUBLIC)
    .sort('createdAt');

  await Message.updateMany(
    { sender: otherId, recipient: me._id, read: false },
    { read: true }
  );

  res.json(messages);
});

// POST /api/messages — REST fallback for sending (sockets are the primary path).
export const sendMessage = asyncHandler(async (req, res) => {
  const { to, body } = req.body;
  const msg = await persistMessage(req.user, to, body);
  res.status(201).json(msg);
});

// GET /api/messages/unread/count — badge for the chat launcher.
export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Message.countDocuments({ recipient: req.user._id, read: false });
  res.json({ count });
});
