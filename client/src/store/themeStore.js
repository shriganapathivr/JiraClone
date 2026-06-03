import { create } from 'zustand';

function getInitial() {
  const saved = localStorage.getItem('zira_theme');
  if (saved) return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function apply(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export const useThemeStore = create((set, get) => ({
  theme: getInitial(),
  initTheme() {
    apply(get().theme);
  },
  toggle() {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('zira_theme', next);
    apply(next);
    set({ theme: next });
  },
}));
