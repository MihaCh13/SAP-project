import { useEffect, useReducer, useRef, useState } from 'react'
import {
  getNotificationsForUser,
  markNotificationAsRead,
} from '../../lib/mockUserNotifications'
import { getSession } from '../../lib/session'

/** @param {string} iso */
function formatNtfTime(iso) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return String(iso ?? '')
  }
}

export default function NotificationBell() {
  const wrapRef = useRef(/** @type {HTMLDivElement | null} */ (null))
  const [open, setOpen] = useState(false)
  const [, bump] = useReducer((n) => n + 1, 0)

  const session = getSession()
  const userId = session?.userId ?? null
  const displayName = session?.displayName ?? 'User'

  useEffect(() => {
    function onUsersUpdated() {
      bump()
    }
    window.addEventListener('sap_dm_mock_users_updated', onUsersUpdated)
    return () => window.removeEventListener('sap_dm_mock_users_updated', onUsersUpdated)
  }, [])

  useEffect(() => {
    if (!open) return undefined
    function onDocDown(/** @type {MouseEvent} */ e) {
      const el = wrapRef.current
      if (el && e.target instanceof Node && !el.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocDown)
    return () => document.removeEventListener('mousedown', onDocDown)
  }, [open])

  const items = userId ? getNotificationsForUser(userId) : []
  const unreadCount = items.filter((n) => !n.isRead).length
  const hasUnread = unreadCount > 0

  function handleMarkRead(id) {
    if (!userId) return
    markNotificationAsRead(userId, id, displayName)
    bump()
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`relative rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 ${
          hasUnread ? 'animate-pulse' : ''
        }`}
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.102V7.5a6 6 0 10-12 0v.102c0 1.074.168 2.113.48 3.088M9 21h6m-6 0a3 3 0 003-3v-1.5M9 21a3 3 0 003 3m0-6v1.5m0-1.5V18"
          />
        </svg>
        {hasUnread ? (
          <span
            className="absolute -top-0.5 -right-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-red-600 px-[0.25rem] text-[0.625rem] font-bold leading-none text-white shadow-sm ring-2 ring-white"
            aria-hidden
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute top-full right-0 z-50 mt-2 w-[min(calc(100vw-1.5rem),22rem)] overflow-hidden rounded-2xl bg-white/95 py-2 shadow-[0_16px_48px_-12px_rgba(15,23,42,0.35)] backdrop-blur-md"
        >
          <div className="border-b border-slate-100/80 px-4 py-2.5">
            <p className="text-[0.8125rem] font-semibold text-slate-900">Notifications</p>
            <p className="text-[0.6875rem] text-slate-500">Stored on your demo profile</p>
          </div>
          <div className="max-h-[min(24rem,70dvh)] overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-[0.8125rem] text-slate-500">No notifications yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100/90">
                {items.map((n) => (
                  <li key={n.id} className="px-4 py-3">
                    <p className={`text-[0.8125rem] leading-snug ${n.isRead ? 'text-slate-600' : 'font-medium text-slate-900'}`}>
                      {n.message}
                    </p>
                    <p className="mt-1 text-[0.6875rem] text-slate-400">{formatNtfTime(n.timestamp)}</p>
                    {!n.isRead ? (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(n.id)}
                        className="mt-2 text-[0.6875rem] font-semibold text-[#0056b3] hover:underline"
                      >
                        ✓ Mark as Read
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
