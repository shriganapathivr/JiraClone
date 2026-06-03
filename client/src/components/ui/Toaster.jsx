import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { useToastStore } from '../../store/toastStore.js';

const META = {
  success: { icon: CheckCircle2, color: '#36b37e' },
  error: { icon: XCircle, color: '#e0344b' },
  info: { icon: Info, color: '#4c9aff' },
};

export default function Toaster() {
  const { toasts, dismiss } = useToastStore();
  return (
    <div className="fixed bottom-5 right-5 z-[60] flex w-80 flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => {
          const { icon: Icon, color } = META[t.type] || META.info;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className="card flex items-start gap-3 p-3.5 shadow-float"
            >
              <Icon size={18} style={{ color }} className="mt-0.5 shrink-0" />
              <p className="flex-1 text-sm text-ink">{t.message}</p>
              <button onClick={() => dismiss(t.id)} className="text-faint hover:text-ink">
                <X size={15} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
