import mongoose from 'mongoose';

export const SPRINT_STATUSES = ['planned', 'active', 'completed'];

const sprintSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    goal: { type: String, default: '' },
    status: { type: String, enum: SPRINT_STATUSES, default: 'planned' },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  },
  { timestamps: true }
);

const Sprint = mongoose.model('Sprint', sprintSchema);
export default Sprint;
