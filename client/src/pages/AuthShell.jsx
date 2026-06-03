import { motion } from 'framer-motion';

// Split-screen auth layout: branded panel + animated form card.
export default function AuthShell({ children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(40rem 30rem at 20% 20%, rgba(139,109,255,0.45), transparent 60%), radial-gradient(36rem 30rem at 90% 90%, rgba(91,61,245,0.4), transparent 55%)',
          }}
        />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2.5"
          >
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 font-display text-lg font-bold">
              Z
            </div>
            <span className="font-display text-xl font-bold tracking-tight">ZiraClone</span>
          </motion.div>

          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-display text-4xl font-bold leading-tight"
            >
              Ship work that
              <br />
              <span className="text-accent" style={{ color: '#b9a7ff' }}>
                moves the needle.
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-4 max-w-md text-white/60"
            >
              Plan sprints, track issues on a fluid Kanban board, and watch progress unfold —
              all in one beautifully crafted workspace.
            </motion.p>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm text-white/40"
          >
            © {new Date().getFullYear()} ZiraClone — built on the MERN stack.
          </motion.p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 24 }}
          className="w-full max-w-sm"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
