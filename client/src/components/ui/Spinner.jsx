import { motion } from 'framer-motion';

export default function Spinner({ size = 20, className = '' }) {
  return (
    <motion.span
      className={`inline-block rounded-full border-2 border-accent/30 border-t-accent ${className}`}
      style={{ width: size, height: size }}
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, ease: 'linear', duration: 0.7 }}
    />
  );
}
