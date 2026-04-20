import { useCallback, useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import AppHeader from './AppHeader'
import AppSidebar from './AppSidebar'
import WelcomeSequence from './WelcomeSequence'
import SettingsDrawer from './SettingsDrawer'
import LogoutConfirmModal from '../LogoutConfirmModal'
import { LayoutContext } from './LayoutContext'
import { clearSession, clearShowWelcomeFlag } from '../../lib/session'
import { useLayoutBreakpoint } from '../../lib/useLayoutBreakpoint'

export default function MainLayout() {
  const [phase, setPhase] = useState(() =>
    typeof sessionStorage !== 'undefined' &&
    sessionStorage.getItem('sap_dm_show_welcome') === '1'
      ? 'welcome'
      : 'main',
  )
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const layoutBreakpoint = useLayoutBreakpoint()
  const isMobile = layoutBreakpoint === 'mobile'
  const isTablet = layoutBreakpoint === 'tablet'
  const sidebarCollapsedEffective = isTablet ? true : sidebarCollapsed

  const closeMobileNav = useCallback(() => {
    setMobileNavOpen(false)
  }, [])

  const performLogout = useCallback(() => {
    clearSession()
    try {
      sessionStorage.clear()
    } catch {
      // ignore
    }
    setLogoutConfirmOpen(false)
    setSettingsOpen(false)
    window.location.href = '/login'
  }, [])

  const layoutValue = useMemo(
    () => ({
      sidebarCollapsed: sidebarCollapsedEffective,
      setSidebarCollapsed,
      layoutBreakpoint,
      mobileNavOpen,
      setMobileNavOpen,
      closeMobileNav,
    }),
    [sidebarCollapsedEffective, layoutBreakpoint, mobileNavOpen, closeMobileNav],
  )

  const handleWelcomeComplete = useCallback(() => {
    clearShowWelcomeFlag()
    setPhase('main')
  }, [])

  return (
    <div className="min-h-[100dvh] bg-[#F7F9FC]">
      <WelcomeSequence
        active={phase === 'welcome'}
        onComplete={handleWelcomeComplete}
      />

      <motion.div
        className="flex min-h-[100dvh] flex-col"
        initial={false}
        animate={
          phase === 'main'
            ? { opacity: 1, y: 0 }
            : { opacity: 0, y: 56 }
        }
        transition={{
          duration: 0.65,
          ease: [0.22, 1, 0.36, 1],
        }}
        style={{ pointerEvents: phase === 'main' ? 'auto' : 'none' }}
      >
        <AppHeader
          onOpenSettings={() => setSettingsOpen(true)}
          showMobileMenu={isMobile}
          onMobileMenuToggle={() => setMobileNavOpen((o) => !o)}
          mobileNavOpen={mobileNavOpen}
        />
        <LayoutContext.Provider value={layoutValue}>
          <div className="relative flex min-w-0 flex-1">
            {isMobile && mobileNavOpen ? (
              <button
                type="button"
                className="fixed inset-0 top-14 z-40 bg-slate-900/35 backdrop-blur-[1px] md:hidden"
                aria-label="Close navigation menu"
                onClick={closeMobileNav}
              />
            ) : null}
            <AppSidebar
              breakpoint={layoutBreakpoint}
              mobileOpen={mobileNavOpen}
              onCloseMobile={closeMobileNav}
              collapsed={sidebarCollapsedEffective}
              onToggleCollapse={() => {
                if (!isTablet) setSidebarCollapsed((c) => !c)
              }}
              onAfterNavigate={closeMobileNav}
              onOpenSettings={() => setSettingsOpen(true)}
              onRequestLogout={() => setLogoutConfirmOpen(true)}
            />
            <main className="min-w-0 flex-1 overflow-auto p-[1rem] md:p-[1.25rem] lg:p-[1.5rem]">
              <div className="mx-auto w-full max-w-7xl">
                <Outlet />
              </div>
            </main>
          </div>
        </LayoutContext.Provider>
      </motion.div>

      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onRequestLogout={() => setLogoutConfirmOpen(true)}
        logoutModalOpen={logoutConfirmOpen}
      />
      <LogoutConfirmModal
        open={logoutConfirmOpen}
        onCancel={() => setLogoutConfirmOpen(false)}
        onConfirm={performLogout}
      />
    </div>
  )
}
