/**
 * Global mock user directory (localStorage). Mirrors UserEntity.java:
 * id, username, password, email, isActive, roles (array), notifications.
 * `name` is used for UI display (full name in Latin).
 */
import { appendMockAuditLog } from './mockAuditLogs'

/** @typedef {'ADMIN' | 'AUTHOR' | 'REVIEWER' | 'READER'} MockRole */

/**
 * @typedef {{
 *   id: string,
 *   message: string,
 *   timestamp: string,
 *   isRead: boolean,
 *   documentId?: string,
 *   kind?: string,
 * }} MockUserNotification
 */

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   email: string,
 *   username: string,
 *   password?: string,
 *   roles: string[],
 *   isActive: boolean,
 *   isPending?: boolean,
 *   avatar?: string | null,
 *   notifications: MockUserNotification[],
 * }} MockUser
 */

export const MOCK_GLOBAL_USERS_KEY = 'mock_global_users'

const DEMO_PASSWORD = 'SapDemo1!'

/** @returns {MockUser[]} */
export function getDefaultMockUsers() {
  /** @type {MockUser[]} */
  return [
    {
      id: 'usr_adm_dimitar',
      name: 'Dimitar Petrov',
      email: 'dimitar.petrov@sap-demo.bg',
      username: 'adm_dimitar',
      password: DEMO_PASSWORD,
      roles: ['ADMIN'],
      isActive: true,
      isPending: false,
      notifications: [],
    },
    {
      id: 'usr_adm_elena',
      name: 'Elena Stoyanova',
      email: 'elena.stoyanova@sap-demo.bg',
      username: 'adm_elena',
      password: DEMO_PASSWORD,
      roles: ['ADMIN', 'AUTHOR', 'REVIEWER'],
      isActive: true,
      isPending: false,
      notifications: [],
    },
    {
      id: 'usr_auth_ivan',
      name: 'Ivan Ivanov',
      email: 'ivan.ivanov@sap-demo.bg',
      username: 'auth_ivan',
      password: DEMO_PASSWORD,
      roles: ['AUTHOR'],
      isActive: true,
      isPending: false,
      notifications: [],
    },
    {
      id: 'usr_auth_mariya',
      name: 'Mariya Georgieva',
      email: 'mariya.georgieva@sap-demo.bg',
      username: 'auth_mariya',
      password: DEMO_PASSWORD,
      roles: ['AUTHOR'],
      isActive: true,
      isPending: false,
      notifications: [],
    },
    {
      id: 'usr_rev_nikolay',
      name: 'Nikolay Kolev',
      email: 'nikolay.kolev@sap-demo.bg',
      username: 'rev_nikolay',
      password: DEMO_PASSWORD,
      roles: ['REVIEWER'],
      isActive: true,
      isPending: false,
      notifications: [],
    },
    {
      id: 'usr_rev_petya',
      name: 'Petya Uzunova',
      email: 'petya.uzunova@sap-demo.bg',
      username: 'rev_petya',
      password: DEMO_PASSWORD,
      roles: ['REVIEWER'],
      isActive: true,
      isPending: false,
      notifications: [],
    },
    {
      id: 'usr_multi_stefan',
      name: 'Stefan Marinov',
      email: 'stefan.marinov@sap-demo.bg',
      username: 'multi_stefan',
      password: DEMO_PASSWORD,
      roles: ['AUTHOR', 'REVIEWER'],
      isActive: true,
      isPending: false,
      notifications: [],
    },
    {
      id: 'usr_pend_hristo',
      name: 'Hristo Bonev',
      email: 'hristo.bonev@sap-demo.bg',
      username: 'pend_hristo',
      password: DEMO_PASSWORD,
      roles: ['READER'],
      isActive: true,
      isPending: true,
      notifications: [],
    },
    {
      id: 'usr_deact_vladimir',
      name: 'Vladimir Tsvetanov',
      email: 'vladimir.tsvetanov@sap-demo.bg',
      username: 'deact_vladimir',
      password: DEMO_PASSWORD,
      roles: ['READER'],
      isActive: false,
      isPending: false,
      notifications: [],
    },
  ]
}

/**
 * @returns {MockUser[]}
 */
