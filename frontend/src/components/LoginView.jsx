import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import EyeIcon from './EyeIcon'
import NodeLinkMesh from './NodeLinkMesh'

const SHAKE = { x: [0, -10, 10, -10, 10, 0] }

export default function LoginView({
  banner,
  onDismissBanner,
  onLogIn,
  onRequestAccount,
}) {
  const userRef = useRef(null)
  const passRef = useRef(null)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)

  const [errUser, setErrUser] = useState('')
  const [errPass, setErrPass] = useState('')
  const [shakeUser, setShakeUser] = useState(0)
  const [shakePass, setShakePass] = useState(0)

  function clearFieldError(which) {
    if (which === 'username') setErrUser('')
    if (which === 'password') setErrPass('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    onDismissBanner?.()

    const u = username.trim()
    const p = password
    const emptyU = !u
    const emptyP = !p

    setErrUser('')
    setErrPass('')

    if (emptyU) setErrUser('Please fill this field.')
    if (emptyP) setErrPass('Please fill this field.')

    if (emptyU) setShakeUser((n) => n + 1)
    if (emptyP) setShakePass((n) => n + 1)

    if (emptyU || emptyP) {
      if (emptyU) userRef.current?.focus()
      else passRef.current?.focus()
      return
    }

    onLogIn({ username: u, password: p })
  }

  return (
    <div className="flex min-h-[100dvh] flex-col lg:flex-row">
      {/* Left: white — logo, title, form (centered mirror layout) */}
      <div className="flex w-full flex-1 flex-col items-center justify-center bg-[#ffffff] px-[1rem] py-[1.5rem] sm:px-[1.5rem] lg:w-1/2 lg:px-[2rem] lg:py-[2rem]">
        <div className="flex max-h-[min(100dvh,40rem)] w-full max-w-md flex-col overflow-y-auto lg:max-h-none lg:overflow-visible">
          {banner ? (
            <motion.div
              role="alert"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 shadow-sm"
            >
              <div className="flex justify-between gap-3">
                <p>{banner}</p>
                <button
                  type="button"
                  className="shrink-0 text-red-700 underline hover:text-red-900"
                  onClick={onDismissBanner}
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          ) : null}

          <div className="mb-8 flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded border border-[#0056b3]/20 bg-[#0056b3] text-sm font-bold tracking-tight text-white shadow-sm"
              aria-hidden
            >
              SAP
            </div>
            <span className="text-xs font-medium uppercase tracking-widest text-slate-500">
              Document Management
            </span>
          </div>

          <h1 className="text-[1.375rem] font-bold tracking-tight text-slate-900 sm:text-[1.5rem]">
            Sign in to SAP Document Management
          </h1>
          <p className="mt-[0.5rem] text-[0.875rem] text-slate-600">
            Use your corporate credentials to continue.
          </p>

          <form className="mt-[2rem] w-full space-y-[1.25rem]" onSubmit={handleSubmit} noValidate>
            <div>
              <label
                htmlFor="login-username"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Username
              </label>
              <motion.div
                key={shakeUser}
                animate={shakeUser ? SHAKE : {}}
                transition={{ duration: 0.45, ease: 'easeInOut' }}
              >
                <input
                  ref={userRef}
                  id="login-username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    clearFieldError('username')
                  }}
                  aria-invalid={errUser ? 'true' : 'false'}
                  aria-describedby={errUser ? 'err-user' : undefined}
                  className={`block w-full rounded-md border bg-white px-[0.875rem] py-[0.625rem] text-[0.875rem] text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:ring-2 ${
                    errUser
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-slate-200 focus:border-[#0056b3] focus:ring-[#0056b3]/20'
                  }`}
                  placeholder="Enter your username"
                />
              </motion.div>
              {errUser ? (
                <p id="err-user" className="mt-1.5 text-sm text-red-600">
                  {errUser}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <motion.div
                key={shakePass}
                animate={shakePass ? SHAKE : {}}
                transition={{ duration: 0.45, ease: 'easeInOut' }}
              >
                <div className="relative">
                  <input
                    ref={passRef}
                    id="login-password"
                    name="password"
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      clearFieldError('password')
                    }}
                    aria-invalid={errPass ? 'true' : 'false'}
                    aria-describedby={errPass ? 'err-pass' : undefined}
                    className={`block w-full rounded-md border bg-white py-[0.625rem] pr-[2.5rem] pl-[0.875rem] text-[0.875rem] text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:ring-2 ${
                      errPass
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-slate-200 focus:border-[#0056b3] focus:ring-[#0056b3]/20'
                    }`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    onClick={() => setShowPass((s) => !s)}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    <EyeIcon open={showPass} />
                  </button>
                </div>
              </motion.div>
              {errPass ? (
                <p id="err-pass" className="mt-1.5 text-sm text-red-600">
                  {errPass}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-[#0056b3] px-[1rem] py-[0.875rem] text-[1rem] font-semibold tracking-wide text-white shadow-sm transition hover:bg-[#004494] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0056b3]"
            >
              Log In
            </button>
          </form>

          <p className="mt-[2rem] text-[0.875rem] text-slate-600">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              className="font-semibold text-[#0056b3] underline-offset-2 hover:underline"
              onClick={onRequestAccount}
            >
              Request Account
            </button>
          </p>
        </div>
      </div>

      {/* Right: radial SAP blue → navy + mesh */}
      <div className="relative flex min-h-[200px] w-full min-w-0 flex-1 lg:min-h-0 lg:w-1/2">
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_120%_100%_at_30%_15%,#0070f2_0%,#003d7a_45%,#002d5e_78%,#001a33_100%)]"
          aria-hidden
        />
        <NodeLinkMesh className="opacity-[0.97]" />
        <div className="relative z-10 hidden flex-col justify-end p-10 text-white/95 lg:flex">
          <p className="max-w-sm text-sm leading-relaxed text-blue-100/90">
            Secure, compliant document workflows for the intelligent enterprise.
          </p>
        </div>
      </div>
    </div>
  )
}
