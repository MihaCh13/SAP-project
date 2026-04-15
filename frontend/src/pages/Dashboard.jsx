import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMockAuditLogs } from '../lib/mockAuditLogs'
import { documentAuthorDisplay, documentAuthorId, loadMockDrafts } from '../lib/mockDrafts'
import { loadMockUsers } from '../lib/mockUsers'
import { getSession } from '../lib/session'

/** @typedef {{ id: string, title: string, date: string }} ApprovedDoc */
/** @typedef {{ id: string, message: string, time: string }} NotificationItem */
/** @typedef {{ id: string, title: string, status: 'DRAFT' | 'REJECTED' }} DeskDoc */
/** @typedef {{ id: string, title: string, author: string }} ReviewDoc */
/** @typedef {{ id: string, title: string, decision: 'APPROVED' | 'REJECTED', date: string }} DecisionItem */
/** @typedef {{ id: string, summary: string, actor: string, time: string }} AuditItem */

const MOCK_LOAD_MS = 500
const EMPTY_ROLES = Object.freeze([])

/** @param {string} iso */
function formatShortDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

/**
 * Dashboard payload from global mock stores (documents, users, audit).
 * @returns {Promise<{
 *   recentlyApproved: ApprovedDoc[],
 *   notifications: NotificationItem[],
 *   myDesk: DeskDoc[],
 *   reviewQueue: ReviewDoc[],
 *   decisionHistory: DecisionItem[],
 *   statsUnderReview: number,
 *   pendingAccessRequests: number,
 *   auditLogs: AuditItem[],
 * }>}
 */
function fetchDashboardMock() {
  return new Promise((resolve) => {
    const session = getSession()
    const uid = session?.userId ?? null
    const all = loadMockDrafts()

    const reviewQueue = all
      .filter((d) => d.status === 'SUBMITTED')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 6)
      .map((d) => ({
        id: d.id,
        title: d.title,
        author: documentAuthorDisplay(d),
      }))

    const myDesk = uid
      ? all
          .filter(
            (d) =>
              documentAuthorId(d) === uid && (d.status === 'DRAFT' || d.status === 'REJECTED'),
          )
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 6)
          .map((d) => ({ id: d.id, title: d.title, status: d.status }))
      : []

    const recentlyApproved = all
      .filter((d) => d.status === 'APPROVED')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 4)
      .map((d) => ({
        id: d.id,
        title: d.title,
        date: formatShortDate(d.updatedAt),
      }))

    const decisionHistory = all
      .filter((d) => d.status === 'APPROVED' || d.status === 'REJECTED')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
      .map((d) => ({
        id: d.id,
        title: d.title,
        decision: d.status === 'APPROVED' ? /** @type {'APPROVED'} */ ('APPROVED') : 'REJECTED',
        date: formatShortDate(d.updatedAt),
      }))

    const statsUnderReview = all.filter((d) => d.status === 'SUBMITTED').length
    const pendingAccessRequests = loadMockUsers().filter((u) => u.isPending).length

    const auditLogs = getMockAuditLogs().slice(0, 4).map((log) => ({
      id: log.id,
      summary: log.action,
      actor: log.user,
      time: formatShortDate(log.timestamp),
    }))

    resolve({
      recentlyApproved,
      notifications: [
        {
          id: 'n1',
          message: 'Maintenance window scheduled for Saturday 02:00–04:00 UTC.',
          time: '2h ago',
        },
        {
          id: 'n2',
          message: 'Review queue reflects documents in SUBMITTED status (shared mock store).',
          time: '5h ago',
        },
        {
          id: 'n3',
          message: 'Audit logs capture password, avatar, workflow, and admin actions.',
          time: 'Yesterday',
        },
      ],
      myDesk,
      reviewQueue,
      decisionHistory,
      statsUnderReview,
      pendingAccessRequests,
      auditLogs,
    })
  })
}

function FileDocIcon({ className = 'h-5 w-5 shrink-0 text-slate-400' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  )
}

const cardShadow = 'shadow-[0_4px_28px_-6px_rgba(15,23,42,0.1)]'

