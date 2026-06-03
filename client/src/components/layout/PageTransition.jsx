import { motion } from 'framer-motion';

// Wraps page content with a staggered fade/slide reveal on route change.
export default function PageTransition({ children, className = '' }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`flex-1 ${className}`}
    >
      {children}
    </motion.main>
  );
}
