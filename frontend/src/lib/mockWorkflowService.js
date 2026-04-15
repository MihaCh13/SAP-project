/**
 * Client-side workflow mirroring WorkflowService-style rules:
 * submit → SUBMITTED (reviewer queue), approve → APPROVED, reject → REJECTED + feedback.
 */

import { appendMockAuditLog } from './mockAuditLogs'
import { loadMockDrafts, persistMockDrafts, documentAuthorId } from './mockDrafts'
import {
  notifyAuthorDocumentDecision,
  notifyReviewersDocumentSubmitted,
} from './mockUserNotifications'

/**
 * @param {{ userId: string, displayName?: string, roles?: string[] }} session
 */
function canAuthorSubmit(session, doc) {
  const roles = session.roles ?? []
  if (roles.includes('ADMIN') || roles.includes('AUTHOR')) {
    return documentAuthorId(doc) === session.userId
  }
  return false
}

/**
 * @param {{ roles?: string[] }} session
 */
function canReview(session) {
  return Boolean(session.roles?.includes('REVIEWER') || session.roles?.includes('ADMIN'))
}

function validateSession(session) {
  if (!session || !session.userId) {
    throw new IllegalArgumentException('Error: User is null.')
  }
}

function IllegalArgumentException(message) {
  return new Error(message)
}

export function canReviewDocumentAction(doc, session) {
  if (!doc || !session) return false
  if (!canReview(session)) return false
  return documentAuthorId(doc) !== session.userId
}

/**
 * @param {string} docId
 * @param {{ userId: string, displayName?: string, roles?: string[] }} session
 */
export function submitDocumentForReview(docId, session) {
  validateSession(session)
  const list = loadMockDrafts()
  const doc = list.find((d) => d.id === docId)
  if (!doc) {
    throw new IllegalArgumentException('Error: Version not found.')
  }
  if (doc.status !== 'DRAFT' && doc.status !== 'REJECTED') {
    throw new Error('Error: Only DRAFT or REJECTED documents can be submitted.')
  }
  if (!canAuthorSubmit(session, doc)) {
    if (!session.roles?.includes('AUTHOR')) {
      throw new Error('Error: Only authors can submit for review.')
    }
    throw new Error("Error: You cannot submit someone else's document.")
  }
  const now = new Date().toISOString()
  const next = list.map((d) =>
    d.id === docId
      ? {
          ...d,
          status: 'SUBMITTED',
          updatedAt: now,
          lastEditedLabel: 'Just now',
        }
      : d,
  )
  persistMockDrafts(next)
  appendMockAuditLog({
    actorUserId: session.userId,
    actorDisplayName: session.displayName ?? session.userId,
    action: `Submitted document "${doc.title}" for review`,
    category: 'DOCUMENT',
    type: 'SUCCESS',
    details: {
      documentId: docId,
      oldValue: { status: doc.status },
      newValue: { status: 'SUBMITTED' },
    },
  })
  notifyReviewersDocumentSubmitted(
    { ...doc, status: 'SUBMITTED', updatedAt: now, lastEditedLabel: 'Just now' },
    session,
  )
  return { ok: true, message: 'Document submitted for review' }
}

/**
 * @param {string} docId
 * @param {{ userId: string, displayName?: string, roles?: string[] }} session
 */
export function approveDocument(docId, session) {
  validateSession(session)
  if (!canReview(session)) {
    throw new Error('Error: Only REVIEWER role can approve.')
  }
  const list = loadMockDrafts()
  const doc = list.find((d) => d.id === docId)
  if (!doc) {
    throw new IllegalArgumentException('Error: Version not found.')
  }
  if (documentAuthorId(doc) === session.userId) {
    throw new Error('Error: You cannot approve your own document!')
  }
  if (doc.status !== 'SUBMITTED') {
    throw new Error('Error: Only PENDING_REVIEW status can be approved.')
  }
  const now = new Date().toISOString()
  const next = list.map((d) => (d.id === docId ? { ...d, status: 'APPROVED', updatedAt: now, lastEditedLabel: 'Just now' } : d))
  persistMockDrafts(next)
  appendMockAuditLog({
    actorUserId: session.userId,
    actorDisplayName: session.displayName ?? session.userId,
    action: `Approved document "${doc.title}"`,
    category: 'DOCUMENT',
    type: 'SUCCESS',
    details: {
      documentId: docId,
      oldValue: { status: 'SUBMITTED' },
      newValue: { status: 'APPROVED', approvedAt: now },
    },
  })
  notifyAuthorDocumentDecision(doc, 'APPROVED', session)
  return { ok: true }
}

/**
 * @param {string} docId
 * @param {{ userId: string, displayName?: string, roles?: string[] }} session
 * @param {string} comment
 * @param {{ reviewerLabel: string, timestampLabel: string }} feedbackMeta
 */
export function rejectDocument(docId, session, comment, feedbackMeta) {
  validateSession(session)
  if (!canReview(session)) {
    throw new Error('Error: Only REVIEWER role can reject.')
  }
  const list = loadMockDrafts()
  const doc = list.find((d) => d.id === docId)
  if (!doc) {
    throw new IllegalArgumentException('Error: Version not found.')
  }
  if (documentAuthorId(doc) === session.userId) {
    throw new Error('Error: You cannot reject your own work!')
  }
  if (doc.status !== 'SUBMITTED') {
    throw new Error('Error: Only PENDING_REVIEW status can be rejected.')
  }
  const now = new Date().toISOString()
  const feedback = {
    reviewerName: feedbackMeta.reviewerLabel,
    timestamp: feedbackMeta.timestampLabel,
    comment: comment.trim(),
  }
  const next = list.map((d) =>
    d.id === docId
      ? {
          ...d,
          status: 'REJECTED',
          feedback,
          updatedAt: now,
          lastEditedLabel: 'Just now',
        }
      : d,
  )
  persistMockDrafts(next)
  appendMockAuditLog({
    actorUserId: session.userId,
    actorDisplayName: session.displayName ?? session.userId,
    action: `Rejected document "${doc.title}"`,
    category: 'DOCUMENT',
    type: 'DANGER',
    details: {
      documentId: docId,
      oldValue: { status: 'SUBMITTED' },
      newValue: { status: 'REJECTED', comment: feedback.comment },
    },
  })
  notifyAuthorDocumentDecision(doc, 'REJECTED', session)
  return { ok: true }
}
