import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import PasswordModal from '../PasswordModal'
import { appendMockAuditLog } from '../../lib/mockAuditLogs'
import { getSession } from '../../lib/session'
import { loadMockUsers, persistMockUsers } from '../../lib/mockUsers'

const MAX_AVATAR_BYTES = 1.5 * 1024 * 1024

const BADGE = {
  AUTHOR: 'bg-[#D9EEFC] text-[#003d7a] ring-1 ring-sky-200/80',
  REVIEWER: 'bg-[#E8E0F5] text-[#4c1d95] ring-1 ring-purple-200/80',
  ADMIN: 'bg-[#D1FAE5] text-[#065f46] ring-1 ring-emerald-200/80',
  READER: 'bg-slate-100 text-slate-800 ring-1 ring-slate-200/80',
}

function RoleBadges({ roles }) {
  const list = roles?.length ? roles : ['READER']
  return (
    <div className="flex flex-wrap gap-2">
      {list.map((r) => (
        <span
          key={r}
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${BADGE[r] ?? BADGE.READER}`}
        >
          {r}
        </span>
      ))}
    </div>
  )
}

/** @param {ReturnType<typeof getSession>} session */
function profileEmail(session) {
  if (!session) return ''
  if ('email' in session && typeof session.email === 'string') return session.email
  const u = loadMockUsers().find((x) => x.id === session.userId)
  if (u?.email) return u.email
  const local = String(session.userId ?? 'user').replace(/^usr_/, '') || 'user'
  return `${local}@example.com`
}

/** @param {string} displayName */
function initialsFromName(displayName) {
  return String(displayName ?? '?')
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?'
}

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   onRequestLogout: () => void,
 *   logoutModalOpen?: boolean,
 * }} props
 */
export default function SettingsDrawer({ open, onClose, onRequestLogout, logoutModalOpen = false }) {
  const session = getSession()
  const fileInputRef = useRef(/** @type {HTMLInputElement | null} */ (null))
  const [, bump] = useState(0)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState(/** @type {string | null} */ (null))

  const onCloseRef = useCallback(() => onClose(), [onClose])

  const mockUser = session?.userId
    ? loadMockUsers().find((u) => u.id === session.userId)
    : undefined
  const avatarDataUrl =
    typeof mockUser?.avatar === 'string' && mockUser.avatar.length > 0 ? mockUser.avatar : null

  useEffect(() => {
    function onUsersUpdated() {
      bump((n) => n + 1)
    }
    window.addEventListener('sap_dm_mock_users_updated', onUsersUpdated)
    return () => window.removeEventListener('sap_dm_mock_users_updated', onUsersUpdated)
  }, [])

  useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(e) {
      if (e.key !== 'Escape') return
      if (logoutModalOpen || passwordModalOpen) return
      onCloseRef()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onCloseRef, logoutModalOpen, passwordModalOpen])

  useEffect(() => {
    if (!open) setPasswordModalOpen(false)
  }, [open])

  useEffect(() => {
    if (!toastMessage) return undefined
    const t = window.setTimeout(() => setToastMessage(null), 2600)
    return () => clearTimeout(t)
  }, [toastMessage])

  function patchCurrentUserAvatar(avatarValue) {
    if (!session?.userId) return false
    const users = loadMockUsers()
    const idx = users.findIndex((u) => u.id === session.userId)
    if (idx < 0) return false
    const next = users.map((u, i) =>
      i === idx ? { ...u, avatar: avatarValue } : u,
    )
    persistMockUsers(next)
    return true
  }

  function handleAvatarFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !file.type.startsWith('image/')) return
    if (file.size > MAX_AVATAR_BYTES) {
      setToastMessage('Image is too large. Try a smaller file.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const data = reader.result
      if (typeof data !== 'string') return
      if (!patchCurrentUserAvatar(data)) {
        setToastMessage('Could not save photo for this account.')
        return
      }
      const s = getSession()
      appendMockAuditLog({
        actorUserId: s?.userId,
        actorDisplayName: s?.displayName ?? mockUser?.name ?? 'User',
        action: 'Updated profile avatar',
        category: 'USER',
        type: 'INFO',
        details: { targetUserId: s?.userId },
      })
      setToastMessage('Profile photo updated.')
    }
    reader.readAsDataURL(file)
  }

  function handleRemovePhoto() {
    if (!patchCurrentUserAvatar(null)) {
      setToastMessage('Could not update profile.')
      return
    }
    const s = getSession()
    appendMockAuditLog({
      actorUserId: s?.userId,
      actorDisplayName: s?.displayName ?? mockUser?.name ?? 'User',
      action: 'Removed profile avatar',
      category: 'USER',
      type: 'INFO',
      details: { targetUserId: s?.userId },
    })
    setToastMessage('Profile photo removed.')
  }

  const displayName = session?.displayName ?? 'User'
  const roles = session?.roles ?? []
  const email = profileEmail(session)

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={handleAvatarFileChange}
      />

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              className="fixed inset-0 z-[90] bg-black/35 backdrop-blur-md"
              aria-label="Close settings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-labelledby="settings-drawer-title"
              className="fixed top-0 right-0 z-[95] flex h-full w-full max-w-md flex-col border-l border-slate-200/80 bg-white shadow-2xl"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <h2 id="settings-drawer-title" className="text-lg font-semibold text-slate-900">
                  User settings
                </h2>
                <button
                  type="button"
                  className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
                <section className="rounded-2xl border border-slate-100 bg-gradient-to-b from-slate-50/80 to-white p-5 shadow-sm">
                  <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                    <div
                      className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#D9EEFC] to-sky-100 shadow-inner ring-4 ring-white"
                      aria-hidden
                    >
                      {avatarDataUrl ? (
                        <img src={avatarDataUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-[#003d7a]">
                          {initialsFromName(displayName)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 text-center sm:text-left">
                      <p className="text-xl font-bold tracking-tight text-slate-900">{displayName}</p>
                      <p className="mt-1 text-sm text-slate-600">{email}</p>
                      <div className="mt-4">
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Roles
                        </p>
                        <RoleBadges roles={roles} />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="mt-6 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">System</p>
                  <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-slate-50/90 px-3 py-2.5 ring-1 ring-slate-100">
                      <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Last login</dt>
                      <dd className="mt-0.5 text-xs font-medium text-slate-800">Apr 14, 2026, 2:30 PM</dd>
                    </div>
                    <div className="rounded-lg bg-slate-50/90 px-3 py-2.5 ring-1 ring-slate-100">
                      <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-400">IP address</dt>
                      <dd className="mt-0.5 font-mono text-xs font-medium text-slate-800">203.0.113.10</dd>
                    </div>
                    <div className="rounded-lg bg-slate-50/90 px-3 py-2.5 ring-1 ring-slate-100">
                      <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-400">App version</dt>
                      <dd className="mt-0.5 text-xs font-medium text-slate-800">1.0.0</dd>
                    </div>
                  </dl>
                </section>

                <section className="mt-6 space-y-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                  >
                    {String.fromCodePoint(0x1f4f8)} Change Photo
                  </button>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={!avatarDataUrl}
                    className="w-full py-2 text-center text-sm font-medium text-slate-500 underline-offset-2 transition hover:text-slate-800 hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:no-underline"
                  >
                    Remove Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPasswordModalOpen(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                  >
                    {String.fromCodePoint(0x1f511)} Security &amp; Password
                  </button>
                </section>
              </div>

              <div className="shrink-0 border-t border-slate-200 bg-white px-5 py-4">
                <button
                  type="button"
                  onClick={onRequestLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50/80 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                >
                  {String.fromCodePoint(0x1f6aa)} Logout
                </button>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <PasswordModal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onSuccess={() => setToastMessage('Password updated successfully.')}
      />

      <AnimatePresence>
        {toastMessage ? (
          <motion.div
            key={toastMessage}
            role="status"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-6 left-1/2 z-[120] max-w-[min(92vw,22rem)] -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white shadow-lg"
          >
            {toastMessage}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
