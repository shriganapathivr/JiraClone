import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, Legend,
} from 'recharts';
import { LayoutDashboard, CircleDot, CheckCircle2, Layers, Flame } from 'lucide-react';
import Topbar from '../components/layout/Topbar.jsx';
import PageTransition from '../components/layout/PageTransition.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import { STATUSES, PRIORITIES, STATUS_META, PRIORITY_META } from '../lib/constants.js';
import { useProjectData } from '../hooks/useProjectData.js';
import { useProjectStore } from '../store/projectStore.js';

export default function Dashboard() {
  const { loaded } = useProjectData();
  const { issues, current } = useProjectStore();

  const stats = useMemo(() => {
    const byStatus = STATUSES.map((s) => ({
      name: s,
      value: issues.filter((i) => i.status === s).length,
      color: STATUS_META[s].color,
    }));
    const byPriority = PRIORITIES.map((p) => ({
      name: p,
      value: issues.filter((i) => i.priority === p).length,
      fill: PRIORITY_META[p].color,
    }));
    const assigneeMap = new Map();
    issues.forEach((i) => {
      const key = i.assignee?._id || 'unassigned';
      const entry = assigneeMap.get(key) || { user: i.assignee, count: 0 };
      entry.count += 1;
      assigneeMap.set(key, entry);
    });
    const byAssignee = [...assigneeMap.values()].sort((a, b) => b.count - a.count);
    const done = byStatus.find((s) => s.name === 'Done')?.value || 0;
    const totalPoints = issues.reduce((s, i) => s + (i.storyPoints || 0), 0);
    return { byStatus, byPriority, byAssignee, done, totalPoints };
  }, [issues]);

  const total = issues.length;

  if (!loaded) {
    return (
      <>
        <Topbar title="Dashboard" />
        <PageTransition className="grid gap-4 p-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-72 w-full" />)}
        </PageTransition>
      </>
    );
  }

  const cards = [
    { label: 'Total issues', value: total, icon: Layers, color: '#5b3df5' },
    { label: 'Completed', value: stats.done, icon: CheckCircle2, color: '#36b37e' },
    { label: 'In progress', value: stats.byStatus.find((s) => s.name === 'In Progress')?.value || 0, icon: CircleDot, color: '#4c9aff' },
    { label: 'Story points', value: stats.totalPoints, icon: Flame, color: '#f0562d' },
  ];

  return (
    <>
      <Topbar title="Dashboard" />
      <PageTransition className="space-y-5 p-6">
        {/* Stat cards */}
        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          initial="hidden" animate="show"
          variants={{ show: { transition: { staggerChildren: 0.06 } } }}
        >
          {cards.map((c) => (
            <motion.div
              key={c.label}
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
              className="card flex items-center gap-4 p-5"
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl" style={{ background: `${c.color}1f`, color: c.color }}>
                <c.icon size={22} />
              </div>
              <div>
                <motion.p
                  className="font-display text-3xl font-bold"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                >
                  {c.value}
                </motion.p>
                <p className="text-xs font-medium text-muted">{c.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {total === 0 ? (
          <div className="card grid place-items-center py-20 text-center">
            <LayoutDashboard size={40} className="mb-3 text-faint" />
            <p className="font-display text-lg font-semibold">No data yet</p>
            <p className="text-sm text-muted">Create issues to see analytics for {current?.name}.</p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Issues by status (donut) */}
            <ChartCard title="Issues by status">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={stats.byStatus} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={3} stroke="none">
                    {stats.byStatus.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <Legendish items={stats.byStatus.map((s) => ({ name: s.name, color: s.color, value: s.value }))} />
            </ChartCard>

            {/* Issues by priority (radial) */}
            <ChartCard title="Issues by priority">
              <ResponsiveContainer width="100%" height={260}>
                <RadialBarChart innerRadius="25%" outerRadius="100%" data={stats.byPriority} startAngle={90} endAngle={-270}>
                  <RadialBar background dataKey="value" cornerRadius={8} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </RadialBarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Issues by assignee (bar) */}
            <ChartCard title="Workload by assignee" className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.byAssignee.map((a) => ({ name: a.user?.name || 'Unassigned', value: a.count }))}>
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'rgb(var(--muted))' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'rgb(var(--muted))' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgb(var(--elevated))' }} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="rgb(var(--accent))" maxBarSize={64} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 flex flex-wrap gap-3">
                {stats.byAssignee.map((a) => (
                  <div key={a.user?._id || 'un'} className="flex items-center gap-2 text-sm">
                    <Avatar user={a.user} size="sm" />
                    <span className="text-muted">{a.user?.name || 'Unassigned'}</span>
                    <span className="font-semibold">{a.count}</span>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
        )}
      </PageTransition>
    </>
  );
}

function ChartCard({ title, children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={`card p-5 ${className}`}
    >
      <h3 className="mb-4 font-display text-sm font-semibold">{title}</h3>
      {children}
    </motion.div>
  );
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="card px-3 py-1.5 text-xs shadow-float">
      <span className="font-semibold">{p.payload.name}</span>: {p.value}
    </div>
  );
}

function Legendish({ items }) {
  return (
    <div className="mt-3 flex flex-wrap justify-center gap-3">
      {items.map((i) => (
        <span key={i.name} className="flex items-center gap-1.5 text-xs text-muted">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: i.color }} />
          {i.name} <b className="text-ink">{i.value}</b>
        </span>
      ))}
    </div>
  );
}
