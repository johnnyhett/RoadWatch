'use client';

import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

/**
 * Client shell for global motion behaviour and route transitions.
 *
 * `reducedMotion="user"` makes every framer-motion animation in the tree honour
 * the OS "reduce motion" setting; this app is animation-heavy and previously
 * ignored that preference entirely.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
          className="w-full h-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
  );
}
