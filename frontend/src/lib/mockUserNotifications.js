/**
 * In-app notifications stored on each user (mock_global_users.notifications).
 * Mirrors NotificationController-style delivery for the demo SPA.
 */

import { appendMockAuditLog } from './mockAuditLogs'
import { documentAuthorId } from './mockDrafts'
import { loadMockUsers, persistMockUsers } from './mockUsers'

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

/** @param {unknown} n */
function isValidNotification(n) {
  if (!n || typeof n !== 'object') return false
  const o = /** @type {Record<string, unknown>} */ (n)
  return typeof o.id === 'string' && typeof o.message === 'string' && typeof o.timestamp === 'string'
}

/** @param {unknown[]} raw */
export function normalizeUserNotifications(raw) {
  if (!Array.isArray(raw)) return []
  /** @type {MockUserNotification[]} */
  const out = []
  for (const item of raw) {
    if (!isValidNotification(item)) continue
    const o = /** @type {MockUserNotification} */ (item)
    out.push({
      ...o,
      isRead: Boolean(o.isRead),
    })
  }
  return out
}

/**
 * @param {Omit<MockUserNotification, 'id' | 'timestamp' | 'isRead'> & { id?: string, timestamp?: string, isRead?: boolean }} partial
 * @returns {MockUserNotification}
 */
export function createNotification(partial) {
  return {
    id:
      partial.id ??
      `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    timestamp: partial.timestamp ?? new Date().toISOString(),
    isRead: partial.isRead ?? false,
    message: partial.message,
    documentId: partial.documentId,
    kind: partial.kind,
  }
}

/**
 * @param {string[]} userIds
 * @param {Omit<MockUserNotification, 'id' | 'timestamp' | 'isRead'> & { id?: string }} payload
 */
export function pushNotificationToUserIds(userIds, payload) {
  const set = new Set(userIds.filter(Boolean))
  if (set.size === 0) return
  const n = createNotification(payload)
  const users = loadMockUsers()
  const next = users.map((u) => {
    if (!set.has(u.id)) return u
    const existing = normalizeUserNotifications(
      Array.isArray(u.notifications) ? u.notifications : [],
    )
    return { ...u, notifications: [n, ...existing] }
  })
  persistMockUsers(next)
}

/**
 * @param {import('./mockDrafts.js').MockDraft} doc
 * @param {{ userId: string, displayName?: string }} authorSession
 */
export function notifyReviewersDocumentSubmitted(doc, authorSession) {
  const authorId = authorSession.userId
  const authorName = authorSession.displayName ?? 'An author'
  const users = loadMockUsers()
  const reviewerIds = users
    .filter((u) => u.isActive && !u.isPending && u.id !== authorId)
    .filter((u) =>
      (u.roles || []).some((r) => String(r).toUpperCase() === 'REVIEWER'),
    )
    .map((u) => u.id)
  pushNotificationToUserIds(reviewerIds, {
    message: `${authorName} submitted “${doc.title}” for your review.`,
    documentId: doc.id,
    kind: 'document_submitted',
  })
}

/**
 * @param {import('./mockDrafts.js').MockDraft} doc
 * @param {'APPROVED' | 'REJECTED'} decision
 * @param {{ userId: string, displayName?: string }} reviewerSession
 */
export function notifyAuthorDocumentDecision(doc, decision, reviewerSession) {
  const authorId = documentAuthorId(doc)
  if (!authorId || authorId === reviewerSession.userId) return
  const reviewerName = reviewerSession.displayName ?? 'A reviewer'
  const msg =
    decision === 'APPROVED'
      ? `${reviewerName} approved “${doc.title}”.`
      : `${reviewerName} rejected “${doc.title}”. Open My Drafts to read feedback.`
  pushNotificationToUserIds([authorId], {
    message: msg,
    documentId: doc.id,
    kind: decision === 'APPROVED' ? 'document_approved' : 'document_rejected',
  })
}

/**
 * @param {string} userId
 */
export function getNotificationsForUser(userId) {
  const u = loadMockUsers().find((x) => x.id === userId)
  if (!u) return []
  return normalizeUserNotifications(Array.isArray(u.notifications) ? u.notifications : [])
}

/**
 * @param {string} userId
 */
export function getUnreadNotificationCountForUser(userId) {
  return getNotificationsForUser(userId).filter((n) => !n.isRead).length
}

/**
 * @param {string} userId
 * @param {string} notificationId
 * @param {string} actorDisplayName
 */
export function markNotificationAsRead(userId, notificationId, actorDisplayName) {
  const users = loadMockUsers()
  const u = users.find((x) => x.id === userId)
  if (!u) return false
  const list = normalizeUserNotifications(Array.isArray(u.notifications) ? u.notifications : [])
  const idx = list.findIndex((n) => n.id === notificationId)
  if (idx < 0) return false
  if (list[idx].isRead) return true
  const nextList = list.map((n, i) => (i === idx ? { ...n, isRead: true } : n))
  const nextUsers = users.map((x) =>
    x.id === userId ? { ...x, notifications: nextList } : x,
  )
  persistMockUsers(nextUsers)
  appendMockAuditLog({
    actorUserId: userId,
    actorDisplayName: actorDisplayName || u.name,
    action: 'Marked notification as read',
    category: 'USER',
    type: 'INFO',
    details: { notificationId, targetUserId: userId },
  })
  return true
}
