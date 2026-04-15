import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import LoginView from './LoginView'
import AccountRequestView from './AccountRequestView'
import PasswordChangeModal from './PasswordChangeModal'
import {
  buildSessionFromUsername,
  getExpectedMockLoginPassword,
  getSession,
  hasCompletedMockPasswordChange,
  persistMockPasswordAfterChange,
  persistSession,
  setShowWelcomeFlag,
} from '../lib/session'
import { ensureUserCanLogin, findMockUserByUsername } from '../lib/mockUsers'

/**
 * Login & account request. Successful auth persists session and navigates to /dashboard.
 * Demo default password: SapDemo1! (overridden in localStorage after first password change).
 * Inactive accounts (for example `deact_vladimir`) cannot sign in.
 */
export default function LoginContainer() {
  const navigate = useNavigate()
  const [view, setView] = useState('login')
  const [authStage, setAuthStage] = useState('unauthenticated')
  const [loginBanner, setLoginBanner] = useState(null)
  const [sessionPassword, setSessionPassword] = useState('')
  const [pendingUsername, setPendingUsername] = useState('')

  useEffect(() => {
    if (getSession()?.userId) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

  function completeAuthenticatedLogin(username) {
    const session = buildSessionFromUsername(username)
    persistSession(session)
    setShowWelcomeFlag()
    navigate('/dashboard', { replace: true })
  }

  function handleLogIn({ username, password }) {
    setLoginBanner(null)
    const dirUser = findMockUserByUsername(username)
    if (!dirUser) {
      setLoginBanner('Invalid username or password.')
      return
    }
    try {
      ensureUserCanLogin(dirUser)
    } catch (error) {
      setLoginBanner(error instanceof Error ? error.message : 'Authentication failed.')
      return
    }
    if (password !== getExpectedMockLoginPassword(username)) {
      setLoginBanner('Invalid username or password.')
      return
    }
    setPendingUsername(username)
    setSessionPassword(password)
    if (!hasCompletedMockPasswordChange(username)) {
      setAuthStage('mustChangePassword')
      return
    }
    completeAuthenticatedLogin(username)
  }

  function handlePasswordSave(newPassword) {
    persistMockPasswordAfterChange(pendingUsername, newPassword)
    completeAuthenticatedLogin(pendingUsername)
  }

  return (
    <div className="min-h-[100dvh] bg-[#f4f7f6]">
      <AnimatePresence mode="wait">
        {authStage !== 'authenticated' && view === 'login' && (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: -28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <LoginView
              banner={loginBanner}
              onDismissBanner={() => setLoginBanner(null)}
              onLogIn={handleLogIn}
              onRequestAccount={() => setView('accountRequest')}
            />
          </motion.div>
        )}
        {authStage === 'unauthenticated' && view === 'accountRequest' && (
          <motion.div
            key="accountRequest"
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <AccountRequestView onCancel={() => setView('login')} />
          </motion.div>
        )}
      </AnimatePresence>

      {authStage === 'mustChangePassword' && (
        <PasswordChangeModal
          currentPasswordExpected={sessionPassword}
          onSaveAndContinue={handlePasswordSave}
        />
      )}
    </div>
  )
}
