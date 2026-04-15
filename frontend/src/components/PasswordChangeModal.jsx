import { useState } from 'react'
import { motion } from 'framer-motion'
import EyeIcon from './EyeIcon'
import PasswordCriteriaDots from './PasswordCriteriaDots'
import { isPasswordPolicyMet } from '../utils/passwordValidation'

export default function PasswordChangeModal({
  currentPasswordExpected,
  onSaveAndContinue,
}) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showC, setShowC] = useState(false)
  const [showN, setShowN] = useState(false)
  const [showF, setShowF] = useState(false)

  const [errCurrent, setErrCurrent] = useState('')
  const [errNext, setErrNext] = useState('')
  const [errConfirm, setErrConfirm] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    setErrCurrent('')
    setErrNext('')
    setErrConfirm('')

    let ok = true
    if (!current.trim()) {
      setErrCurrent('Please fill this field.')
      ok = false
    } else if (current !== currentPasswordExpected) {
      setErrCurrent('Current password does not match.')
      ok = false
    }

    if (!isPasswordPolicyMet(next)) {
      setErrNext(
        'Password must meet all complexity requirements listed below.',
      )
      ok = false
    }

    if (confirm !== next) {
      setErrConfirm('Passwords do not match.')
      ok = false
    }

    if (!ok) return
    onSaveAndContinue(next)
  }

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwd-change-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <motion.div
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-2xl sm:p-8"
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        <h2
          id="pwd-change-title"
          className="text-lg font-semibold text-slate-900"
        >
          Welcome! For security reasons, please set a new permanent password
          for your profile.
        </h2>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label
              htmlFor="modal-current"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Current Password
            </label>
            <div className="relative">
              <input
                id="modal-current"
                type={showC ? 'text' : 'password'}
                value={current}
                onChange={(e) => {
                  setCurrent(e.target.value)
                  setErrCurrent('')
                }}
                className={`block w-full rounded-md border py-2.5 pr-11 pl-3.5 text-sm outline-none focus:ring-2 ${
                  errCurrent
                    ? 'border-red-500 focus:ring-red-500/20'
                    : 'border-slate-200 focus:border-[#0056b3] focus:ring-[#0056b3]/20'
                }`}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1.5 text-slate-500 hover:bg-slate-100"
                onClick={() => setShowC((s) => !s)}
                aria-label={showC ? 'Hide password' : 'Show password'}
              >
                <EyeIcon open={showC} />
              </button>
            </div>
            {errCurrent ? (
              <p className="mt-1 text-sm text-red-600">{errCurrent}</p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="modal-new"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              New Password
            </label>
            <div className="relative">
              <input
                id="modal-new"
                type={showN ? 'text' : 'password'}
                value={next}
                onChange={(e) => {
                  setNext(e.target.value)
                  setErrNext('')
                }}
                className={`block w-full rounded-md border py-2.5 pr-11 pl-3.5 text-sm outline-none focus:ring-2 ${
                  errNext
                    ? 'border-red-500 focus:ring-red-500/20'
                    : 'border-slate-200 focus:border-[#0056b3] focus:ring-[#0056b3]/20'
                }`}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1.5 text-slate-500 hover:bg-slate-100"
                onClick={() => setShowN((s) => !s)}
                aria-label={showN ? 'Hide password' : 'Show password'}
              >
                <EyeIcon open={showN} />
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Must be at least 6 characters: 1 uppercase, 1 lowercase, 1
              number, 1 special character (!@#$%^&*).
            </p>
            <PasswordCriteriaDots password={next} idPrefix="modal-new" />
            {errNext ? (
              <p className="mt-2 text-sm text-red-600">{errNext}</p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="modal-confirm"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="modal-confirm"
                type={showF ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value)
                  setErrConfirm('')
                }}
                className={`block w-full rounded-md border py-2.5 pr-11 pl-3.5 text-sm outline-none focus:ring-2 ${
                  errConfirm
                    ? 'border-red-500 focus:ring-red-500/20'
                    : 'border-slate-200 focus:border-[#0056b3] focus:ring-[#0056b3]/20'
                }`}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1.5 text-slate-500 hover:bg-slate-100"
                onClick={() => setShowF((s) => !s)}
                aria-label={showF ? 'Hide password' : 'Show password'}
              >
                <EyeIcon open={showF} />
              </button>
            </div>
            {errConfirm ? (
              <p className="mt-1 text-sm text-red-600">{errConfirm}</p>
            ) : null}
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-[#0056b3] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#004494] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0056b3]"
          >
            Save and Continue
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}
