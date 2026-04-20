import { findMockUserByUsername, loadMockUsers, normalizeRolesForDisplay } from './mockUsers'

const STORAGE_KEY = 'sap_dm_session'
const WELCOME_KEY = 'sap_dm_show_welcome'

/** Mock auth: persisted per username after first-time password change (demo only). */
const DEFAULT_MOCK_PASSWORD = 'SapDemo1!'
const SESSION_UPDATED_EVENT = 'sap_dm_session_updated'

function normalizeMockUsername(username) {
  return String(username ?? '')
    .trim()
    .toLowerCase() || '_'
}

function mockPasswordKey(username) {
  return `mock_password_${normalizeMockUsername(username)}`
}

function mockPasswordCompleteKey(username) {
  return `mock_password_change_complete_${normalizeMockUsername(username)}`
}

export function hasCompletedMockPasswordChange(username) {
  try {
    return localStorage.getItem(mockPasswordCompleteKey(username)) === '1'
  } catch {
    return false
  }
}

/** Password accepted on the login form for mock auth (default or post-change for that user). */
export function getExpectedMockLoginPassword(username) {
  const un = normalizeMockUsername(username)
  try {
    if (localStorage.getItem(mockPasswordCompleteKey(username)) === '1') {
      return localStorage.getItem(mockPasswordKey(username)) ?? DEFAULT_MOCK_PASSWORD
    }
  } catch {
    // ignore
  }
  try {
    const users = loadMockUsers()
    const dirUser = users.find((x) => String(x.username).toLowerCase() === un)
    if (dirUser && typeof dirUser.password === 'string' && dirUser.password.length > 0) {
      return dirUser.password
    }
  } catch {
    // ignore
  }
  return DEFAULT_MOCK_PASSWORD
}

/** Call after the user successfully completes PasswordChangeModal. */
export function persistMockPasswordAfterChange(username, newPassword) {
  localStorage.setItem(mockPasswordKey(username), newPassword)
  localStorage.setItem(mockPasswordCompleteKey(username), '1')
}

export function getSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data?.userId) return null
    return data
  } catch {
    return null
  }
}

/**
 * @param {{ userId: string, displayName: string, roles: string[], username?: string, email?: string }} session
 */
export function persistSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SESSION_UPDATED_EVENT))
  }
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY)
  sessionStorage.removeItem(WELCOME_KEY)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SESSION_UPDATED_EVENT))
  }
}

export function notifySessionUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SESSION_UPDATED_EVENT))
  }
}

export function onSessionUpdated(listener) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(SESSION_UPDATED_EVENT, listener)
  return () => window.removeEventListener(SESSION_UPDATED_EVENT, listener)
}

export function setShowWelcomeFlag() {
  sessionStorage.setItem(WELCOME_KEY, '1')
}

export function consumeShowWelcomeFlag() {
  return sessionStorage.getItem(WELCOME_KEY) === '1'
}

export function clearShowWelcomeFlag() {
  sessionStorage.removeItem(WELCOME_KEY)
}

/**
 * Builds session from the global mock user directory (mirrors server-side principal).
 * @param {string} username
 */
export function buildSessionFromUsername(username) {
  const trimmed = username.trim()
  const dir = findMockUserByUsername(trimmed)
  if (dir) {
    return {
      userId: dir.id,
      displayName: dir.name,
      roles: normalizeRolesForDisplay(dir.roles),
      username: dir.username,
      email: dir.email,
    }
  }

  const u = trimmed.toLowerCase()
  const safeId = u.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'user'
  let roles = ['AUTHOR']
  if (u === 'admin' || u.includes('admin')) {
    roles = ['ADMIN', 'AUTHOR', 'REVIEWER']
  } else if (u.includes('reviewer')) {
    roles = ['REVIEWER']
  } else if (u.includes('author')) {
    roles = ['AUTHOR']
  }

  const parts = trimmed.split(/[._\s-]+/).filter(Boolean)
  const displayName =
    parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ') || trimmed

  return {
    userId: `usr_${safeId}`,
    displayName,
    roles,
    username: trimmed,
  }
}
