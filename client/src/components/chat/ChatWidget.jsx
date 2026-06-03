import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, X, ArrowLeft, Send, ShieldCheck } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import { useChatStore } from '../../store/chatStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { timeAgo } from '../../lib/format.js';

export default function ChatWidget() {
  const user = useAuthStore((s) => s.user);
  const {
    open, openPanel, closePanel, connect, teardown,
    contacts, online, activeUserId, openConversation, unread,
  } = useChatStore();

  // Connect the socket once while authenticated.
  useEffect(() => {
    connect();
    return () => teardown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeContact = contacts.find((c) => c.user._id === activeUserId);

  return (
    <>
      {/* Launcher */}
      <motion.button
        onClick={() => (open ? closePanel() : openPanel())}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-ink shadow-glow"
        aria-label="Open chat"
      >
        <AnimatePresence mode="wait">
          <motion.span key={open ? 'x' : 'm'} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}>
            {open ? <X size={24} /> : <MessageCircle size={24} />}
          </motion.span>
        </AnimatePresence>
        {!open && unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white ring-2 ring-canvas">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            className="card fixed bottom-24 right-5 z-40 flex h-[34rem] max-h-[78vh] w-[24rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden shadow-float"
          >
            {activeUserId && activeContact ? (
              <Conversation contact={activeContact} online={online} meRole={user?.role} />
            ) : (
              <ContactList
                contacts={contacts}
                online={online}
                onPick={openConversation}
                isAdmin={user?.role === 'admin'}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ContactList({ contacts, online, onPick, isAdmin }) {
  return (
    <>
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="font-display text-base font-semibold">Messages</h3>
        <span className="text-xs text-faint">{isAdmin ? 'Your team' : 'Project head'}</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {contacts.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-faint">No one to chat with yet.</p>
        ) : (
          contacts.map(({ user: u, lastMessage, unread }) => (
            <button
              key={u._id}
              onClick={() => onPick(u._id)}
              className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left last:border-0 hover:bg-elevated"
            >
              <div className="relative">
                <Avatar user={u} size="md" />
                {online.has(String(u._id)) && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-surface" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-semibold">{u.name}</span>
                  {u.role === 'admin' && <ShieldCheck size={13} className="shrink-0 text-accent" />}
                </div>
                <p className="truncate text-xs text-faint">
                  {lastMessage ? lastMessage.body : 'Start a conversation'}
                </p>
              </div>
              {unread > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-ink">
                  {unread}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </>
  );
}

function Conversation({ contact, online, meRole }) {
  const { messages, sendMessage, closePanel, openPanel, setTyping, typingFrom } = useChatStore();
  const back = () => useChatStore.setState({ activeUserId: null, messages: [] });
  const user = useAuthStore((s) => s.user);
  const [text, setText] = useState('');
  const scrollRef = useRef(null);
  const typingTimer = useRef(null);
  const u = contact.user;
  const isOnline = online.has(String(u._id));
  const theyreTyping = typingFrom && String(typingFrom) === String(u._id);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, theyreTyping]);

  function onChange(e) {
    setText(e.target.value);
    setTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setTyping(false), 1200);
  }

  function submit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage(text);
    setText('');
    setTyping(false);
  }

  return (
    <>
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <button onClick={back} className="btn-ghost h-8 w-8 rounded-lg p-0"><ArrowLeft size={18} /></button>
        <div className="relative">
          <Avatar user={u} size="sm" />
          {isOnline && <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-surface" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="truncate text-sm font-semibold">{u.name}</span>
            {u.role === 'admin' && <ShieldCheck size={12} className="text-accent" />}
          </div>
          <span className="text-xs text-faint">{isOnline ? 'Online' : 'Offline'}</span>
        </div>
        <button onClick={closePanel} className="btn-ghost h-8 w-8 rounded-lg p-0"><X size={16} /></button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-canvas px-3 py-3">
        {messages.length === 0 && (
          <p className="py-8 text-center text-xs text-faint">No messages yet — say hello 👋</p>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m) => {
            const mine = String(m.sender?._id || m.sender) === String(user._id);
            return (
              <motion.div
                key={m._id || m.createdAt}
                layout
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${
                    mine ? 'rounded-br-sm bg-accent text-accent-ink' : 'rounded-bl-sm bg-surface border border-border text-ink'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`mt-0.5 text-[10px] ${mine ? 'text-accent-ink/70' : 'text-faint'}`}>{timeAgo(m.createdAt)}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {theyreTyping && (
          <div className="flex justify-start">
            <div className="flex gap-1 rounded-2xl rounded-bl-sm border border-border bg-surface px-3 py-2.5">
              {[0, 1, 2].map((i) => (
                <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-faint"
                  animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />
              ))}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={submit} className="flex items-center gap-2 border-t border-border p-2.5">
        <input
          value={text}
          onChange={onChange}
          placeholder="Type a message…"
          className="input flex-1"
        />
        <button type="submit" disabled={!text.trim()} className="btn-primary h-9 w-9 rounded-lg p-0">
          <Send size={16} />
        </button>
      </form>
    </>
  );
}
