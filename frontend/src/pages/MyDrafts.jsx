import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import DraftFeedbackDrawer from '../components/DraftFeedbackDrawer'
import { appendMockAuditLog } from '../lib/mockAuditLogs'
import { getDefaultMockDrafts, loadMockDrafts, persistMockDrafts, documentAuthorId } from '../lib/mockDrafts'
import { getSession } from '../lib/session'
import { submitDocumentForReview } from '../lib/mockWorkflowService'

const cardShadow = 'shadow-[0_4px_28px_-6px_rgba(15,23,42,0.1)]'

const inputFocus =
  'rounded-xl border border-slate-200 bg-white text-slate-900 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100'

/** @typedef {import('../lib/mockDrafts.js').MockDraft} DraftDoc */

function SearchIcon({ className = 'h-5 w-5 text-slate-400' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  )
}

function PaperPlaneIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
      />
    </svg>
  )
}

function TrashIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  )
}

function FeedbackIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.967 3.746 3.746 0 01-3.746 3.746 3.745 3.745 0 01-1.029-.368 3.742 3.742 0 01-3.742 3.742 3.742 3.742 0 01-3.742-3.742 3.745 3.745 0 01-1.029.368 3.746 3.746 0 01-3.746-3.746 3.745 3.745 0 01-1.043-3.967A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.967 3.746 3.746 0 013.746-3.746 3.745 3.745 0 011.029.368 3.742 3.742 0 013.742-3.742 3.742 3.742 0 013.742 3.742 3.745 3.745 0 011.029-.368 3.746 3.746 0 013.746 3.746 3.745 3.745 0 011.043 3.967A3.745 3.745 0 0121 12z"
      />
    </svg>
  )
}

function statusBadgeClasses(status) {
  if (status === 'REJECTED') {
    return 'bg-orange-100 text-red-900 ring-1 ring-orange-200/90'
  }
  return 'bg-sky-100 text-blue-900 ring-1 ring-sky-200/90'
}

function readDraftsForSession() {
  const s = getSession()
  if (!s?.userId) return getDefaultMockDrafts()
  return loadMockDrafts()
}

