import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { getMockAuditLogs } from '../lib/mockAuditLogs'
import { getSession } from '../lib/session'

const PAGE_SIZE = 10

/** @param {string} iso */
function formatLogTime(iso) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

/** @param {string} iso — full sentence-friendly time */
function formatLogTimeSentence(iso) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

/** @param {string} key */
function humanizeDetailKey(key) {
  const map = {
    isPending: 'Access request',
    isActive: 'Account active',
    status: 'Status',
    roles: 'Roles',
    ip: 'IP address',
    targetId: 'Target ID',
    sessionId: 'Session',
    userAgent: 'User agent',
    tokenTtlMin: 'Token lifetime (minutes)',
    visibility: 'Visibility',
    publishedAt: 'Published at',
    approvedAt: 'Approved at',
    commentId: 'Comment',
    version: 'Version',
    workflow: 'Workflow',
    reason: 'Reason',
    requestsInWindow: 'Requests in window',
    throttled: 'Throttled',
    retryAfterSec: 'Retry after (seconds)',
    start: 'Start',
    durationMin: 'Duration (minutes)',
    anchor: 'Anchor',
    commentCount: 'Comments',
    rowsAffected: 'Rows affected',
    archivedBefore: 'Archived before',
    rejected: 'Rejected',
    sha256: 'Checksum',
  }
  return map[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim()
}

/** @param {string} key @param {unknown} val */
function humanizeDetailValue(key, val) {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'object' && !Array.isArray(val)) return formatObjectFriendly(/** @type {Record<string, unknown>} */ (val))
  if (typeof val === 'boolean') {
    if (key === 'isPending') return val ? 'Pending' : 'Cleared'
    if (key === 'isActive') return val ? 'Active' : 'Inactive'
    if (key === 'throttled') return val ? 'Yes' : 'No'
    if (key === 'rejected') return val ? 'Yes' : 'No'
    return val ? 'Yes' : 'No'
  }
  if (typeof val === 'number') return String(val)
  if (Array.isArray(val)) return val.map((x) => humanizeDetailValue(key, x)).join(', ')
  if (typeof val !== 'string') return String(val)

  const upper = val.toUpperCase()
  const statusMap = {
    APPROVED: 'Approved ✅',
    REJECTED: `Rejected ${String.fromCodePoint(0x1f6d1)}`,
    IN_REVIEW: 'In review',
    SUBMITTED: 'Submitted',
    PUBLIC: 'Public',
    MANUAL_ADMIN: 'Manual (admin)',
  }
  if (statusMap[upper]) return statusMap[upper]
  return val
}

/** @param {Record<string, unknown>} obj */
function formatObjectFriendly(obj) {
  const entries = Object.entries(obj)
  if (entries.length === 0) return '—'
  return entries.map(([k, v]) => `${humanizeDetailKey(k)}: ${humanizeNested(v, k)}`).join('; ')
}

/** @param {unknown} v @param {string} key */
function humanizeNested(v, key) {
  if (v !== null && typeof v === 'object' && !Array.isArray(v)) return `{ ${formatObjectFriendly(/** @type {Record<string, unknown>} */ (v))} }`
  return humanizeDetailValue(key, v)
}

/**
 * Human-readable summary for the Log Inspector Overview tab.
 * @param {import('../lib/mockAuditLogs').AuditLogEntry} log
 */
