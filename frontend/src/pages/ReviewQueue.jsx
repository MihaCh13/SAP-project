import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { getDefaultMockDrafts, loadMockDrafts, documentAuthorDisplay } from '../lib/mockDrafts'
import { getSession } from '../lib/session'
import { approveDocument, canReviewDocumentAction, rejectDocument } from '../lib/mockWorkflowService'

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function toViewerHtml(raw) {
  const s = String(raw ?? '')
  if (!s.trim()) return ''
  if (/[<>]/.test(s) && /<\/?[a-z][\s\S]*>/i.test(s)) return s
  return escapeHtml(s).replace(/\n/g, '<br />')
}

function CoffeeIcon({ className = 'h-9 w-9 text-slate-700' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 8h1a3 3 0 010 6h-1m0-6H7v7a4 4 0 004 4h2a4 4 0 004-4V8zM6 21h12"
      />
    </svg>
  )
}

function formatTimestamp(iso) {
  const date = iso ? new Date(iso) : new Date()
  try {
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return date.toISOString()
  }
}

function readDraftsForSession() {
  const s = getSession()
  if (!s?.userId) return getDefaultMockDrafts()
  return loadMockDrafts()
}

export default function ReviewQueue() {
  const navigate = useNavigate()
  const session = getSession()

  const [allDrafts, setAllDrafts] = useState(readDraftsForSession)
  const queue = useMemo(
    () => allDrafts.filter((d) => d.status === 'SUBMITTED'),
    [allDrafts],
  )

  const [activeId, setActiveId] = useState(/** @type {string | null} */ (null))
  const [toast, setToast] = useState(/** @type {string | null} */ (null))
  const [rejectMode, setRejectMode] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const selected = useMemo(() => queue.find((d) => d.id === activeId) ?? null, [queue, activeId])
  const viewerTopRef = useRef(/** @type {HTMLDivElement | null} */ (null))

  useEffect(() => {
    if (queue.length === 0) {
      setActiveId(null)
      setRejectMode(false)
      setRejectReason('')
      return
    }
    if (activeId && queue.some((d) => d.id === activeId)) return
    setActiveId(queue[0].id)
  }, [queue, activeId])

  useEffect(() => {
    if (!toast) return undefined
    const t = window.setTimeout(() => setToast(null), 2400)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    setRejectMode(false)
    setRejectReason('')
    const el = viewerTopRef.current
    if (el) el.scrollIntoView({ block: 'start' })
  }, [activeId])

  useEffect(() => {
    function onDocsUpdated() {
      setAllDrafts(readDraftsForSession())
    }
    window.addEventListener('sap_dm_mock_documents_updated', onDocsUpdated)
    return () => window.removeEventListener('sap_dm_mock_documents_updated', onDocsUpdated)
  }, [])

  function selectNextAfter(removingId) {
    const idx = queue.findIndex((d) => d.id === removingId)
    const next = queue[idx + 1] ?? queue[idx - 1] ?? null
    setActiveId(next?.id ?? null)
  }

  function handleApprove() {
    if (!selected || !session) return
    const id = selected.id
    try {
      approveDocument(id, session)
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Could not approve')
      return
    }
    setAllDrafts(loadMockDrafts())
    setToast('Document Approved')
    selectNextAfter(id)
  }

  function handleConfirmReject() {
    if (!selected || !session) return
    const reason = rejectReason.trim()
    if (!reason) return
    const id = selected.id
    const nowIso = new Date().toISOString()
    try {
      rejectDocument(id, session, reason, {
        reviewerLabel: session.displayName ?? 'Reviewer',
        timestampLabel: formatTimestamp(nowIso),
      })
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Could not reject')
      return
    }
    setAllDrafts(loadMockDrafts())
    setToast('Document Rejected')
    setRejectMode(false)
    setRejectReason('')
    selectNextAfter(id)
  }

  if (queue.length === 0) {
    return (
      <motion.div
        className="mx-auto flex max-w-4xl flex-1 items-center justify-center px-4 py-16"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-[0_12px_38px_-16px_rgba(15,23,42,0.22)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-100">
            <CoffeeIcon className="h-8 w-8 text-slate-700" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-900">All caught up!</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            There are no documents waiting for your review.
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Back to Dashboard
          </button>
        </div>
      </motion.div>
    )
  }

  const author = selected ? documentAuthorDisplay(selected) : '—'
  const canReviewSelected = Boolean(selected && session && canReviewDocumentAction(selected, session))
  const updatedAtLabel = selected?.updatedAt ? formatTimestamp(selected.updatedAt) : formatTimestamp()
  const bodyHtml = toViewerHtml(
    selected?.body && String(selected.body).trim().length > 0 ? selected.body : selected?.snippet ?? '',
  )

  return (
    <div className="mx-auto max-w-6xl px-4 pb-10 pt-6">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="lg:col-span-1">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">Inbox</h1>
              <p className="mt-1 text-xs text-slate-500">{queue.length} waiting</p>
            </div>
          </div>
          <div className="h-[calc(100vh-80px)] overflow-y-auto rounded-2xl border border-slate-100 bg-white/70 p-3 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.25)]">
            <div className="space-y-3">
              {queue.map((doc) => {
                const isActive = doc.id === activeId
                const a = documentAuthorDisplay(doc)
                const t = formatTimestamp(doc.updatedAt)
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setActiveId(doc.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      isActive
                        ? 'border-purple-200 bg-purple-50 ring-2 ring-purple-200/60'
                        : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <p className={`line-clamp-2 text-sm leading-snug ${isActive ? 'font-semibold text-slate-900' : 'font-medium text-slate-900'}`}>
                      {doc.title}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className={`${isActive ? 'font-medium text-slate-700' : ''}`}>{a}</span>
                      <span className="text-slate-300" aria-hidden>
                        •
                      </span>
                      <span>{t}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        <section className="lg:col-span-2">
          <div className="flex h-[calc(100vh-80px)] flex-col rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
            <div ref={viewerTopRef} />
            <header className="border-b border-slate-100 px-6 py-5">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{selected?.title ?? ''}</h2>
              <p className="mt-1 text-sm text-slate-600">
                <span className="font-medium text-slate-800">{author}</span>
                <span className="mx-2 text-slate-300" aria-hidden>
                  •
                </span>
                <span>{updatedAtLabel}</span>
              </p>
            </header>

            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 overflow-y-auto p-8">
                <div className="prose prose-slate max-w-none">
                  <div
                    className="break-words text-[15.5px] leading-7 text-slate-800 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_p]:my-3"
                    dangerouslySetInnerHTML={{ __html: bodyHtml || '<p>No content provided.</p>' }}
                  />
                </div>
              </div>

              <div className="sticky bottom-0 border-t border-slate-100 bg-white p-4">
                {!rejectMode ? (
                  <div className="flex items-center justify-end gap-3">
                    {canReviewSelected ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setRejectMode(true)}
                          className="inline-flex items-center justify-center rounded-xl border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={handleApprove}
                          className="inline-flex items-center justify-center rounded-xl bg-green-100 px-5 py-2.5 text-sm font-semibold text-green-800 shadow-sm ring-1 ring-green-200/80 transition hover:bg-green-200 hover:text-green-950"
                        >
                          Approve
                        </button>
                      </>
                    ) : (
                      <p className="text-right text-sm font-medium text-red-600">
                        You cannot review your own document.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label htmlFor="reject-reason" className="sr-only">
                      Reason for rejection (Required)
                    </label>
                    <textarea
                      id="reject-reason"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={3}
                      placeholder="Reason for rejection (Required)..."
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
                    />
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setRejectMode(false)
                          setRejectReason('')
                        }}
                        className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={!rejectReason.trim()}
                        onClick={handleConfirmReject}
                        className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Confirm Rejection
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      <AnimatePresence>
        {toast ? (
          <motion.div
            key={toast}
            role="status"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.22 }}
            className="fixed bottom-6 left-1/2 z-[60] max-w-[min(92vw,22rem)] -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white shadow-lg"
          >
            {toast}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

