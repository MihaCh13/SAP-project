import { useEffect, useReducer } from 'react'
import { NavLink } from 'react-router-dom'
import { getSession, onSessionUpdated } from '../../lib/session'

const linkBase =
  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors'
const linkIdle = 'text-slate-600 hover:bg-white hover:text-slate-900'
const linkActive = 'bg-white text-[#0056b3] shadow-sm ring-1 ring-slate-200/80'

const newDocCtaIdle =
  'bg-green-50 text-green-700 ring-1 ring-green-200/80 hover:bg-green-100 hover:text-green-800'
const newDocCtaActive =
  'bg-green-100 text-green-800 shadow-sm ring-1 ring-green-300/90'

function NavItem({ to, icon, children, collapsed, cta, onAfterNavigate }) {
  return (
    <NavLink
      to={to}
      title={collapsed ? String(children) : undefined}
      onClick={() => onAfterNavigate?.()}
      className={({ isActive }) =>
        cta
          ? `${linkBase} ${isActive ? newDocCtaActive : newDocCtaIdle}`
          : `${linkBase} ${isActive ? linkActive : linkIdle}`
      }
    >
      {icon}
      {!collapsed ? <span>{children}</span> : null}
    </NavLink>
  )
}

/**
 * @param {{
 *   breakpoint: 'mobile' | 'tablet' | 'desktop',
 *   mobileOpen: boolean,
 *   onCloseMobile: () => void,
 *   collapsed: boolean,
 *   onToggleCollapse: () => void,
 *   onAfterNavigate?: () => void,
 *   onOpenSettings?: () => void,
 *   onRequestLogout?: () => void,
 * }} props
 */
export default function AppSidebar({
  breakpoint,
  mobileOpen,
  onCloseMobile,
  collapsed,
  onToggleCollapse,
  onAfterNavigate = () => {},
  onOpenSettings = () => {},
  onRequestLogout = () => {},
}) {
  const [, refreshSession] = useReducer((s) => s + 1, 0)
  useEffect(() => onSessionUpdated(() => refreshSession()), [])

  const session = getSession()
  const roles = session?.roles ?? []
  const isAuthor = roles.includes('AUTHOR')
  const isReviewer = roles.includes('REVIEWER')
  const isAdmin = roles.includes('ADMIN')

  const isMobile = breakpoint === 'mobile'
  const isTablet = breakpoint === 'tablet'
  const showCollapseControl = !isMobile && !isTablet

  const iconDashboard = (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" />
    </svg>
  )

  return (
    <aside
      className={`flex h-[calc(100dvh-3.5rem)] flex-col border-r border-slate-200/90 bg-[#eef2f8]/80 transition-[width,transform] duration-300 ease-out ${
        isMobile
          ? `fixed left-0 top-14 z-50 w-60 max-w-[85vw] shadow-2xl ${
              mobileOpen ? 'translate-x-0' : '-translate-x-full'
            }`
          : `sticky top-14 z-30 ${collapsed ? 'w-[4.5rem]' : 'w-60'}`
      }`}
    >
      {isMobile ? (
        <div className="flex items-center justify-between border-b border-slate-200/80 px-3 py-2 md:hidden">
          <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-slate-500">Menu</span>
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-2 text-slate-600 hover:bg-white"
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : null}
      <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden p-2 pt-3">
        <p
          className={`mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 ${collapsed ? 'sr-only' : ''}`}
        >
          Global
        </p>
        <NavItem to="/dashboard" collapsed={collapsed} onAfterNavigate={onAfterNavigate} icon={iconDashboard}>
          Dashboard
        </NavItem>
        <NavItem
          to="/public-hub"
          collapsed={collapsed}
          onAfterNavigate={onAfterNavigate}
          icon={
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v15.128c.938.332 1.948.512 3 .512 4.148 0 7.5-3.582 7.5-8.25S10.148 3.75 12 3.75z" />
            </svg>
          }
        >
          Public Hub
        </NavItem>

        {(isAuthor || isReviewer) && (
          <>
            <p
              className={`mb-2 mt-5 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 ${collapsed ? 'sr-only' : ''}`}
            >
              My Work
            </p>
            {isAuthor && (
              <>
                <NavItem
                  to="/my-drafts"
                  collapsed={collapsed}
                  onAfterNavigate={onAfterNavigate}
                  icon={
                    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  }
                >
                  My Drafts
                </NavItem>
                <NavItem
                  to="/new-document"
                  collapsed={collapsed}
                  onAfterNavigate={onAfterNavigate}
                  cta
                  icon={
                    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  }
                >
                  New Document
                </NavItem>
              </>
            )}
            {isReviewer && (
              <NavItem
                to="/pending-review"
                collapsed={collapsed}
                onAfterNavigate={onAfterNavigate}
                icon={
                  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              >
                Pending Review
              </NavItem>
            )}
          </>
        )}

        {isAdmin && (
          <>
            <p
              className={`mb-2 mt-5 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 ${collapsed ? 'sr-only' : ''}`}
            >
              Administration
            </p>
            <NavItem
              to="/users-roles"
              collapsed={collapsed}
              onAfterNavigate={onAfterNavigate}
              icon={
                <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              }
            >
              Users & Roles
            </NavItem>
            <NavItem
              to="/audit-logs"
              collapsed={collapsed}
              onAfterNavigate={onAfterNavigate}
              icon={
                <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                </svg>
              }
            >
              Audit Logs
            </NavItem>
          </>
        )}
      </div>

      <div className="border-t border-slate-200/90 p-2">
        <p className={`mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 ${collapsed ? 'sr-only' : ''}`}>
          Account
        </p>
        <button
          type="button"
          onClick={() => {
            onOpenSettings()
            onAfterNavigate()
          }}
          title={collapsed ? 'Settings' : undefined}
          className={`${linkBase} w-full text-left text-slate-600 hover:bg-white hover:text-slate-900`}
        >
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.37.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.077-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {!collapsed ? <span>Settings</span> : null}
        </button>
        <NavLink
          to="/help"
          title={collapsed ? 'Help & Support' : undefined}
          onClick={() => onAfterNavigate()}
          className={({ isActive }) =>
            `${linkBase} ${isActive ? linkActive : linkIdle}`
          }
        >
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
          </svg>
          {!collapsed ? <span>Help & Support</span> : null}
        </NavLink>
        <button
          type="button"
          onClick={() => {
            onRequestLogout()
            onAfterNavigate()
          }}
          title={collapsed ? 'Logout' : undefined}
          className={`${linkBase} w-full text-left text-slate-600 hover:bg-white hover:text-slate-900`}
        >
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
          {!collapsed ? <span>Logout</span> : null}
        </button>

        {showCollapseControl ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="mt-2 flex w-full items-center justify-center rounded-xl py-[0.5rem] text-[0.75rem] text-slate-500 hover:bg-white hover:text-slate-800"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
            {!collapsed ? <span className="ml-2">Collapse</span> : null}
          </button>
        ) : null}
      </div>
    </aside>
  )
}
