import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, ChevronDown, UserCog } from 'lucide-react';
import ThemeToggle from '../ThemeToggle.jsx';
import Avatar from '../ui/Avatar.jsx';
import ProfileModal from '../profile/ProfileModal.jsx';
import { useAuthStore } from '../../store/authStore.js';
import { toast } from '../../store/toastStore.js';

export default function Topbar({ title, children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function onLogout() {
    await logout();
    toast.info('Signed out');
    navigate('/login');
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-surface/80 px-5 backdrop-blur-md">
      <h1 className="font-display text-xl font-bold tracking-tight">{title}</h1>
      <div className="ml-auto flex items-center gap-3">
        {children}
        <ThemeToggle />
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-elevated"
          >
            <Avatar user={user} size="sm" />
            <ChevronDown size={14} className="text-faint" />
          </button>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="card absolute right-0 mt-2 w-56 overflow-hidden p-2 shadow-float"
              >
                <div className="flex items-center gap-3 px-2 py-2">
                  <Avatar user={user} size="md" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{user?.name}</p>
                    <p className="truncate text-xs text-faint">{user?.email}</p>
                  </div>
                </div>
                <div className="my-1 h-px bg-border" />
                <button
                  onClick={() => { setProfileOpen(true); setOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-muted hover:bg-elevated hover:text-ink"
                >
                  <UserCog size={16} /> Edit profile
                </button>
                <button
                  onClick={onLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-muted hover:bg-elevated hover:text-ink"
                >
                  <LogOut size={16} /> Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </header>
  );
}
