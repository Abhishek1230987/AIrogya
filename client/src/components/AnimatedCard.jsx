import { motion } from "framer-motion";

export default function AnimatedCard({ children, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.995 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`relative rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm shadow-md ring-1 ring-black/5 dark:ring-white/10 hover:shadow-xl dark:hover:shadow-gray-900/50 transition-all duration-300 ${className}`}
    >
      {children}
    </motion.div>
  );
}
