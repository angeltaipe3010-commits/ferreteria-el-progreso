import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { ease } from './ui'

/** Envoltura de cada página: entra subiendo suavemente y sale desvaneciéndose */
export default function Page({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      exit="exit"
      variants={{
        hidden: { opacity: 0, y: 10 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.35, ease, staggerChildren: 0.06, delayChildren: 0.05 },
        },
        exit: { opacity: 0, y: -8, transition: { duration: 0.18, ease } },
      }}
      className="mx-auto flex max-w-[1400px] flex-col gap-6"
    >
      {children}
    </motion.div>
  )
}