/** @param {{ accent: 'gray' | 'blue' | 'purple' | 'mint', className?: string, children: React.ReactNode }} props */
function BentoCard({ accent, className = '', children }) {
  const top =
    accent === 'gray'
      ? 'border-t-[3px] border-slate-200'
      : accent === 'blue'
        ? 'border-t-[3px] border-blue-200'
        : accent === 'purple'
          ? 'border-t-[3px] border-purple-200'
          : 'border-t-[3px] border-emerald-200'

  return (
    <div
      className={`flex flex-col rounded-2xl bg-white p-5 ${cardShadow} ${top} ${className}`}
    >
      {children}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 xl:gap-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse rounded-2xl bg-white p-5 ${cardShadow} ${
            i === 0 ? 'md:col-span-2 xl:col-span-2' : ''
          }`}
        >
          <div className="mb-4 h-3 w-1/3 rounded bg-slate-200" />
          <div className="space-y-3">
            <div className="h-3 w-full rounded bg-slate-100" />
            <div className="h-3 w-11/12 rounded bg-slate-100" />
            <div className="h-3 w-2/3 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Multi-role prioritization: P1 actionable queues, P2 quick actions, P3 informational.
 * @param {string[]} roles
 * @param {Awaited<ReturnType<typeof fetchDashboardMock>>} data
 * @param {(path: string) => void} go
 */
function buildSortedDashboardCards(roles, data, go) {
  const has = (r) => roles.includes(r)

  /** @type {{ id: string, sort: number, node: React.ReactNode, className: string }[]} */
  const items = []

  /** @type {string[]} */
  const priorityOneIds = []
  if (has('REVIEWER')) priorityOneIds.push('reviewQueue')
  if (has('AUTHOR')) priorityOneIds.push('myDesk')
  if (has('ADMIN')) priorityOneIds.push('accessRequests')

  priorityOneIds.forEach((id, idx) => {
    const sort = 100 + idx * 10
    if (id === 'reviewQueue') {
      items.push({
        id,
        sort,
        className: 'md:col-span-2 xl:col-span-2',
        node: (
          <BentoCard key={id} accent="purple">
            <h2 className="text-base font-semibold text-slate-900">Review Queue</h2>
            <p className="mt-1 text-xs text-slate-500">Documents in SUBMITTED status</p>
            <ul className="mt-4 space-y-3">
              {data.reviewQueue.map((doc) => (
                <li
                  key={doc.id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <FileDocIcon />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{doc.title}</p>
                      <p className="text-xs text-slate-500">Author: {doc.author}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => go('/pending-review')}
                    className="shrink-0 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-purple-700"
                  >
                    Open for Review
                  </button>
                </li>
              ))}
            </ul>
          </BentoCard>
        ),
      })
    } else if (id === 'myDesk') {
      items.push({
        id,
        sort,
        className: 'md:col-span-2 xl:col-span-2',
        node: (
          <BentoCard key={id} accent="blue">
            <h2 className="text-base font-semibold text-slate-900">My Desk</h2>
            <p className="mt-1 text-xs text-slate-500">Drafts and rejected documents</p>
            <ul className="mt-4 space-y-3">
              {data.myDesk.map((doc) => (
                <li
                  key={doc.id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <FileDocIcon />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{doc.title}</p>
                      <span
                        className={`mt-0.5 inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          doc.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => go('/my-drafts')}
                    className="shrink-0 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm hover:bg-blue-50"
                  >
                    Resume Work
                  </button>
                </li>
              ))}
            </ul>
          </BentoCard>
        ),
      })
    } else if (id === 'accessRequests') {
      items.push({
        id,
        sort,
        className: 'md:col-span-2 xl:col-span-2',
        node: (
          <BentoCard key={id} accent="mint">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Access Requests</h2>
                <p className="mt-1 text-xs text-slate-500">Pending account and role requests</p>
                <p className="mt-4 text-4xl font-semibold tracking-tight text-emerald-700">
                  {data.pendingAccessRequests}
                </p>
                <p className="text-sm text-slate-600">requests awaiting your review</p>
              </div>
              <button
                type="button"
                onClick={() => go('/users-roles')}
                className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                Review Requests
              </button>
            </div>
          </BentoCard>
        ),
      })
    }
  })

  if (has('AUTHOR')) {
    items.push({
      id: 'quickAction',
      sort: 200,
      className: 'md:col-span-2 xl:col-span-2',
      node: (
        <div
          key="quickAction"
          className={`flex flex-col justify-center rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-sky-50/90 p-6 ${cardShadow}`}
        >
          <h2 className="text-base font-semibold text-slate-900">Quick Action</h2>
          <p className="mt-1 max-w-md text-sm text-slate-600">
            Start a new governed document and route it through review when you are ready.
          </p>
          <button
            type="button"
            onClick={() => go('/new-document')}
            className="mt-5 inline-flex w-fit items-center gap-2 rounded-xl bg-[#0056b3] px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-[#004494]"
          >
            <span className="text-sm font-bold tracking-tight">[+]</span>
            Create New Document
          </button>
        </div>
      ),
    })
  }

  items.push(
    {
      id: 'recentlyApproved',
      sort: 300,
      className: 'md:col-span-2 xl:col-span-2',
      node: (
        <BentoCard key="recentlyApproved" accent="gray">
          <h2 className="text-base font-semibold text-slate-900">Recently Approved</h2>
          <p className="mt-1 text-xs text-slate-500">Latest published decisions</p>
          <ul className="mt-4 space-y-3">
            {data.recentlyApproved.map((doc) => (
              <li
                key={doc.id}
                className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/40 p-3"
              >
                <FileDocIcon />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{doc.title}</p>
                  <p className="text-xs text-slate-500">{doc.date}</p>
                </div>
              </li>
            ))}
          </ul>
        </BentoCard>
      ),
    },
    {
      id: 'notifications',
      sort: 310,
      className: 'xl:col-span-2',
      node: (
        <BentoCard key="notifications" accent="gray">
          <h2 className="text-base font-semibold text-slate-900">System Notifications</h2>
          <p className="mt-1 text-xs text-slate-500">Recent messages</p>
          <ul className="mt-4 space-y-3">
            {data.notifications.map((n) => (
              <li
                key={n.id}
                className="rounded-xl border border-slate-100 bg-slate-50/40 p-3 text-sm text-slate-700"
              >
                <p>{n.message}</p>
                <p className="mt-1 text-xs text-slate-400">{n.time}</p>
              </li>
            ))}
          </ul>
        </BentoCard>
      ),
    },
  )

  if (has('AUTHOR')) {
    items.push({
      id: 'stats',
      sort: 320,
      className: '',
      node: (
        <BentoCard key="stats" accent="gray">
          <h2 className="text-base font-semibold text-slate-900">Stats</h2>
          <p className="mt-4 text-2xl font-semibold text-slate-800">{data.statsUnderReview}</p>
          <p className="mt-1 text-sm text-slate-600">documents currently under review</p>
        </BentoCard>
      ),
    })
  }

  if (has('REVIEWER')) {
    items.push({
      id: 'decisionHistory',
      sort: 330,
      className: 'md:col-span-2',
      node: (
        <BentoCard key="decisionHistory" accent="gray">
          <h2 className="text-base font-semibold text-slate-900">Decision History</h2>
          <p className="mt-1 text-xs text-slate-500">Recent outcomes you recorded</p>
          <ul className="mt-4 space-y-2">
            {data.decisionHistory.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate font-medium text-slate-800">{row.title}</span>
                <span
                  className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                    row.decision === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'bg-rose-50 text-rose-800'
                  }`}
                >
                  {row.decision}
                </span>
                <span className="shrink-0 text-xs text-slate-500">{row.date}</span>
              </li>
            ))}
          </ul>
        </BentoCard>
      ),
    })
  }

  if (has('ADMIN')) {
    items.push({
      id: 'systemMonitoring',
      sort: 340,
      className: 'md:col-span-2 xl:col-span-2',
      node: (
        <BentoCard key="systemMonitoring" accent="gray">
          <h2 className="text-base font-semibold text-slate-900">System Monitoring</h2>
          <p className="mt-1 text-xs text-slate-500">Recent audit events</p>
          <ul className="mt-4 space-y-2">
            {data.auditLogs.map((log) => (
              <li
                key={log.id}
                className="rounded-lg border border-slate-100 bg-slate-50/40 px-3 py-2 text-sm text-slate-700"
              >
                <p>{log.summary}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {log.actor} · {log.time}
                </p>
              </li>
            ))}
          </ul>
        </BentoCard>
      ),
    })
  }

  items.sort((a, b) => a.sort - b.sort)
  return items
}

function formatDashboardDate(d) {
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function Dashboard() {
  const navigate = useNavigate()
  const session = getSession()
  const roles = session?.roles ?? EMPTY_ROLES

  const [status, setStatus] = useState(/** @type {'loading' | 'ready' | 'error'} */ ('loading'))
  const [data, setData] = useState(
    /** @type {Awaited<ReturnType<typeof fetchDashboardMock>> | null} */ (null),
  )

  useEffect(() => {
    let cancelled = false
    const t = setTimeout(() => {
      fetchDashboardMock()
        .then((payload) => {
          if (!cancelled) {
            setData(payload)
            setStatus('ready')
          }
        })
        .catch(() => {
          if (!cancelled) setStatus('error')
        })
    }, MOCK_LOAD_MS)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [])

  const sortedCards = useMemo(() => {
    if (!data) return []
    return buildSortedDashboardCards(roles, data, (path) => navigate(path))
  }, [data, roles, navigate])

  const todayLabel = useMemo(() => formatDashboardDate(new Date()), [])

  return (
    <div className="mx-auto max-w-[1400px]">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
          Dashboard
        </h1>
        <p className="mt-2 text-base text-slate-600 md:text-lg">
          Here&apos;s what&apos;s happening today, {todayLabel}
        </p>
      </header>

      {status === 'error' ? (
        <div className="rounded-2xl border border-red-100 bg-white p-6 text-sm text-red-700 shadow-sm">
          Something went wrong while loading the dashboard. Please refresh the page.
        </div>
      ) : status === 'loading' || !data ? (
        <DashboardSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 xl:gap-5">
          {sortedCards.map((card) => (
            <div key={card.id} className={card.className}>
              {card.node}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
