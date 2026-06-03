import mongoose from 'mongoose';

export const ISSUE_TYPES = ['Story', 'Task', 'Bug', 'Epic'];
export const ISSUE_STATUSES = ['To Do', 'In Progress', 'In Review', 'Done'];
export const ISSUE_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const issueSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true }, // e.g. ZIRA-1
    number: { type: Number, required: true }, // 1, 2, 3... within project
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' }, // markdown
    type: { type: String, enum: ISSUE_TYPES, default: 'Task' },
    status: { type: String, enum: ISSUE_STATUSES, default: 'To Do' },
    priority: { type: String, enum: ISSUE_PRIORITIES, default: 'Medium' },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    storyPoints: { type: Number, default: null },
    labels: [{ type: String, trim: true }],
    sprint: { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint', default: null },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    // Ordering within a status column / backlog. Lower = higher up.
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

issueSchema.index({ project: 1, status: 1, order: 1 });

const Issue = mongoose.model('Issue', issueSchema);
export default Issue;
