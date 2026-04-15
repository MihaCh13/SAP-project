import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadMockDrafts } from '../../lib/mockDrafts'
import { getMockUserAvatarDataUrl } from '../../lib/mockUsers'
import { getSession, onSessionUpdated } from '../../lib/session'
import NotificationBell from './NotificationBell'

const BADGE = {
  AUTHOR: 'bg-[#D9EEFC] text-[#003d7a]',
  REVIEWER: 'bg-[#E8E0F5] text-[#4c1d95]',
  ADMIN: 'bg-[#D1FAE5] text-[#065f46]',
}

function RoleBadges({ roles }) {
  const [openTip, setOpenTip] = useState(false)
  const visible = roles.slice(0, 2)
  const extra = roles.length - 2

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      {visible.map((r) => (
        <span
          key={r}
          className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[0.75rem] font-medium ${BADGE[r] ?? 'bg-slate-200 text-slate-800'}`}
        >
          {r.charAt(0) + r.slice(1).toLowerCase()}
        </span>
      ))}
      {extra > 0 ? (
        <span className="relative inline-flex">
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-[0.75rem] font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
            aria-label={`${extra} more roles`}
            onMouseEnter={() => setOpenTip(true)}
            onMouseLeave={() => setOpenTip(false)}
            onFocus={() => setOpenTip(true)}
            onBlur={() => setOpenTip(false)}
          >
            +{extra}
          </button>
          {openTip ? (
            <span
              role="tooltip"
              className="absolute top-full left-1/2 z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[0.75rem] text-white shadow-lg"
            >
              {roles.slice(2).join(', ')}
            </span>
          ) : null}
        </span>
      ) : null}
    </div>
  )
}

/**
 * @param {{
 *   onOpenSettings: () => void,
 *   showMobileMenu?: boolean,
 *   onMobileMenuToggle?: () => void,
 *   mobileNavOpen?: boolean,
 * }} props
 */
export default function AppHeader({
  onOpenSettings,
  showMobileMenu = false,
  onMobileMenuToggle,
  mobileNavOpen = false,
}) {
  const navigate = useNavigate()
  const session = getSession()
  const searchRef = useRef(null)
  const searchWrapRef = useRef(null)
  const [, refreshAvatar] = useReducer((s) => s + 1, 0)
  const [, refreshSession] = useReducer((s) => s + 1, 0)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTick, setSearchTick] = useState(0)

  useEffect(() => {
    function onUsersUpdated() {
      refreshAvatar()
    }
    window.addEventListener('sap_dm_mock_users_updated', onUsersUpdated)
    return () => window.removeEventListener('sap_dm_mock_users_updated', onUsersUpdated)
  }, [])

  useEffect(() => onSessionUpdated(() => refreshSession()), [])

  useEffect(() => {
    function onDocsUpdated() {
      setSearchTick((v) => v + 1)
    }
    window.addEventListener('sap_dm_mock_documents_updated', onDocsUpdated)
    return () => window.removeEventListener('sap_dm_mock_documents_updated', onDocsUpdated)
  }, [])

  useEffect(() => {
    function onPointerDown(e) {
      if (!searchWrapRef.current?.contains(e.target)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const matches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    return loadMockDrafts()
      .filter((d) => d.title.toLowerCase().includes(q))
      .slice(0, 8)
  }, [searchQuery, searchTick])

  const initials = (session?.displayName ?? '?')
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const headerAvatarUrl = getMockUserAvatarDataUrl(session?.userId)

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-[0.75rem] px-[1rem] lg:gap-[1rem] lg:px-[1.5rem]">
        {showMobileMenu ? (
          <button
            type="button"
            onClick={onMobileMenuToggle}
            className="inline-flex shrink-0 rounded-xl p-2.5 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileNavOpen}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              {mobileNavOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col gap-[0.25rem] sm:flex-row sm:items-center sm:gap-[0.75rem]">
          <span className="truncate text-[0.875rem] font-semibold text-slate-900">
            {session?.displayName ?? 'User'}
          </span>
          <RoleBadges roles={session?.roles ?? []} />
        </div>

        <div ref={searchWrapRef} className="relative hidden max-w-md flex-1 md:block">
          <label htmlFor="global-search" className="sr-only">
            Search documents
          </label>
          <input
            ref={searchRef}
            id="global-search"
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setSearchOpen(true)
            }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setSearchOpen(false)
            }}
            placeholder="Search documents... (Ctrl+K)"
            className="w-full rounded-xl border border-slate-200 bg-[#F7F9FC] px-[0.75rem] py-[0.5rem] text-[0.875rem] text-slate-900 outline-none ring-[#0056b3]/0 transition placeholder:text-slate-400 focus:border-[#0056b3]/40 focus:bg-white focus:ring-2 focus:ring-[#0056b3]/15"
          />
          {searchOpen && searchQuery.trim() ? (
            <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
              {matches.length === 0 ? (
                <p className="px-3 py-2 text-sm text-slate-500">No matching documents.</p>
              ) : (
                <ul className="max-h-80 overflow-y-auto py-1">
                  {matches.map((doc) => (
                    <li key={doc.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchOpen(false)
                          setSearchQuery('')
                          navigate(`/new-document?id=${encodeURIComponent(doc.id)}`)
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                      >
                        <p className="truncate font-medium">{doc.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{doc.status}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-[0.25rem] sm:gap-[0.5rem]">
          <NotificationBell />

          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#D9EEFC] text-[0.75rem] font-semibold text-[#003d7a]"
            aria-hidden
          >
            {headerAvatarUrl ? (
              <img src={headerAvatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>

          <button
            type="button"
            className="rounded-xl p-2.5 text-slate-500 hover:bg-slate-100"
            aria-label="Settings"
            onClick={onOpenSettings}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.37.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.077-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
