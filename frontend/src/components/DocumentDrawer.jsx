import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

/**
 * @typedef {{ id: string, title: string, author: string, approvedLabel: string, content: string, status: string }} PublicDoc
 */

/**
 * Slide-out quick view for a public document.
 * @param {{ doc: PublicDoc | null, onClose: () => void, onDownload: (format: 'PDF' | 'TXT') => void }} props
 */
export default function DocumentDrawer({ doc, onClose, onDownload }) {
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!doc) return undefined
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
  }, [doc])

  return (
    <AnimatePresence>
      {doc ? (
        <div className="fixed inset-0 z-50 flex justify-end" aria-modal="true" role="dialog" aria-labelledby="drawer-doc-title">
          <motion.div
            key="drawer-backdrop"
            role="presentation"
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
          />
          <motion.aside
            key="drawer-panel"
            id="document-drawer-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex h-full w-full max-w-lg flex-col bg-white shadow-[-12px_0_40px_-12px_rgba(15,23,42,0.25)] md:w-[40vw] md:max-w-none"
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div className="min-w-0 pt-1">
                <h2 id="drawer-doc-title" className="text-xl font-semibold leading-snug tracking-tight text-slate-900 md:text-2xl">
                  {doc.title}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {doc.author}
                </p>
                <p className="mt-1 text-xs text-slate-400">Approved {doc.approvedLabel}</p>
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
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Content</p>
              <div className="mt-4 max-w-none text-base leading-relaxed text-slate-700">
                {doc.content.split(/\n\n+/).map((para, i) => (
                  <p key={i} className="mb-5 last:mb-0">
                    {para}
                  </p>
                ))}
              </div>
            </div>

            <div className="sticky bottom-0 shrink-0 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur-sm">
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => onDownload('PDF')}
                  className="flex-1 rounded-xl bg-[#0056b3] px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#004494]"
                >
                  Download as PDF
                </button>
                <button
                  type="button"
                  onClick={() => onDownload('TXT')}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                >
                  Download as TXT
                </button>
              </div>
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