export function loadMockUsers() {
  try {
    const raw = localStorage.getItem(MOCK_GLOBAL_USERS_KEY)
    if (raw == null || raw === '') {
      const defaults = getDefaultMockUsers()
      localStorage.setItem(MOCK_GLOBAL_USERS_KEY, JSON.stringify(defaults))
      return defaults
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      const defaults = getDefaultMockUsers()
      localStorage.setItem(MOCK_GLOBAL_USERS_KEY, JSON.stringify(defaults))
      return defaults
    }
    return /** @type {MockUser[]} */ (
      parsed.map((u) => ({
        ...u,
        notifications: Array.isArray(u.notifications) ? u.notifications : [],
      }))
    )
  } catch {
    const defaults = getDefaultMockUsers()
    try {
      localStorage.setItem(MOCK_GLOBAL_USERS_KEY, JSON.stringify(defaults))
    } catch {
      // ignore
    }
    return defaults
  }
}

/**
 * @param {MockUser[]} users
 */
export function persistMockUsers(users) {
  try {
    localStorage.setItem(MOCK_GLOBAL_USERS_KEY, JSON.stringify(users))
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sap_dm_mock_users_updated'))
  }
}

/**
 * @param {string | null | undefined} userId
 * @returns {string | null} data URL or null
 */
export function getMockUserAvatarDataUrl(userId) {
  if (!userId) return null
  const u = loadMockUsers().find((x) => x.id === userId)
  const a = u?.avatar
  return typeof a === 'string' && a.length > 0 ? a : null
}

/** Display roles: empty array counts as READER-only. */
export function normalizeRolesForDisplay(roles) {
  const r = Array.isArray(roles) ? roles.filter(Boolean) : []
  const upper = r.map((x) => String(x).toUpperCase())
  if (upper.length === 0) return ['READER']
  return upper
}

/**
 * @param {string} username
 * @returns {MockUser | undefined}
 */
export function findMockUserByUsername(username) {
  const q = String(username ?? '')
    .trim()
    .toLowerCase()
  if (!q) return undefined
  return loadMockUsers().find((u) => String(u.username).toLowerCase() === q)
}

function assertValidAdmin(adminSession) {
  if (!adminSession || !adminSession.userId) {
    throw new Error('Error: Invalid admin user.')
  }
}

function assertAdminRole(adminSession, message) {
  if (!Array.isArray(adminSession.roles) || !adminSession.roles.includes('ADMIN')) {
    throw new Error(message)
  }
}

export function ensureUserCanLogin(dirUser) {
  if (!dirUser.isActive) {
    throw new Error('Error: Your account is deactivated.')
  }
  if (dirUser.isPending) {
    throw new Error('Error: Your account is pending administrator approval.')
  }
}

export function setUserRolesByAdmin(adminSession, targetUserId, roles) {
  assertValidAdmin(adminSession)
  assertAdminRole(adminSession, 'Error: Only an administrator (ADMIN) can assign roles.')

  const normalizedRoles = Array.from(
    new Set((Array.isArray(roles) ? roles : []).map((x) => String(x).toUpperCase()).filter(Boolean)),
  )
  const list = loadMockUsers()
  const target = list.find((u) => u.id === targetUserId)
  if (!target) throw new Error('Target user not found in database.')
  const previousRoles = Array.isArray(target.roles) ? target.roles : []
  const isSelfDemotionFromAdmin =
    adminSession.userId === targetUserId &&
    previousRoles.map((r) => String(r).toUpperCase()).includes('ADMIN') &&
    !normalizedRoles.includes('ADMIN')
  if (isSelfDemotionFromAdmin) {
    const adminCount = list.filter((u) => (u.roles || []).map((r) => String(r).toUpperCase()).includes('ADMIN')).length
    if (adminCount === 1) {
      throw new Error('Action denied. You are the last Administrator in the system.')
    }
  }
  const hasAnyChange =
    previousRoles.length !== normalizedRoles.length ||
    previousRoles.some((r) => !normalizedRoles.includes(String(r).toUpperCase()))
  if (!hasAnyChange) {
    throw new Error('Error: The user already has this role.')
  }

  const next = list.map((u) => (u.id === targetUserId ? { ...u, roles: normalizedRoles } : u))
  persistMockUsers(next)
  appendMockAuditLog({
    actorUserId: adminSession.userId,
    actorDisplayName: adminSession.displayName ?? adminSession.userId,
    action: `Updated roles for ${target.name}`,
    category: 'USER',
    type: 'SUCCESS',
    details: {
      targetUserId,
      oldValue: { roles: previousRoles },
      newValue: { roles: normalizedRoles },
    },
  })
}

