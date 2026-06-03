import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    key: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      unique: true,
      match: [/^[A-Z][A-Z0-9]{1,9}$/, 'Key must be 2-10 uppercase letters/numbers'],
    },
    description: { type: String, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // Running counter so issues can auto-number per project (ZIRA-1, ZIRA-2...).
    issueCounter: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Project = mongoose.model('Project', projectSchema);
export default Project;
