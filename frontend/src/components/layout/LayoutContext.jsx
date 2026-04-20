import { createContext, useContext } from 'react'

/**
 * @typedef {'mobile' | 'tablet' | 'desktop'} LayoutBreakpoint
 */

/**
 * @typedef {{
 *   sidebarCollapsed: boolean,
 *   setSidebarCollapsed: (v: boolean | ((prev: boolean) => boolean)) => void,
 *   layoutBreakpoint: LayoutBreakpoint,
 *   mobileNavOpen: boolean,
 *   setMobileNavOpen: (v: boolean | ((prev: boolean) => boolean)) => void,
 *   closeMobileNav: () => void,
 * }} AppLayoutContextValue
 */

/** @type {import('react').Context<AppLayoutContextValue | null>} */
export const LayoutContext = createContext(null)

export function useAppLayout() {
  const ctx = useContext(LayoutContext)
  if (!ctx) {
    throw new Error('useAppLayout must be used within MainLayout')
  }
  return ctx
}
