import { create } from 'zustand';
import api from '../lib/api.js';
import { connectSocket, disconnectSocket, getSocket } from '../lib/socket.js';
import { useAuthStore } from './authStore.js';
import { toast } from './toastStore.js';

function otherParty(msg, meId) {
  const s = msg.sender?._id || msg.sender;
  const r = msg.recipient?._id || msg.recipient;
  return String(s) === String(meId) ? r : s;
}

export const useChatStore = create((set, get) => ({
  open: false,
  contacts: [],
  online: new Set(),
  activeUserId: null,
  messages: [],
  unread: 0,
  typingFrom: null,
  connected: false,
  projectId: null, // chat is scoped to the currently selected project

  // Wire up the socket + all real-time listeners (called once after login).
  connect() {
    if (get().connected) return;
    const socket = connectSocket();
    const meId = useAuthStore.getState().user?._id;

    socket.on('connect', () => set({ connected: true }));
    socket.on('disconnect', () => set({ connected: false }));

    socket.on('presence:list', (ids) => set({ online: new Set(ids.map(String)) }));
    socket.on('presence:update', ({ userId, online }) => {
      const next = new Set(get().online);
      if (online) next.add(String(userId));
      else next.delete(String(userId));
      set({ online: next });
    });

    socket.on('message:new', (msg) => {
      const { activeUserId, messages } = get();
      const other = otherParty(msg, meId);
      const incoming = String(msg.recipient?._id || msg.recipient) === String(meId);

      // Append if it belongs to the open conversation.
      if (String(other) === String(activeUserId)) {
        set({ messages: [...messages, msg] });
        if (incoming) get().markRead(other); // they're looking at it
      } else if (incoming) {
        set({ unread: get().unread + 1 });
      }
      get().loadContacts(); // refresh previews + per-contact unread
    });

    socket.on('typing', ({ from, typing }) => {
      set({ typingFrom: typing ? String(from) : null });
    });

    set({ connected: true });
    get().refreshUnread();
    // Contacts are loaded by the widget once it knows the current project.
  },

  // Switch the chat to a project's team; resets an open conversation if the
  // other person isn't part of the new project.
  setProject(projectId) {
    if (projectId === get().projectId) return;
    set({ projectId });
    get().loadContacts(projectId);
  },

  teardown() {
    const socket = getSocket();
    socket.off('connect');
    socket.off('disconnect');
    socket.off('presence:list');
    socket.off('presence:update');
    socket.off('message:new');
    socket.off('typing');
    disconnectSocket();
    set({ connected: false, contacts: [], messages: [], activeUserId: null, unread: 0, online: new Set() });
  },

  async loadContacts(projectId = get().projectId) {
    try {
      const { data } = await api.get('/messages/contacts', {
        params: projectId ? { project: projectId } : {},
      });
      // If the open conversation's person isn't in this project, close it.
      const active = get().activeUserId;
      const stillThere = !active || data.some((c) => c.user._id === active);
      set({ contacts: data, ...(stillThere ? {} : { activeUserId: null, messages: [] }) });
    } catch { /* ignore */ }
  },

  async refreshUnread() {
    try {
      const { data } = await api.get('/messages/unread/count');
      set({ unread: data.count });
    } catch { /* ignore */ }
  },

  async openConversation(userId) {
    set({ activeUserId: userId, messages: [], typingFrom: null });
    try {
      const { data } = await api.get(`/messages/${userId}`);
      set({ messages: data });
      get().markRead(userId);
    } catch { /* ignore */ }
  },

  markRead(userId) {
    getSocket().emit('message:read', { from: userId });
    // Recompute the badge from contacts after the server marks them read.
    setTimeout(() => { get().loadContacts(); get().refreshUnread(); }, 150);
  },

  sendMessage(body) {
    const to = get().activeUserId;
    if (!to || !body.trim()) return;
    getSocket().emit('message:send', { to, body: body.trim() }, (res) => {
      if (!res?.ok) toast.error(res?.error || 'Message failed');
    });
  },

  setTyping(typing) {
    const to = get().activeUserId;
    if (to) getSocket().emit('typing', { to, typing });
  },

  openPanel() { set({ open: true }); },
  closePanel() { set({ open: false, activeUserId: null, messages: [] }); },
}));
