import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { appendMockAuditLog } from '../lib/mockAuditLogs'
import { loadMockUsers, persistMockUsers, normalizeRolesForDisplay } from '../lib/mockUsers'
import { getSession } from '../lib/session'

const ELEVATED = ['ADMIN', 'AUTHOR', 'REVIEWER']

/** @param {string[] | undefined} roles */
function elevatedRoles(roles) {
  const r = Array.isArray(roles) ? roles : []
  return r.map((x) => String(x).toUpperCase()).filter((x) => ELEVATED.includes(x))
}

/** @param {string[] | undefined} roles */
function isReaderOnly(roles) {
  return elevatedRoles(roles).length === 0
}

function rolePillClass(role) {
  const r = String(role).toUpperCase()
  if (r === 'AUTHOR') return 'bg-sky-50 text-sky-900 ring-1 ring-sky-200/90'
  if (r === 'REVIEWER') return 'bg-purple-50 text-purple-900 ring-1 ring-purple-200/90'
  if (r === 'ADMIN') return 'bg-red-50 text-red-900 ring-1 ring-red-200/90'
  return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/90'
}

/** @param {{ name: string, className?: string }} props */
function InitialAvatar({ name, className = '' }) {
  const initial = String(name || '?')
    .trim()
    .charAt(0)
    .toUpperCase()
  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700 ${className}`}
      aria-hidden
    >
      {initial || '?'}
    </div>
  )
}

/**
 * Pending modal: independent role checkboxes (local state is explicit READER + elevated keys).
 * @param {{ value: string[], onChange: (v: string[]) => void }} props
 */
function RoleCheckboxSet({ value, onChange }) {
  const upper = value.map((x) => String(x).toUpperCase())
  const set = new Set(upper)

  function toggle(key) {
    const next = new Set(set)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onChange([...next])
  }

  const labels = [
    { key: 'READER', label: 'Reader' },
    { key: 'AUTHOR', label: 'Author' },
    { key: 'REVIEWER', label: 'Reviewer' },
    { key: 'ADMIN', label: 'Admin' },
  ]

  return (
    <div className="flex flex-wrap gap-3">
      {labels.map(({ key, label }) => (
        <label key={key} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-[#0056b3] focus:ring-sky-200"
            checked={set.has(key)}
            onChange={() => toggle(key)}
          />
          {label}
        </label>
      ))}
    </div>
  )
}

/** @typedef {{ id: string, name: string, email: string, username: string, roles: string[], isActive: boolean, isPending: boolean }} MockUser */

/**
 * @param {{
 *   user: MockUser,
 *   sessionUserId: string | null,
 *   onClose: () => void,
 *   onRolesChange: (userId: string, roles: string[]) => void,
 *   onDeactivate: (userId: string) => void,
 *   onReactivate: (userId: string) => void,
 * }} props
 */
function UserEditDrawer({ user, sessionUserId, onClose, onRolesChange, onDeactivate, onReactivate }) {
  const onCloseRef = useCallback(() => onClose(), [onClose])

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

  const ev = elevatedRoles(user.roles)
  const readerOn = isReaderOnly(user.roles)

  function commitRoles(nextElevated) {
    const uniq = [...new Set(nextElevated.map((x) => String(x).toUpperCase()))].filter((x) =>
      ELEVATED.includes(x),
    )
    onRolesChange(user.id, uniq.length === 0 ? [] : uniq)
  }

  function setReaderOnly(on) {
    if (on) onRolesChange(user.id, [])
    else onRolesChange(user.id, ['AUTHOR'])
  }

  function setElevatedToggle(key, on) {
    const set = new Set(ev)
    if (on) set.add(key)
    else set.delete(key)
    commitRoles([...set])
  }

  const isSelf = Boolean(sessionUserId && user.id === sessionUserId)

  return (
    <div className="fixed inset-0 z-50 flex justify-end" aria-modal="true" role="dialog">
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
        key={user.id}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex h-full w-full max-w-lg flex-col bg-white shadow-[-12px_0_40px_-12px_rgba(15,23,42,0.25)]"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">Edit user</h2>
            <p className="mt-1 text-sm text-slate-600">{user.name}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
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
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Roles</p>
          <p className="mt-1 text-sm text-slate-600">
            Changes save immediately. Users with no elevated roles appear as Reader.
          </p>
          <div className="mt-4 space-y-4">
            <ToggleRow
              label="Reader"
              description="Baseline access when no other role is assigned"
              checked={readerOn}
              onChange={(v) => setReaderOnly(v)}
            />
            <ToggleRow label="Author" checked={ev.includes('AUTHOR')} onChange={(v) => setElevatedToggle('AUTHOR', v)} />
            <ToggleRow
              label="Reviewer"
              checked={ev.includes('REVIEWER')}
              onChange={(v) => setElevatedToggle('REVIEWER', v)}
            />
            <ToggleRow label="Admin" checked={ev.includes('ADMIN')} onChange={(v) => setElevatedToggle('ADMIN', v)} />
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-100 bg-white px-6 py-5">
          {user.isActive ? (
          <div className="rounded-xl border border-red-100 bg-red-50/80 p-4">
            <p className="text-sm font-semibold text-red-900">Danger zone</p>
            <p className="mt-1 text-xs text-red-800/90">Deactivating removes access until an admin restores the account.</p>
            {isSelf ? (
              <button
                type="button"
                disabled
                title="You cannot deactivate your own account."
                className="mt-3 w-full cursor-not-allowed rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-400"
              >
                Deactivate Profile
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onDeactivate(user.id)}
                className="mt-3 w-full rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-800 shadow-sm transition hover:bg-red-100"
              >
                🛑 Deactivate Profile
              </button>
            )}
          </div>
          ) : (
            <div className="rounded-xl border border-blue-100 bg-slate-50/80 p-4">
              <p className="text-sm font-semibold text-slate-800">Inactive account</p>
              <p className="mt-1 text-xs text-slate-600">
                Reactivating restores sign-in access with the roles shown above.
              </p>
              <button
                type="button"
                onClick={() => onReactivate(user.id)}
                className="mt-3 w-full rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-600 shadow-sm transition hover:bg-blue-50"
              >
                {String.fromCodePoint(0x1f504)} Reactivate Profile
              </button>
            </div>
          )}
        </div>
      </motion.aside>
    </div>
  )
}

/** @param {{ label: string, description?: string, checked: boolean, onChange: (v: boolean) => void }} props */
function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        {description ? <p className="text-xs text-slate-500">{description}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
          checked ? 'bg-[#0056b3]' : 'bg-slate-300'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

export default function UserManagement() {
  const session = getSession()
  const isAdmin = session?.roles?.includes('ADMIN')

  const [users, setUsers] = useState(loadMockUsers)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [pendingModalOpen, setPendingModalOpen] = useState(false)
  /** @type {[import('../lib/mockUsers').MockUser | null, import('react').Dispatch<import('react').SetStateAction<import('../lib/mockUsers').MockUser | null>>]} */
  const [editingUser, setEditingUser] = useState(/** @type {import('../lib/mockUsers').MockUser | null} */ (null))
  const [toast, setToast] = useState(/** @type {string | null} */ (null))

  const refresh = useCallback(() => {
    const next = loadMockUsers()
    setUsers(next)
    setEditingUser((prev) => {
      if (!prev) return null
      const u = next.find((x) => x.id === prev.id)
      return u ?? null
    })
  }, [])

  useEffect(() => {
    if (!toast) return undefined
    const t = window.setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const stats = useMemo(() => {
    const pending = users.filter((u) => u.isPending).length
    const active = users.filter((u) => u.isActive && !u.isPending).length
    const deactivated = users.filter((u) => !u.isActive && !u.isPending).length
    return { pending, active, deactivated }
  }, [users])

  const pendingList = useMemo(() => users.filter((u) => u.isPending), [users])

  const directoryUsers = useMemo(() => {
    let list = users.filter((u) => !u.isPending)
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q),
      )
    }
    if (roleFilter !== 'all') {
      list = list.filter((u) => normalizeRolesForDisplay(u.roles).includes(roleFilter))
    }
    return list
  }, [users, search, roleFilter])

  function patchUser(userId, patch) {
    const list = loadMockUsers()
    const next = list.map((u) => (u.id === userId ? { ...u, ...patch } : u))
    persistMockUsers(next)
    refresh()
  }

  function handleRolesChange(userId, roles) {
    const prev = loadMockUsers().find((u) => u.id === userId)
    patchUser(userId, { roles })
    appendMockAuditLog({
      actorUserId: session?.userId,
      actorDisplayName: session?.displayName ?? 'Administrator',
      action: `Updated roles for ${prev?.name ?? userId}`,
      category: 'USER',
      type: 'SUCCESS',
      details: { targetUserId: userId, oldValue: { roles: prev?.roles }, newValue: { roles } },
    })
  }

  function handleDeactivate(userId) {
    const list = loadMockUsers()
    const target = list.find((u) => u.id === userId)
    const next = list.map((u) =>
      u.id === userId ? { ...u, isActive: false, isPending: false } : u,
    )
    persistMockUsers(next)
    setEditingUser(null)
    setUsers(next)
    setToast('User deactivated.')
    appendMockAuditLog({
      actorUserId: session?.userId,
      actorDisplayName: session?.displayName ?? 'Administrator',
      action: `Admin deactivated ${target?.name ?? userId}`,
      category: 'ADMIN',
      type: 'DANGER',
      details: {
        targetUserId: userId,
        oldValue: { isActive: target?.isActive },
        newValue: { isActive: false },
      },
    })
  }

  function handleReactivate(userId) {
    const list = loadMockUsers()
    const target = list.find((u) => u.id === userId)
    const next = list.map((u) => (u.id === userId ? { ...u, isActive: true } : u))
    persistMockUsers(next)
    setEditingUser(null)
    setUsers(next)
    setToast('User account reactivated successfully.')
    appendMockAuditLog({
      actorUserId: session?.userId,
      actorDisplayName: session?.displayName ?? 'Administrator',
      action: `Reactivated user ${target?.name ?? userId}`,
      category: 'USER',
      type: 'SUCCESS',
      details: {
        targetUserId: userId,
        oldValue: { isActive: false },
        newValue: { isActive: true },
      },
    })
  }

  function approvePending(userId, selectedRoles) {
    const upper = selectedRoles.map((x) => String(x).toUpperCase())
    const elev = [...new Set(upper.filter((x) => ELEVATED.includes(x)))]
    const finalRoles = elev.length > 0 ? elev : upper.includes('READER') ? [] : []
    const pendingUser = loadMockUsers().find((u) => u.id === userId)
    patchUser(userId, { isPending: false, isActive: true, roles: finalRoles })
    setToast('User approved and profile created.')
    appendMockAuditLog({
      actorUserId: session?.userId,
      actorDisplayName: session?.displayName ?? 'Administrator',
      action: `Approved access request for ${pendingUser?.name ?? userId}`,
      category: 'USER',
      type: 'SUCCESS',
      details: {
        targetUserId: userId,
        oldValue: { isPending: true, roles: pendingUser?.roles },
        newValue: { isPending: false, isActive: true, roles: finalRoles },
      },
    })
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-6">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
          Admin Control Tower
        </h1>
        <p className="mt-2 text-slate-600">User management and access control.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-orange-200 bg-orange-50/90 p-5 shadow-[0_4px_28px_-6px_rgba(15,23,42,0.1)] ring-1 ring-orange-100/80">
          <p className="text-sm font-medium text-orange-950/90">Pending Requests</p>
          <p className="mt-2 text-3xl font-semibold text-orange-950">{stats.pending}</p>
          <button
            type="button"
            onClick={() => setPendingModalOpen(true)}
            className="mt-4 w-full rounded-xl border border-orange-200/90 bg-white px-4 py-2.5 text-sm font-semibold text-orange-900 shadow-sm transition hover:bg-orange-100/60"
          >
            Review Requests
          </button>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_4px_28px_-6px_rgba(15,23,42,0.1)] ring-1 ring-slate-100/90">
          <p className="text-sm font-medium text-slate-700">Active Users</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.active}</p>
          <p className="mt-3 text-xs text-slate-500">Active and not pending</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50/90 p-5 shadow-[0_4px_28px_-6px_rgba(15,23,42,0.1)] ring-1 ring-slate-200/80">
          <p className="text-sm font-medium text-slate-700">Deactivated</p>
          <p className="mt-2 text-3xl font-semibold text-slate-800">{stats.deactivated}</p>
          <p className="mt-3 text-xs text-slate-500">Not pending</p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_4px_28px_-6px_rgba(15,23,42,0.1)] md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold text-slate-900">User directory</h2>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
            <label htmlFor="um-search" className="sr-only">
              Search users
            </label>
            <input
              id="um-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100 md:max-w-xs"
            />
            <label htmlFor="um-role" className="sr-only">
              Filter by role
            </label>
            <select
              id="um-role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100 sm:w-48"
            >
              <option value="all">All roles</option>
              <option value="READER">Reader</option>
              <option value="AUTHOR">Author</option>
              <option value="REVIEWER">Reviewer</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="pb-3 pr-4 font-semibold">User</th>
                <th className="pb-3 pr-4 font-semibold">Roles</th>
                <th className="pb-3 pr-4 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {directoryUsers.map((u) => (
                <tr key={u.id} className="align-top">
                  <td className="py-4 pr-4">
                    <div className="flex gap-3">
                      <InitialAvatar name={u.name} />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 pr-4">
                    <div className="flex flex-wrap gap-1.5">
                      {normalizeRolesForDisplay(u.roles).map((r) => (
                        <span
                          key={r}
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${rolePillClass(r)}`}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 pr-4">
                    {u.isActive ? (
                      <span className="inline-flex items-center gap-2 text-slate-700">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-slate-600">
                        <span className="h-2 w-2 rounded-full bg-slate-300" aria-hidden />
                        Deactivated
                      </span>
                    )}
                  </td>
                  <td className="py-4">
                    <button
                      type="button"
                      onClick={() => setEditingUser(u)}
                      className="cursor-pointer font-medium text-[#0056b3] hover:underline"
                    >
                      ⚙️ Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {directoryUsers.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No users match your filters.</p>
          ) : null}
        </div>
      </div>

      <AnimatePresence>
        {pendingModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <motion.button
              type="button"
              className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
              aria-label="Close"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPendingModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="relative z-10 max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <h3 className="text-lg font-semibold text-slate-900">Pending access requests</h3>
                <button
                  type="button"
                  onClick={() => setPendingModalOpen(false)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  aria-label="Close"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="max-h-[calc(85vh-5rem)] overflow-y-auto px-6 py-4">
                {pendingList.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">No pending requests.</p>
                ) : (
                  <ul className="space-y-6">
                    {pendingList.map((u) => (
                      <PendingApproveCard key={u.id} user={u} onApprove={approvePending} />
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {editingUser ? (
          <UserEditDrawer
            key={editingUser.id}
            user={editingUser}
            sessionUserId={session?.userId ?? null}
            onClose={() => setEditingUser(null)}
            onRolesChange={handleRolesChange}
            onDeactivate={handleDeactivate}
            onReactivate={handleReactivate}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {toast ? (
          <motion.div
            key={toast}
            role="status"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-6 left-1/2 z-[60] max-w-[min(92vw,22rem)] -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white shadow-lg"
          >
            {toast}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function pendingModalInitialSelection(user) {
  const upper = (user.roles || []).map((x) => String(x).toUpperCase())
  const elev = upper.filter((x) => ELEVATED.includes(x))
  if (elev.length > 0) return [...new Set(elev)]
  if (upper.includes('READER')) return ['READER']
  return ['READER']
}

/**
 * @param {{ user: import('../lib/mockUsers').MockUser, onApprove: (userId: string, roles: string[]) => void }} props
 */
function PendingApproveCard({ user, onApprove }) {
  const [roles, setRoles] = useState(() => pendingModalInitialSelection(user))

  return (
    <li className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          <InitialAvatar name={user.name} />
          <div>
            <p className="font-semibold text-slate-900">{user.name}</p>
            <p className="text-sm text-slate-600">{user.email}</p>
            <p className="text-xs text-slate-500">@{user.username}</p>
            {user.roles?.length ? (
              <p className="mt-2 text-xs text-slate-500">
                Requested scope: {normalizeRolesForDisplay(user.roles).join(', ')}
              </p>
            ) : null}
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs font-medium text-slate-500">Assign roles</p>
      <div className="mt-2">
        <RoleCheckboxSet value={roles} onChange={setRoles} />
      </div>
      <button
        type="button"
        disabled={roles.length === 0}
        onClick={() => onApprove(user.id, roles)}
        className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Approve &amp; Create Profile
      </button>
    </li>
  )
}