function formatEventSummary(log) {
  const time = formatLogTimeSentence(log.timestamp)
  const sentence = `${log.user} performed ${log.action} at ${time}.`

  /** @type {{ label: string, oldText: string, newText: string }[]} */
  const changeRows = []
  const d = log.details

  if (d.oldValue !== undefined && d.newValue !== undefined) {
    const oldObj = typeof d.oldValue === 'object' && d.oldValue !== null && !Array.isArray(d.oldValue)
    const newObj = typeof d.newValue === 'object' && d.newValue !== null && !Array.isArray(d.newValue)
    if (oldObj && newObj) {
      const o = /** @type {Record<string, unknown>} */ (d.oldValue)
      const n = /** @type {Record<string, unknown>} */ (d.newValue)
      const keys = new Set([...Object.keys(o), ...Object.keys(n)])
      for (const k of keys) {
        const ov = o[k]
        const nv = n[k]
        if (JSON.stringify(ov) === JSON.stringify(nv)) continue
        changeRows.push({
          label: humanizeDetailKey(k),
          oldText: humanizeDetailValue(k, ov),
          newText: humanizeDetailValue(k, nv),
        })
      }
      if (changeRows.length === 0) {
        changeRows.push({
          label: 'Summary',
          oldText: humanizeDetailValue('old', d.oldValue),
          newText: humanizeDetailValue('new', d.newValue),
        })
      }
    } else {
      changeRows.push({
        label: 'Change',
        oldText: humanizeDetailValue('old', d.oldValue),
        newText: humanizeDetailValue('new', d.newValue),
      })
    }
  } else if (d.newValue !== undefined) {
    const nv = d.newValue
    if (typeof nv === 'object' && nv !== null && !Array.isArray(nv)) {
      for (const [k, v] of Object.entries(/** @type {Record<string, unknown>} */ (nv))) {
        changeRows.push({
          label: humanizeDetailKey(k),
          oldText: '—',
          newText: humanizeDetailValue(k, v),
        })
      }
    } else {
      changeRows.push({
        label: 'New value',
        oldText: '—',
        newText: humanizeDetailValue('new', nv),
      })
    }
  }

  return { sentence, changeRows }
}

