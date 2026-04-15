/**
 * Global mock user directory (localStorage). Mirrors UserEntity.java:
 * id, username, password, email, isActive, roles (array), notifications.
 * `name` is used for UI display (full name in Latin).
 */

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
