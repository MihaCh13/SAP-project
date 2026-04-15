import { useCallback, useEffect, useId, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const FAQ_ITEMS = [
  {
    id: 'rejected',
    q: "Why is my document status REJECTED?",
    a: "The reviewer found issues. Check the 'Feedback' icon in My Drafts.",
  },
  {
    id: 'roles',
    q: 'How can I request additional roles?',
    a: 'Contact the Administrator via the support form below.',
  },
  {
    id: 'draft',
    q: "What happens when I 'Save as Draft'?",
    a: "Your work is saved locally and only you can see it until you 'Submit'.",
  },
]

const SUPPORT_EMAIL = 'support@example.com'

function GuideCard({ title, description, iconWrapClass, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col items-start rounded-2xl border border-slate-100 bg-white p-6 text-left shadow-sm transition-shadow hover:cursor-pointer hover:shadow-md"
    >
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${iconWrapClass}`}>{icon}</div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
    </button>
  )
}

function FaqAccordionItem({ item, open, onToggle }) {
  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        type="button"
        id={`faq-trigger-${item.id}`}
        aria-expanded={open}
        aria-controls={`faq-panel-${item.id}`}
        onClick={() => onToggle(item.id)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-semibold text-slate-900 transition hover:text-[#0056b3]"
      >
        {item.q}
        <span
          className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={`faq-panel-${item.id}`}
            role="region"
            aria-labelledby={`faq-trigger-${item.id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-4 pr-8 text-sm leading-relaxed text-slate-600">{item.a}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

/**
 * @param {{ open: boolean, onClose: () => void }} props
 */
function InquiryModal({ open, onClose }) {
  const titleId = useId()
  const onCloseRef = useCallback(() => onClose(), [onClose])

  useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(e) {
      if (e.key === 'Escape') onCloseRef()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onCloseRef])

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            aria-label="Close"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <h2 id={titleId} className="text-lg font-semibold text-slate-900">
              Send inquiry
            </h2>
            <p className="mt-1 text-sm text-slate-500">We&apos;ll route this to the administrator (mock).</p>
            <form
              className="mt-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                console.log('Inquiry (mock):', Object.fromEntries(fd.entries()))
                onClose()
              }}
            >
              <label className="block">
                <span className="text-xs font-medium text-slate-600">Subject</span>
                <input
                  name="subject"
                  required
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                  placeholder="Brief subject"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-slate-600">Message</span>
                <textarea
                  name="message"
                  required
                  rows={4}
                  className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                  placeholder="How can we help?"
                />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#0056b3] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#004a9a]"
                >
                  Submit
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}

export default function HelpCenter() {
  const [openFaqId, setOpenFaqId] = useState(/** @type {string | null} */ (null))
  const [inquiryOpen, setInquiryOpen] = useState(false)

  function scrollToSection(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="mx-auto max-w-5xl pb-16 pt-2">
      <section className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-slate-800">Hello, how can we help you today?</h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-600">Find guides, FAQs, and support resources below.</p>
      </section>

      <section className="mb-10 grid gap-4 md:grid-cols-3">
        <GuideCard
          title="Reader Guide"
          description="Learn how to find and filter documents."
          iconWrapClass="bg-sky-100 text-sky-600"
          onClick={() => scrollToSection('faq')}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v15.128c.938.332 1.948.512 3 .512 4.148 0 7.5-3.582 7.5-8.25S10.148 3.75 12 3.75z" />
            </svg>
          }
        />
        <GuideCard
          title="Author Guide"
          description="Master the editor and submission process."
          iconWrapClass="bg-emerald-100 text-emerald-600"
          onClick={() => scrollToSection('faq')}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          }
        />
        <GuideCard
          title="Reviewer Guide"
          description="Efficiently handle the review queue."
          iconWrapClass="bg-purple-100 text-purple-600"
          onClick={() => scrollToSection('faq')}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </section>

      <section id="faq" className="mb-10 scroll-mt-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
        <h2 className="text-xl font-semibold text-slate-900">Frequently asked questions</h2>
        <p className="mt-1 text-sm text-slate-600">Tap a question to expand the answer.</p>
        <div className="mt-2 divide-y divide-slate-100">
          {FAQ_ITEMS.map((item) => (
            <FaqAccordionItem
              key={item.id}
              item={item}
              open={openFaqId === item.id}
              onToggle={(id) => setOpenFaqId((prev) => (prev === id ? null : id))}
            />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-blue-100 bg-blue-50 p-6 md:p-8">
        <h2 className="text-lg font-semibold text-slate-900">Still need help?</h2>
        <p className="mt-2 text-sm text-slate-700">
          Email us at{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-[#0056b3] underline-offset-2 hover:underline">
            {SUPPORT_EMAIL}
          </a>
        </p>
        <button
          type="button"
          onClick={() => setInquiryOpen(true)}
          className="mt-4 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-800 shadow-sm transition hover:bg-blue-100/50"
        >
          {String.fromCodePoint(0x2709)} Send Inquiry
        </button>
      </section>

      <InquiryModal open={inquiryOpen} onClose={() => setInquiryOpen(false)} />
    </div>
  )
}
