import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import EyeIcon from './EyeIcon'
import NodeLinkMesh from './NodeLinkMesh'
import PasswordCriteriaDots from './PasswordCriteriaDots'
import {
  SAP_EMAIL_REGEX,
  isPasswordPolicyMet,
} from '../utils/passwordValidation'

/** Simulated taken usernames for demo (case-insensitive). */
const TAKEN_USERNAMES = new Set(['taken', 'admin', 'sapuser'])

export default function AccountRequestView({ onCancel }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [dept, setDept] = useState('')
  const [username, setUsername] = useState('')
  const [tempPass, setTempPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')

  const [showTemp, setShowTemp] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [emailTouched, setEmailTouched] = useState(false)
  const [emailErr, setEmailErr] = useState('')
  const [userErr, setUserErr] = useState('')
  const [confirmErr, setConfirmErr] = useState('')
  const [tempPassBlurred, setTempPassBlurred] = useState(false)

  const [shakeFirst, setShakeFirst] = useState(0)
  const [shakeLast, setShakeLast] = useState(0)
  const [shakeEmail, setShakeEmail] = useState(0)
  const [shakeUser, setShakeUser] = useState(0)
  const [shakeTemp, setShakeTemp] = useState(0)
  const [shakeConfirm, setShakeConfirm] = useState(0)

  const [fieldErr, setFieldErr] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    tempPass: '',
    confirmPass: '',
  })

  const [submitted, setSubmitted] = useState(false)

  function validateEmailValue(val) {
    const v = val.trim()
    if (!v) return 'Please fill this field.'
    if (!SAP_EMAIL_REGEX.test(v)) {
      return 'Please use a corporate email address (e.g., name@sap.com).'
    }
    return ''
  }

  function handleEmailBlur() {
    setEmailTouched(true)
    setEmailErr(validateEmailValue(email))
  }

  function handleUsernameBlur() {
    const u = username.trim().toLowerCase()
    if (!u) {
      setUserErr('')
      return
    }
    if (TAKEN_USERNAMES.has(u)) {
      setUserErr('This username is already taken')
    } else {
      setUserErr('')
    }
  }

  function handleTempPassBlur() {
    setTempPassBlurred(true)
  }

  function handleConfirmBlur() {
    if (!confirmPass.trim()) {
      setConfirmErr('')
      return
    }
    if (tempPass && confirmPass !== tempPass) {
      setConfirmErr('Passwords do not match.')
    } else {
      setConfirmErr('')
    }
  }

  /** Red border after blur only when user entered text that fails full policy (incl. 1 char). */
  const tempPassInvalidVisual =
    Boolean(fieldErr.tempPass) ||
    (tempPassBlurred &&
      tempPass.length > 0 &&
      !isPasswordPolicyMet(tempPass))

  function handleSubmit(e) {
    e.preventDefault()
    setEmailTouched(true)
    setConfirmErr('')

    const uLower = username.trim().toLowerCase()
    if (uLower && TAKEN_USERNAMES.has(uLower)) {
      setUserErr('This username is already taken')
      setShakeUser((n) => n + 1)
      return
    }

    const fe = {
      firstName: '',
      lastName: '',
      email: '',
      username: '',
      tempPass: '',
      confirmPass: '',
    }

    if (!firstName.trim()) {
      fe.firstName = 'Please fill this field.'
      setShakeFirst((n) => n + 1)
    }
    if (!lastName.trim()) {
      fe.lastName = 'Please fill this field.'
      setShakeLast((n) => n + 1)
    }

    if (!email.trim()) {
      fe.email = 'Please fill this field.'
      setShakeEmail((n) => n + 1)
    } else {
      const ev = validateEmailValue(email)
      if (ev) {
        fe.email = ev
        setShakeEmail((n) => n + 1)
      }
    }

    if (!username.trim()) {
      fe.username = 'Please fill this field.'
      setShakeUser((n) => n + 1)
    }

    if (!tempPass) {
      fe.tempPass = 'Please fill this field.'
      setShakeTemp((n) => n + 1)
    } else if (!isPasswordPolicyMet(tempPass)) {
      fe.tempPass = 'Password does not meet complexity requirements.'
      setShakeTemp((n) => n + 1)
    }

    if (!confirmPass.trim()) {
      fe.confirmPass = 'Please fill this field.'
      setShakeConfirm((n) => n + 1)
    } else if (confirmPass !== tempPass) {
      fe.confirmPass = 'Passwords do not match.'
      setShakeConfirm((n) => n + 1)
    }

    setEmailErr(validateEmailValue(email))
    setFieldErr(fe)

    if (Object.values(fe).some(Boolean)) return
    setSubmitted(true)
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f4f7f6] lg:flex-row">
      <div className="flex w-full flex-1 flex-col items-center justify-center bg-[#ffffff] px-[1rem] py-[1.5rem] sm:px-[1.5rem] lg:w-1/2 lg:px-[2rem] lg:py-[2rem]">
        <div className="flex max-h-[min(100dvh,48rem)] w-full max-w-md flex-col overflow-y-auto">
          <div className="mb-6 flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded border border-[#0056b3]/20 bg-[#0056b3] text-sm font-bold text-white"
              aria-hidden
            >
              SAP
            </div>
            <span className="text-xs font-medium uppercase tracking-widest text-slate-500">
              Document Management
            </span>
          </div>

          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex max-w-md flex-col items-center py-6 text-center"
              >
                <div
                  className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg"
                  aria-hidden
                >
                  <svg
                    className="h-10 w-10"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Request submitted successfully!
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Awaiting administrator approval.
                </p>
                <button
                  type="button"
                  className="mt-10 w-full max-w-xs rounded-md bg-[#0070f2] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#0056b3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0070f2] sm:w-auto"
                  onClick={onCancel}
                >
                  Return to Login
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <h1 className="text-2xl font-bold text-slate-900">
                  Request an account
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Complete the form below. Fields marked as required must be
                  filled in.
                </p>

                <form
                  className="mt-8 max-w-md space-y-5"
                  onSubmit={handleSubmit}
                  noValidate
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="ar-first"
                        className="mb-1 block text-sm font-medium text-slate-700"
                      >
                        First Name <span className="text-red-600">*</span>
                      </label>
                      <motion.div
                        key={shakeFirst}
                        initial={{ x: 0 }}
                        animate={
                          shakeFirst > 0
                            ? { x: [0, -10, 10, -10, 10, 0] }
                            : { x: 0 }
                        }
                        transition={{ duration: 0.45, ease: 'easeInOut' }}
                      >
                        <input
                          id="ar-first"
                          value={firstName}
                          onChange={(e) => {
                            setFirstName(e.target.value)
                            setFieldErr((f) => ({ ...f, firstName: '' }))
                          }}
                          className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 ${
                            fieldErr.firstName
                              ? 'border-red-500 focus:ring-red-500/20'
                              : 'border-slate-200 focus:border-[#0056b3] focus:ring-[#0056b3]/20'
                          }`}
                          placeholder="First name"
                        />
                      </motion.div>
                      {fieldErr.firstName ? (
                        <p className="mt-1 text-xs text-red-600">
                          {fieldErr.firstName}
                        </p>
                      ) : null}
                    </div>
                    <div>
                      <label
                        htmlFor="ar-last"
                        className="mb-1 block text-sm font-medium text-slate-700"
                      >
                        Last Name <span className="text-red-600">*</span>
                      </label>
                      <motion.div
                        key={shakeLast}
                        initial={{ x: 0 }}
                        animate={
                          shakeLast > 0
                            ? { x: [0, -10, 10, -10, 10, 0] }
                            : { x: 0 }
                        }
                        transition={{ duration: 0.45, ease: 'easeInOut' }}
                      >
                        <input
                          id="ar-last"
                          value={lastName}
                          onChange={(e) => {
                            setLastName(e.target.value)
                            setFieldErr((f) => ({ ...f, lastName: '' }))
                          }}
                          className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 ${
                            fieldErr.lastName
                              ? 'border-red-500 focus:ring-red-500/20'
                              : 'border-slate-200 focus:border-[#0056b3] focus:ring-[#0056b3]/20'
                          }`}
                          placeholder="Last name"
                        />
                      </motion.div>
                      {fieldErr.lastName ? (
                        <p className="mt-1 text-xs text-red-600">
                          {fieldErr.lastName}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="ar-email"
                      className="mb-1 block text-sm font-medium text-slate-700"
                    >
                      Corporate Email <span className="text-red-600">*</span>
                    </label>
                    <motion.div
                      key={shakeEmail}
                      initial={{ x: 0 }}
                      animate={
                        shakeEmail > 0
                          ? { x: [0, -10, 10, -10, 10, 0] }
                          : { x: 0 }
                      }
                      transition={{ duration: 0.45, ease: 'easeInOut' }}
                    >
                      <input
                        id="ar-email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          setFieldErr((f) => ({ ...f, email: '' }))
                          if (emailTouched)
                            setEmailErr(validateEmailValue(e.target.value))
                        }}
                        onBlur={handleEmailBlur}
                        className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 ${
                          fieldErr.email || (emailTouched && emailErr)
                            ? 'border-red-500 focus:ring-red-500/20'
                            : 'border-slate-200 focus:border-[#0056b3] focus:ring-[#0056b3]/20'
                        }`}
                        placeholder="name@sap.com"
                        autoComplete="email"
                      />
                    </motion.div>
                    {(emailTouched && emailErr) || fieldErr.email ? (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldErr.email || emailErr}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label
                      htmlFor="ar-dept"
                      className="mb-1 block text-sm font-medium text-slate-700"
                    >
                      Department / Role{' '}
                      <span className="font-normal text-slate-400">(Optional)</span>
                    </label>
                    <input
                      id="ar-dept"
                      value={dept}
                      onChange={(e) => setDept(e.target.value)}
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0056b3] focus:ring-2 focus:ring-[#0056b3]/20"
                      placeholder="e.g., Finance — Analyst"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="ar-user"
                      className="mb-1 block text-sm font-medium text-slate-700"
                    >
                      Username <span className="text-red-600">*</span>
                    </label>
                    <motion.div
                      key={shakeUser}
                      initial={{ x: 0 }}
                      animate={
                        shakeUser > 0
                          ? { x: [0, -10, 10, -10, 10, 0] }
                          : { x: 0 }
                      }
                      transition={{ duration: 0.45, ease: 'easeInOut' }}
                    >
                      <input
                        id="ar-user"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value)
                          setFieldErr((f) => ({ ...f, username: '' }))
                          setUserErr('')
                        }}
                        onBlur={handleUsernameBlur}
                        className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 ${
                          fieldErr.username || userErr
                            ? 'border-red-500 focus:ring-red-500/20'
                            : 'border-slate-200 focus:border-[#0056b3] focus:ring-[#0056b3]/20'
                        }`}
                        placeholder="Choose a username"
                        autoComplete="username"
                      />
                    </motion.div>
                    {userErr ? (
                      <p className="mt-1 text-xs text-red-600">{userErr}</p>
                    ) : null}
                    {fieldErr.username ? (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldErr.username}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label
                      htmlFor="ar-tempp"
                      className="mb-1 block text-sm font-medium text-slate-700"
                    >
                      Temporary Password{' '}
                      <span className="text-red-600">*</span>
                    </label>
                    <motion.div
                      key={shakeTemp}
                      initial={{ x: 0 }}
                      animate={
                        shakeTemp > 0
                          ? { x: [0, -10, 10, -10, 10, 0] }
                          : { x: 0 }
                      }
                      transition={{ duration: 0.45, ease: 'easeInOut' }}
                    >
                      <div className="relative">
                        <input
                          id="ar-tempp"
                          type={showTemp ? 'text' : 'password'}
                          value={tempPass}
                          onChange={(e) => {
                            setTempPass(e.target.value)
                            setFieldErr((f) => ({ ...f, tempPass: '' }))
                          }}
                          onBlur={handleTempPassBlur}
                          className={`block w-full rounded-md border bg-white py-2.5 pr-11 pl-3 text-sm outline-none focus:ring-2 ${
                            tempPassInvalidVisual
                              ? 'border-red-500 focus:ring-red-500/20'
                              : 'border-slate-200 focus:border-[#0056b3] focus:ring-[#0056b3]/20'
                          }`}
                          placeholder="Temporary password"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                          onClick={() => setShowTemp((s) => !s)}
                          aria-label={
                            showTemp ? 'Hide password' : 'Show password'
                          }
                        >
                          <EyeIcon open={showTemp} />
                        </button>
                      </div>
                    </motion.div>
                    <p className="mt-1 text-xs text-slate-500">
                      Must be at least 6 characters: 1 uppercase, 1 lowercase,
                      1 number, 1 special character (!@#$%^&*).
                    </p>
                    <PasswordCriteriaDots password={tempPass} idPrefix="ar-temp" />
                    {fieldErr.tempPass ? (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldErr.tempPass}
                      </p>
                    ) : tempPassBlurred &&
                      tempPass.length > 0 &&
                      !isPasswordPolicyMet(tempPass) ? (
                      <p className="mt-1 text-xs text-red-600">
                        Password does not meet complexity requirements.
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label
                      htmlFor="ar-confirm"
                      className="mb-1 block text-sm font-medium text-slate-700"
                    >
                      Confirm Temporary Password{' '}
                      <span className="text-red-600">*</span>
                    </label>
                    <motion.div
                      key={shakeConfirm}
                      initial={{ x: 0 }}
                      animate={
                        shakeConfirm > 0
                          ? { x: [0, -10, 10, -10, 10, 0] }
                          : { x: 0 }
                      }
                      transition={{ duration: 0.45, ease: 'easeInOut' }}
                    >
                      <div className="relative">
                        <input
                          id="ar-confirm"
                          type={showConfirm ? 'text' : 'password'}
                          value={confirmPass}
                          onChange={(e) => {
                            setConfirmPass(e.target.value)
                            setFieldErr((f) => ({ ...f, confirmPass: '' }))
                            setConfirmErr('')
                          }}
                          onBlur={handleConfirmBlur}
                          className={`block w-full rounded-md border bg-white py-2.5 pr-11 pl-3 text-sm outline-none focus:ring-2 ${
                            fieldErr.confirmPass || confirmErr
                              ? 'border-red-500 focus:ring-red-500/20'
                              : 'border-slate-200 focus:border-[#0056b3] focus:ring-[#0056b3]/20'
                          }`}
                          placeholder="Re-enter temporary password"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                          onClick={() => setShowConfirm((s) => !s)}
                          aria-label={
                            showConfirm ? 'Hide password' : 'Show password'
                          }
                        >
                          <EyeIcon open={showConfirm} />
                        </button>
                      </div>
                    </motion.div>
                    {confirmErr || fieldErr.confirmPass ? (
                      <p className="mt-1 text-xs text-red-600">
                        {fieldErr.confirmPass || confirmErr}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
                    <button
                      type="submit"
                      className="rounded-md bg-[#0056b3] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#004494] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0056b3]"
                    >
                      Submit Request
                    </button>
                    <button
                      type="button"
                      className="text-sm font-medium text-[#0056b3] underline-offset-2 hover:underline"
                      onClick={onCancel}
                    >
                      Cancel (Back to Login)
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="relative flex min-h-[200px] w-full min-w-0 flex-1 lg:min-h-0 lg:w-1/2">
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_120%_100%_at_30%_15%,#0070f2_0%,#003d7a_45%,#002d5e_78%,#001a33_100%)]"
          aria-hidden
        />
        <NodeLinkMesh className="opacity-[0.97]" />
      </div>
    </div>
  )
}
