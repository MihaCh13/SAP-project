import { useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getSession } from '../../lib/session'

/**
 * Full-screen blurred gradient; "Hello, [Name]!" fades in 1s, holds 1s, fades out 1s.
 */
export default function WelcomeSequence({ active, onComplete }) {
  const name = useMemo(
    () => (active ? getSession()?.displayName ?? 'User' : ''),
    [active],
  )
  const completedRef = useRef(false)

  useEffect(() => {
    if (active) completedRef.current = false
  }, [active])

  function handleTextAnimationComplete() {
    if (!active || completedRef.current) return
    completedRef.current = true
    onComplete()
  }

  useEffect(() => {
    if (!active) return undefined
    const fallback = window.setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true
        onComplete()
      }
    }, 3200)
    return () => clearTimeout(fallback)
  }, [active, onComplete])

  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div
            className="absolute inset-0 backdrop-blur-2xl"
            style={{
              background:
                'linear-gradient(135deg, rgba(0,86,179,0.38) 0%, rgba(147,112,219,0.28) 42%, rgba(125,211,192,0.32) 100%)',
            }}
            aria-hidden
          />
          <motion.p
            className="relative z-10 max-w-[90vw] text-center text-3xl font-extralight tracking-tight text-white drop-shadow-sm sm:text-4xl"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 3,
              times: [0, 0.333, 0.667, 1],
              ease: 'easeInOut',
            }}
            onAnimationComplete={handleTextAnimationComplete}
          >
            Hello, {name}!
          </motion.p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