export default function MyDrafts() {
  const navigate = useNavigate()
  const session = getSession()
  const [drafts, setDrafts] = useState(readDraftsForSession)
  const [query, setQuery] = useState('')
  const [sortOrder, setSortOrder] = useState(
    /** @type {'newest' | 'oldest' | 'titleAsc' | 'titleDesc'} */ ('newest'),
  )
  const [feedbackPayload, setFeedbackPayload] = useState(
    /** @type {{ reviewerName: string, timestamp: string, comment: string, documentTitle: string } | null} */
    (null),
  )
  const [toast, setToast] = useState(/** @type {string | null} */ (null))

  useEffect(() => {
    if (session?.userId) persistMockDrafts(drafts)
  }, [drafts, session?.userId])

  useEffect(() => {
    function onDocsUpdated() {
      setDrafts(loadMockDrafts())
    }
    window.addEventListener('sap_dm_mock_documents_updated', onDocsUpdated)
    return () => window.removeEventListener('sap_dm_mock_documents_updated', onDocsUpdated)
  }, [])

  useEffect(() => {
    if (!toast) return undefined
    const t = window.setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const activeCount = useMemo(() => {
    const uid = session?.userId
    return drafts.filter(
      (d) =>
        (d.status === 'DRAFT' || d.status === 'REJECTED') &&
        (!uid || documentAuthorId(d) === uid),
    ).length
  }, [drafts, session?.userId])

  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase()
    const uid = session?.userId
    let list = drafts.filter(
      (d) =>
        (d.status === 'DRAFT' || d.status === 'REJECTED') &&
        (!uid || documentAuthorId(d) === uid) &&
        (!q || d.title.toLowerCase().includes(q)),
    )
    list = [...list].sort((a, b) => {
      if (sortOrder === 'titleAsc') {
        return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
      }
      if (sortOrder === 'titleDesc') {
        return b.title.localeCompare(a.title, undefined, { sensitivity: 'base' })
      }
      const ta = new Date(a.updatedAt).getTime()
      const tb = new Date(b.updatedAt).getTime()
      return sortOrder === 'newest' ? tb - ta : ta - tb
    })
    return list
  }, [drafts, query, sortOrder, session?.userId])

  function showToast(message) {
    setToast(message)
  }

  function handleSubmit(id) {
    if (!session) {
      showToast('Sign in required.')
      return
    }
    const res = submitDocumentForReview(id, session)
    if (!res.ok) {
      showToast(res.message ?? 'Submit failed')
      return
    }
    setDrafts(loadMockDrafts())
    showToast('Document submitted for review')
  }

  function handleDelete(id) {
    const doc = drafts.find((d) => d.id === id)
    setDrafts((prev) => prev.filter((d) => d.id !== id))
    if (session && doc) {
      appendMockAuditLog({
        actorUserId: session.userId,
        actorDisplayName: session.displayName ?? session.userId,
        action: `Deleted draft "${doc.title}"`,
        category: 'DOCUMENT',
        type: 'WARNING',
        details: { documentId: id },
      })
    }
    showToast('Draft deleted')
  }

  function openFeedback(doc) {
    if (!doc.feedback) return
    setFeedbackPayload({
      ...doc.feedback,
      documentTitle: doc.title,
    })
  }

  return (
    <motion.div
      className="mx-auto max-w-6xl pb-12"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">My Drafts</h1>
          <span className="inline-flex items-center rounded-full bg-[#D9EEFC] px-3.5 py-1.5 text-sm font-medium text-[#003d7a] ring-1 ring-sky-200/60">
            {activeCount} Active
          </span>
        </div>
        <motion.button
          type="button"
          onClick={() => navigate('/new-document')}
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl bg-green-100 px-4 py-2.5 text-sm font-semibold text-green-800 shadow-sm ring-1 ring-green-200/80 transition hover:bg-green-200 hover:text-green-950 md:self-auto"
          animate={{
            boxShadow: [
              '0 1px 3px rgba(22,163,74,0.12)',
              '0 4px 18px rgba(22,163,74,0.28)',
              '0 1px 3px rgba(22,163,74,0.12)',
            ],
          }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-base leading-none">+</span>
          New Document
        </motion.button>
      </header>

      <div className={`mb-8 flex flex-col gap-4 rounded-2xl border border-slate-100/90 bg-white p-4 md:p-5 ${cardShadow} md:flex-row md:items-center`}>
        <div className="relative w-full md:flex-1">
          <label htmlFor="my-drafts-search" className="sr-only">
            Search drafts by title
          </label>
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            id="my-drafts-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title..."
            className={`w-full py-3 pr-4 pl-11 text-sm ${inputFocus}`}
          />
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end md:w-auto md:min-w-[280px]">
          <label htmlFor="my-drafts-sort" className="shrink-0 text-sm font-medium text-slate-600">
            Sort by
          </label>
          <select
            id="my-drafts-sort"
            value={sortOrder}
            onChange={(e) =>
              setSortOrder(/** @type {'newest' | 'oldest' | 'titleAsc' | 'titleDesc'} */ (e.target.value))
            }
            className={`w-full cursor-pointer py-3 pr-10 pl-4 text-sm text-slate-800 sm:max-w-xs ${inputFocus}`}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="titleAsc">A-Z (Title)</option>
            <option value="titleDesc">Z-A (Title)</option>
          </select>
        </div>
      </div>

      {filteredSorted.length === 0 ? (
        <div className={`rounded-2xl border border-dashed border-slate-200 bg-white/80 p-10 text-center text-sm text-slate-500 ${cardShadow}`}>
          No drafts match your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredSorted.map((doc) => (
            <article
              key={doc.id}
              className={`flex h-full flex-col rounded-2xl border border-slate-100/90 bg-white p-5 ${cardShadow}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="min-w-0 flex-1 text-base font-semibold leading-snug text-slate-900">{doc.title}</h2>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  {doc.status === 'REJECTED' && doc.feedback ? (
                    <button
                      type="button"
                      onClick={() => openFeedback(doc)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-900 shadow-sm transition hover:bg-rose-100"
                      title="View reviewer feedback"
                    >
                      <FeedbackIcon className="h-3.5 w-3.5" />
                      Feedback
                    </button>
                  ) : null}
                  <span
                    className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusBadgeClasses(doc.status)}`}
                  >
                    {doc.status}
                  </span>
                </div>
              </div>

              <p className="mt-3 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-600">{doc.snippet}</p>

              <p className="mt-4 text-xs text-slate-400">Last edited: {doc.lastEditedLabel}</p>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => navigate(`/new-document?id=${encodeURIComponent(doc.id)}`)}
                  className="cursor-pointer text-sm font-semibold text-[#0056b3] transition hover:text-[#004494] hover:underline"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit(doc.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0056b3] px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#004494]"
                >
                  <PaperPlaneIcon className="h-4 w-4" />
                  Submit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(doc.id)}
                  className="ml-auto inline-flex rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  aria-label={`Delete ${doc.title}`}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <DraftFeedbackDrawer payload={feedbackPayload} onClose={() => setFeedbackPayload(null)} />

      <AnimatePresence>
        {toast ? (
          <motion.div
            key={toast}
            role="status"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.22 }}
            className="fixed bottom-6 left-1/2 z-[60] max-w-[min(90vw,22rem)] -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white shadow-lg"
          >
            {toast}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  )
}
