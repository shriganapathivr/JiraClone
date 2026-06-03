import { create } from 'zustand';

let id = 0;

export const useToastStore = create((set, get) => ({
  toasts: [],
  push(message, type = 'success') {
    const toast = { id: ++id, message, type };
    set({ toasts: [...get().toasts, toast] });
    setTimeout(() => get().dismiss(toast.id), 4000);
  },
  dismiss(toastId) {
    set({ toasts: get().toasts.filter((t) => t.id !== toastId) });
  },
}));

// Convenience helpers.
export const toast = {
  success: (m) => useToastStore.getState().push(m, 'success'),
  error: (m) => useToastStore.getState().push(m, 'error'),
  info: (m) => useToastStore.getState().push(m, 'info'),
};
