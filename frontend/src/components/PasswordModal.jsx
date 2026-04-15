import { useEffect, useId, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { appendMockAuditLog } from '../lib/mockAuditLogs'
import { loadMockUsers, persistMockUsers } from '../lib/mockUsers'
import { getExpectedMockLoginPassword, getSession, persistMockPasswordAfterChange } from '../lib/session'

/** @param {string} pwd */
function passwordRequirements(pwd) {
  return {
    len: pwd.length >= 8,
    upper: /[A-Z]/.test(pwd),
    number: /\d/.test(pwd),
    special: /[^A-Za-z0-9]/.test(pwd),
  }
}

/** @param {{ met: boolean, label: string }} props */
function RuleLabel({ met, label }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
        met ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200' : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200/80'
      }`}
    >
      {met ? (
        <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : null}
      {label}
    </span>
  )
}

/**
 * @param {{ open: boolean, onClose: () => void, onSuccess?: () => void }} props
 */
export default function PasswordModal({ open, onClose, onSuccess }) {
  const titleId = useId()
  const session = getSession()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(/** @type {string | null} */ (null))

  const mockUser = useMemo(
    () => loadMockUsers().find((u) => u.id === session?.userId),
    [session?.userId],
  )
  const loginUsername = session?.username ?? mockUser?.username ?? ''

  const req = useMemo(() => passwordRequirements(newPassword), [newPassword])
  const allReqMet = req.len && req.upper && req.number && req.special
  const confirmOk = newPassword === confirmPassword && confirmPassword.length > 0
  const canSubmit = allReqMet && confirmOk && currentPassword.length > 0 && loginUsername.length > 0

  useEffect(() => {
    if (!open) {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setError(null)
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!canSubmit) return

    const expected = getExpectedMockLoginPassword(loginUsername)
    if (currentPassword !== expected) {
      setError('Current password is incorrect.')
      return
    }

    const users = loadMockUsers()
    const idx = users.findIndex((u) => u.id === session?.userId)
    if (idx >= 0) {
      const next = users.map((u, i) => (i === idx ? { ...u, password: newPassword } : u))
      persistMockUsers(next)
    }
    persistMockPasswordAfterChange(loginUsername, newPassword)
    appendMockAuditLog({
      actorUserId: session?.userId,
      actorDisplayName: mockUser?.name ?? session?.displayName ?? loginUsername,
      action: 'Changed account password',
      category: 'USER',
      type: 'SUCCESS',
      details: { targetUserId: session?.userId },
    })
    onSuccess?.()
    onClose()
  }

  return (
    <AnimatePresence>
      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
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
            className="relative z-10 max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <h2 id={titleId} className="text-lg font-semibold text-slate-900">
              Security &amp; password
            </h2>
            <p className="mt-1 text-sm text-slate-500">Update your sign-in password for this demo environment.</p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Current password</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value)
                    setError(null)
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">New password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <RuleLabel met={req.len} label="8+ chars" />
                <RuleLabel met={req.upper} label="Uppercase" />
                <RuleLabel met={req.number} label="Number" />
                <RuleLabel met={req.special} label="Special char" />
              </div>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">Confirm password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                />
              </label>

              {confirmPassword.length > 0 && newPassword !== confirmPassword ? (
                <p className="text-xs text-red-600">Passwords do not match.</p>
              ) : null}
              {error ? <p className="text-xs text-red-600">{error}</p> : null}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="flex-1 rounded-xl bg-[#0056b3] py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#004a9a] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Update Password
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
