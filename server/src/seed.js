import mongoose from 'mongoose';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Project from './models/Project.js';
import Issue from './models/Issue.js';
import Sprint from './models/Sprint.js';
import Comment from './models/Comment.js';

const TYPES = ['Story', 'Task', 'Bug', 'Epic'];
const STATUSES = ['To Do', 'In Progress', 'In Review', 'Done'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const ISSUE_SEEDS = [
  { title: 'Design the onboarding flow', type: 'Epic', status: 'In Progress', priority: 'High', storyPoints: 13, labels: ['design', 'onboarding'] },
  { title: 'Set up JWT authentication', type: 'Story', status: 'Done', priority: 'Critical', storyPoints: 8, labels: ['backend', 'auth'] },
  { title: 'Build the Kanban board drag-and-drop', type: 'Story', status: 'In Progress', priority: 'High', storyPoints: 8, labels: ['frontend'] },
  { title: 'Fix avatar not loading on Safari', type: 'Bug', status: 'To Do', priority: 'Medium', storyPoints: 2, labels: ['bug', 'frontend'] },
  { title: 'Add dark mode toggle', type: 'Task', status: 'In Review', priority: 'Low', storyPoints: 3, labels: ['ui', 'theme'] },
  { title: 'Implement sprint completion logic', type: 'Story', status: 'To Do', priority: 'Medium', storyPoints: 5, labels: ['backend', 'sprints'] },
  { title: 'Dashboard charts flicker on resize', type: 'Bug', status: 'To Do', priority: 'High', storyPoints: 3, labels: ['bug', 'charts'] },
  { title: 'Write API integration tests', type: 'Task', status: 'To Do', priority: 'Medium', storyPoints: 5, labels: ['testing'] },
  { title: 'Markdown rendering in issue descriptions', type: 'Story', status: 'In Progress', priority: 'Medium', storyPoints: 3, labels: ['frontend'] },
  { title: 'Optimize MongoDB indexes for issues', type: 'Task', status: 'Done', priority: 'Low', storyPoints: 2, labels: ['backend', 'performance'] },
  { title: 'Slide-in issue detail panel animation', type: 'Story', status: 'In Review', priority: 'High', storyPoints: 5, labels: ['frontend', 'animation'] },
  { title: 'Critical: login fails with special chars', type: 'Bug', status: 'In Progress', priority: 'Critical', storyPoints: 3, labels: ['bug', 'auth'] },
  { title: 'Add labels and filtering to backlog', type: 'Story', status: 'To Do', priority: 'Medium', storyPoints: 5, labels: ['frontend', 'backlog'] },
  { title: 'Toast notification system', type: 'Task', status: 'Done', priority: 'Low', storyPoints: 2, labels: ['ui'] },
  { title: 'Project settings & member management', type: 'Epic', status: 'To Do', priority: 'High', storyPoints: 13, labels: ['frontend', 'backend'] },
  { title: 'Skeleton loaders for board & lists', type: 'Task', status: 'In Review', priority: 'Low', storyPoints: 2, labels: ['ui', 'animation'] },
];

async function seed() {
  await connectDB(env.MONGODB_URI);
  console.log('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Project.deleteMany({}),
    Issue.deleteMany({}),
    Sprint.deleteMany({}),
    Comment.deleteMany({}),
  ]);

  console.log('Creating users...');
  // Use create() so the pre-save hook hashes passwords + builds avatars.
  const alice = await User.create({ name: 'Alice Rivera', email: 'alice@zira.dev', password: 'password123' });
  const bob = await User.create({ name: 'Bob Chen', email: 'bob@zira.dev', password: 'password123' });
  const carol = await User.create({ name: 'Carol Nwosu', email: 'carol@zira.dev', password: 'password123' });
  const users = [alice, bob, carol];

  console.log('Creating project...');
  const project = await Project.create({
    name: 'ZiraClone Demo',
    key: 'ZIRA',
    description: 'A demo project showcasing the ZiraClone issue tracker. Drag issues across the board, open the detail panel, and explore the dashboard.',
    owner: alice._id,
    members: users.map((u) => u._id),
  });

  console.log('Creating active sprint...');
  const sprint = await Sprint.create({
    name: 'Sprint 1 — Foundations',
    goal: 'Ship authentication, the Kanban board, and the issue detail panel.',
    status: 'active',
    startDate: new Date(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    project: project._id,
  });

  console.log('Creating issues...');
  let counter = 0;
  const createdIssues = [];
  for (let i = 0; i < ISSUE_SEEDS.length; i++) {
    const s = ISSUE_SEEDS[i];
    counter += 1;
    const assignee = users[i % users.length];
    const reporter = users[(i + 1) % users.length];
    // Put roughly two-thirds of issues into the active sprint; rest in backlog.
    const inSprint = i % 3 !== 0;
    const issue = await Issue.create({
      key: `${project.key}-${counter}`,
      number: counter,
      title: s.title,
      description: `## ${s.title}\n\nThis is a **demo issue** with _markdown_ support.\n\n- Item one\n- Item two\n\n\`\`\`js\nconsole.log('ZiraClone');\n\`\`\``,
      type: s.type,
      status: s.status,
      priority: s.priority,
      assignee: assignee._id,
      reporter: reporter._id,
      storyPoints: s.storyPoints,
      labels: s.labels,
      sprint: inSprint ? sprint._id : null,
      project: project._id,
      order: i,
    });
    createdIssues.push(issue);
  }

  project.issueCounter = counter;
  await project.save();

  console.log('Adding sample comments...');
  await Comment.create([
    { body: 'Started working on this — should have a draft by tomorrow.', author: bob._id, issue: createdIssues[2]._id },
    { body: 'Looks great! Left a couple of notes in the PR.', author: alice._id, issue: createdIssues[2]._id },
    { body: 'I can reproduce this on iOS Safari 17 as well.', author: carol._id, issue: createdIssues[3]._id },
  ]);

  console.log('\n\x1b[32m✓ Seed complete!\x1b[0m');
  console.log('  Login with: \x1b[1malice@zira.dev\x1b[0m / \x1b[1mpassword123\x1b[0m');
  console.log(`  Project: ${project.name} (${project.key}) — ${createdIssues.length} issues, 1 active sprint.\n`);

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