function createNotification(message, kind) {
  return {
    id: `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    message,
    timestamp: new Date().toISOString(),
    isRead: false,
    kind,
  }
}

function pushNotificationToAdmins(users, message, kind) {
  const n = createNotification(message, kind)
  return users.map((u) => {
    const hasAdminRole = (u.roles || []).map((r) => String(r).toUpperCase()).includes('ADMIN')
    if (!hasAdminRole) return u
    const list = Array.isArray(u.notifications) ? u.notifications : []
    return { ...u, notifications: [n, ...list] }
  })
}

export function createPendingAccountRequest({
  firstName,
  lastName,
  email,
  username,
  password,
}) {
  const normalizedUsername = String(username ?? '').trim().toLowerCase()
  const normalizedEmail = String(email ?? '').trim().toLowerCase()
  const users = loadMockUsers()
  const usernameExists = users.some(
    (u) => String(u.username ?? '').trim().toLowerCase() === normalizedUsername,
  )
  if (usernameExists) {
    throw new Error('This username is already taken.')
  }
  const emailExists = users.some(
    (u) => String(u.email ?? '').trim().toLowerCase() === normalizedEmail,
  )
  if (emailExists) {
    throw new Error('This email is already registered in the system.')
  }

  const id = `usr_req_${Date.now()}`
  const nextUser = {
    id,
    name: `${String(firstName ?? '').trim()} ${String(lastName ?? '').trim()}`.trim() || normalizedUsername,
    email: normalizedEmail,
    username: normalizedUsername,
    password: String(password ?? ''),
    roles: ['READER'],
    isActive: true,
    isPending: true,
    notifications: [],
  }
  const withRequest = [nextUser, ...users]
  const withAdminNotifications = pushNotificationToAdmins(
    withRequest,
    `New account request from ${normalizedUsername}`,
    'account_request',
  )
  persistMockUsers(withAdminNotifications)
  return nextUser
}

export function submitHelpInquiryToAdmins({
  actorUserId,
  actorDisplayName,
  subject,
  message,
}) {
  const users = loadMockUsers()
  const from = actorDisplayName || actorUserId || 'User'
  const composed = `Help inquiry from ${from}: ${subject} - ${message}`
  const next = pushNotificationToAdmins(users, composed, 'help_inquiry')
  persistMockUsers(next)
}

export function deactivateUserByAdmin(adminSession, targetUserId) {
  assertValidAdmin(adminSession)
  assertAdminRole(adminSession, 'Error: Only an administrator (ADMIN) can deactivate accounts.')
  if (adminSession.userId === targetUserId) {
    throw new Error('Error: You cannot deactivate your own account.')
  }
  const list = loadMockUsers()
  const target = list.find((u) => u.id === targetUserId)
  if (!target) throw new Error('User not found.')
  if (!target.isActive) {
    throw new Error('Error: The user is already deactivated.')
  }

  const next = list.map((u) => (u.id === targetUserId ? { ...u, isActive: false, isPending: false } : u))
  persistMockUsers(next)
  appendMockAuditLog({
    actorUserId: adminSession.userId,
    actorDisplayName: adminSession.displayName ?? adminSession.userId,
    action: `Deactivated user ${target.name}`,
    category: 'ADMIN',
    type: 'DANGER',
    details: {
      targetUserId,
      oldValue: { isActive: true },
      newValue: { isActive: false },
    },
  })
}

export function activateUserByAdmin(adminSession, targetUserId) {
  assertValidAdmin(adminSession)
  assertAdminRole(adminSession, 'Error: Only an administrator (ADMIN) can activate accounts.')
  const list = loadMockUsers()
  const target = list.find((u) => u.id === targetUserId)
  if (!target) throw new Error('User not found.')
  if (target.isActive) {
    throw new Error('Error: The user is already active.')
  }
  const next = list.map((u) => (u.id === targetUserId ? { ...u, isActive: true } : u))
  persistMockUsers(next)
  appendMockAuditLog({
    actorUserId: adminSession.userId,
    actorDisplayName: adminSession.displayName ?? adminSession.userId,
    action: `Activated user ${target.name}`,
    category: 'USER',
    type: 'SUCCESS',
    details: {
      targetUserId,
      oldValue: { isActive: false },
      newValue: { isActive: true },
    },
  })
}

export function approvePendingUserByAdmin(adminSession, targetUserId, roles) {
  assertValidAdmin(adminSession)
  assertAdminRole(adminSession, 'Error: Only an administrator (ADMIN) can activate accounts.')
  const list = loadMockUsers()
  const target = list.find((u) => u.id === targetUserId)
  if (!target) throw new Error('User not found.')

  const normalizedRoles = Array.from(
    new Set((Array.isArray(roles) ? roles : []).map((x) => String(x).toUpperCase()).filter(Boolean)),
  )
  const next = list.map((u) =>
    u.id === targetUserId ? { ...u, isPending: false, isActive: true, roles: normalizedRoles } : u,
  )
  persistMockUsers(next)
}