/** @param {string} json */
function HighlightedJson({ json }) {
  const tokens = json
    .split(/(\s+|[{}[\],:]|"(?:\\.|[^"\\])*"|-?\d+\.?\d*(?:[eE][+-]?\d+)?|\btrue\b|\bfalse\b|\bnull\b)/g)
    .filter((x) => x !== '')

  return (
    <pre className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-950 p-4 font-mono text-xs leading-relaxed">
      {tokens.map((t, i) => {
        if (/^\s+$/.test(t)) return <Fragment key={i}>{t}</Fragment>
        if (/^["]/.test(t)) return <span key={i} className="text-sky-300">{t}</span>
        if (/^(true|false|null)$/.test(t)) return <span key={i} className="text-violet-300">{t}</span>
        if (/^-?\d/.test(t)) return <span key={i} className="text-amber-200">{t}</span>
        if (/^[{}[\],:]$/.test(t)) return <span key={i} className="text-slate-500">{t}</span>
        return <span key={i} className="text-slate-200">{t}</span>
      })}
    </pre>
  )
}

/** @param {'SUCCESS' | 'INFO' | 'WARNING' | 'DANGER'} type */
function statusDotClass(type) {
  switch (type) {
    case 'SUCCESS':
      return 'bg-emerald-500'
    case 'INFO':
      return 'bg-sky-500'
    case 'WARNING':
      return 'bg-amber-500'
    case 'DANGER':
      return 'bg-red-500'
    default:
      return 'bg-slate-400'
  }
}

/** @param {'SUCCESS' | 'INFO' | 'WARNING' | 'DANGER'} type */
function statusLabel(type) {
  switch (type) {
    case 'SUCCESS':
      return 'Success'
    case 'INFO':
      return 'Info'
    case 'WARNING':
      return 'Warning'
    case 'DANGER':
      return 'Danger'
    default:
      return type
  }
}

/**
 * @param {{ startMs: number | null, endMs: number | null }} range
 * @param {string} iso
 */
function inDateRange(range, iso) {
  if (range.startMs == null || range.endMs == null) return true
  const t = new Date(iso).getTime()
  return t >= range.startMs && t <= range.endMs
}

/** @param {unknown} val */
function escapeCsvField(val) {
  const s = String(val ?? '')
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

/**
 * @param {import('../lib/mockAuditLogs').AuditLogEntry[]} logs
 */
function handleExportCSV(logs) {
  const headers = ['Timestamp', 'Category', 'Type', 'User', 'Action']
  const headerLine = headers.map(escapeCsvField).join(',')
  const dataLines = logs.map((log) =>
    [log.timestamp, log.category, log.type, log.user, log.action].map(escapeCsvField).join(','),
  )
  const csv = [headerLine, ...dataLines].join('\r\n')
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const date = new Date().toISOString().slice(0, 10)
  const filename = `audit_logs_${date}.csv`
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * @param {import('../lib/mockAuditLogs').AuditLogEntry} log
 * @param {() => void} onClose
 */
function LogInspectorDrawer({ log, onClose }) {
  const onCloseRef = useCallback(() => onClose(), [onClose])
  const [tab, setTab] = useState(/** @type {'overview' | 'technical'} */ ('overview'))

  useEffect(() => {
    setTab('overview')
  }, [log.id])

  useEffect(() => {
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
  }, [onCloseRef])

  const payload = useMemo(() => JSON.stringify(log.details, null, 2), [log.details])
  const summary = useMemo(() => formatEventSummary(log), [log])

  return (
    <div className="fixed inset-0 z-50 flex justify-end" aria-modal="true" role="dialog" aria-labelledby="audit-drawer-title">
      <motion.div
        key="audit-backdrop"
        role="presentation"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        onClick={onClose}
      />
      <motion.aside
        key={log.id}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex h-full w-full max-w-xl flex-col border-l border-slate-200 bg-slate-50 shadow-[-12px_0_40px_-12px_rgba(15,23,42,0.25)]"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
          <div className="min-w-0">
            <h2 id="audit-drawer-title" className="text-xl font-semibold tracking-tight text-slate-900">
              Event Details
            </h2>
            <p className="mt-2 font-mono text-xs text-slate-500">{formatLogTime(log.timestamp)}</p>
            <span className="mt-3 inline-flex rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-700">
              {log.id}
            </span>
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

        <div className="shrink-0 border-b border-slate-200 bg-white px-6">
          <div className="flex gap-6" role="tablist" aria-label="Event detail views">
            <button
              type="button"
              role="tab"
              id="audit-tab-overview"
              aria-selected={tab === 'overview'}
              aria-controls="audit-panel-overview"
              onClick={() => setTab('overview')}
              className={`border-b-2 pb-3 text-sm font-medium transition ${
                tab === 'overview'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              role="tab"
              id="audit-tab-technical"
              aria-selected={tab === 'technical'}
              aria-controls="audit-panel-technical"
              onClick={() => setTab('technical')}
              className={`border-b-2 pb-3 text-sm font-medium transition ${
                tab === 'technical'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Technical
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {tab === 'overview' ? (
            <div
              id="audit-panel-overview"
              role="tabpanel"
              aria-labelledby="audit-tab-overview"
              className="space-y-6"
            >
              <p className="text-base leading-relaxed text-slate-800">{summary.sentence}</p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200/80">
                  {log.category}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200/80">
                  {log.type}
                </span>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Changes</h3>
                {summary.changeRows.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">
                    No before/after values were recorded for this event.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {summary.changeRows.map((row) => (
                      <li
                        key={`${row.label}-${row.oldText}-${row.newText}`}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <p className="text-xs font-medium text-slate-500">{row.label}</p>
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch">
                          <div className="min-w-0 flex-1 rounded-lg bg-rose-50 px-3 py-2.5 ring-1 ring-rose-100">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-rose-800/90">
                              Old value
                            </p>
                            <p className="mt-1 break-words text-sm font-medium text-rose-950">{row.oldText}</p>
                          </div>
                          <div
                            className="flex items-center justify-center text-slate-400 sm:shrink-0 sm:px-1"
                            aria-hidden
                          >
                            →
                          </div>
                          <div className="min-w-0 flex-1 rounded-lg bg-emerald-50 px-3 py-2.5 ring-1 ring-emerald-100">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800/90">
                              New value
                            </p>
                            <p className="mt-1 break-words text-sm font-medium text-emerald-950">{row.newText}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <div id="audit-panel-technical" role="tabpanel" aria-labelledby="audit-tab-technical">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Technical payload</p>
              <p className="mt-1 text-xs text-slate-500">Raw JSON as stored for this audit entry.</p>
              <div className="mt-3">
                <HighlightedJson json={payload} />
              </div>
            </div>
          )}
        </div>
      </motion.aside>
    </div>
  )
}

export default function AuditLogsPage() {
  const session = getSession()
  const isAdmin = session?.roles?.includes('ADMIN')

  const [search, setSearch] = useState('')
  const [datePreset, setDatePreset] = useState(/** @type {'today' | '7d' | 'all'} */ ('all'))
  const [category, setCategory] = useState(/** @type {'all' | 'USER' | 'DOCUMENT' | 'ADMIN'} */ ('all'))
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState(/** @type {import('../lib/mockAuditLogs').AuditLogEntry | null} */ (null))
  const [toastMessage, setToastMessage] = useState(/** @type {string | null} */ (null))
  const [auditTick, setAuditTick] = useState(0)

  const toast = useMemo(
    () => ({
      /** @param {string} message */
      success(message) {
        setToastMessage(message)
      },
    }),
    [],
  )

  useEffect(() => {
    if (!toastMessage) return undefined
    const t = window.setTimeout(() => setToastMessage(null), 2600)
    return () => clearTimeout(t)
  }, [toastMessage])

  useEffect(() => {
    function onAuditUpdated() {
      setAuditTick((n) => n + 1)
    }
    window.addEventListener('sap_dm_mock_audit_logs_updated', onAuditUpdated)
    return () => window.removeEventListener('sap_dm_mock_audit_logs_updated', onAuditUpdated)
  }, [])

  const dateRange = useMemo(() => {
    const now = new Date()
    if (datePreset === 'all') return { startMs: null, endMs: null }
    if (datePreset === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
      return { startMs: start.getTime(), endMs: end.getTime() }
    }
    const startMs = now.getTime() - 7 * 24 * 60 * 60 * 1000
    return { startMs, endMs: now.getTime() }
  }, [datePreset])

  const filtered = useMemo(() => {
    void auditTick
    const logs = getMockAuditLogs()
    const q = search.trim().toLowerCase()
    return logs.filter((log) => {
      if (category !== 'all' && log.category !== category) return false
      if (!inDateRange(dateRange, log.timestamp)) return false
      if (q) {
        const hay = `${log.user} ${log.action}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [search, category, dateRange, auditTick])

  useEffect(() => {
    setPage(0)
  }, [search, datePreset, category])

  const total = filtered.length
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const pageSlice = useMemo(() => {
    const p = Math.min(page, pageCount - 1)
    const start = p * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page, pageCount])

  const rangeLabel =
    total === 0
      ? '0 logs'
      : (() => {
          const p = Math.min(page, pageCount - 1)
          const from = p * PAGE_SIZE + 1
          const to = Math.min((p + 1) * PAGE_SIZE, total)
          return `Showing ${from}–${to} of ${total} logs`
        })()

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-6">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">System Audit</h1>
          <p className="mt-2 text-slate-600">Track all actions and changes</p>
        </div>
        <button
          type="button"
          onClick={() => {
            toast.success('Exporting CSV file...')
            handleExportCSV(filtered)
          }}
          className="shrink-0 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          {String.fromCodePoint(0x1f4e5)} Export (CSV)
        </button>
      </header>

      <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
          <label className="flex min-w-[12rem] flex-1 flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-500">Search</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="User or action…"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            />
          </label>
          <label className="flex min-w-[10rem] flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-500">Date range</span>
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(/** @type {'today' | '7d' | 'all'} */ (e.target.value))}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            >
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="all">All Time</option>
            </select>
          </label>
          <label className="flex min-w-[10rem] flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-500">Category</span>
            <select
              value={category}
              onChange={(e) =>
                setCategory(/** @type {'all' | 'USER' | 'DOCUMENT' | 'ADMIN'} */ (e.target.value))
              }
              className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            >
              <option value="all">All</option>
              <option value="USER">USER</option>
              <option value="DOCUMENT">DOCUMENT</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </label>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-semibold">Time</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageSlice.map((log) => (
                <tr
                  key={log.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelected(log)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelected(log)
                    }
                  }}
                  className="cursor-pointer transition hover:bg-slate-50"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatLogTime(log.timestamp)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2 text-slate-700">
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass(log.type)}`}
                        aria-hidden
                      />
                      <span className="sr-only">{statusLabel(log.type)}</span>
                      <span className="text-xs font-medium text-slate-600">{statusLabel(log.type)}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{log.user}</td>
                  <td className="max-w-md px-4 py-3 text-slate-700">{log.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">No log entries match your filters.</p>
        ) : null}

        <div className="flex flex-col items-stretch justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center">
          <p className="text-xs text-slate-500">{rangeLabel}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              &lt; Previous
            </button>
            <button
              type="button"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next &gt;
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selected ? <LogInspectorDrawer key={selected.id} log={selected} onClose={() => setSelected(null)} /> : null}
      </AnimatePresence>

      <AnimatePresence>
        {toastMessage ? (
          <motion.div
            key={toastMessage}
            role="status"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-6 left-1/2 z-[60] max-w-[min(92vw,22rem)] -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white shadow-lg"
          >
            {toastMessage}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
