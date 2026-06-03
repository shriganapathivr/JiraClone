import { BookOpen, CheckSquare, Bug, Zap, ChevronUp, ChevronsUp, Minus, AlertTriangle } from 'lucide-react';

export const ISSUE_TYPES = ['Story', 'Task', 'Bug', 'Epic'];
export const STATUSES = ['To Do', 'In Progress', 'In Review', 'Done'];
export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

// Each type gets a distinct colored icon.
export const TYPE_META = {
  Story: { icon: BookOpen, color: '#36b37e', label: 'Story' },
  Task: { icon: CheckSquare, color: '#4c9aff', label: 'Task' },
  Bug: { icon: Bug, color: '#ff5c5c', label: 'Bug' },
  Epic: { icon: Zap, color: '#a368fc', label: 'Epic' },
};

// Priorities with colored indicators.
export const PRIORITY_META = {
  Low: { icon: ChevronUp, color: '#6b9b37', rank: 1, label: 'Low' },
  Medium: { icon: Minus, color: '#e2a200', rank: 2, label: 'Medium' },
  High: { icon: ChevronsUp, color: '#f06b30', rank: 3, label: 'High' },
  Critical: { icon: AlertTriangle, color: '#e0344b', rank: 4, label: 'Critical' },
};

// Status columns with accent hues for the board.
export const STATUS_META = {
  'To Do': { color: '#8e92a8', tint: 'rgba(142,146,168,0.14)' },
  'In Progress': { color: '#4c9aff', tint: 'rgba(76,154,255,0.14)' },
  'In Review': { color: '#a368fc', tint: 'rgba(163,104,252,0.14)' },
  Done: { color: '#36b37e', tint: 'rgba(54,179,126,0.14)' },
};
