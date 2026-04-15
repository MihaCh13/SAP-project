import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

/**
 * @typedef {{ reviewerName: string, timestamp: string, comment: string, documentTitle?: string }} DraftFeedbackPayload
 */

/**
 * Slide-out panel for reviewer feedback on rejected drafts (same motion pattern as DocumentDrawer).
 * @param {{ payload: DraftFeedbackPayload | null, onClose: () => void }} props
 */
export default function DraftFeedbackDrawer({ payload, onClose }) {
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!payload) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(e) {
      if (e.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [payload])

  return (
    <AnimatePresence>
      {payload ? (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          aria-modal="true"
          role="dialog"
          aria-labelledby="feedback-drawer-title"
        >
          <motion.div
            key="feedback-backdrop"
            role="presentation"
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
          />
          <motion.aside
            key="feedback-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex h-full w-full max-w-lg flex-col bg-white shadow-[-12px_0_40px_-12px_rgba(15,23,42,0.25)] md:w-[40vw] md:max-w-none"
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div className="min-w-0 pt-1">
                <h2 id="feedback-drawer-title" className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
                  Reviewer Feedback
                </h2>
                {payload.documentTitle ? (
                  <p className="mt-2 text-sm font-medium text-slate-700">{payload.documentTitle}</p>
                ) : null}
                <p className="mt-2 text-sm text-slate-600">
                  <span className="font-medium text-slate-800">{payload.reviewerName}</span>
                  <span className="text-slate-400"> · </span>
                  <span className="text-slate-500">{payload.timestamp}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
              <blockquote className="rounded-xl border border-rose-100 bg-rose-50/80 px-5 py-4 text-base leading-relaxed text-slate-800 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-wide text-rose-800/90">Comment</p>
                <p className="mt-3 text-slate-800">{payload.comment}</p>
              </blockquote>
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
