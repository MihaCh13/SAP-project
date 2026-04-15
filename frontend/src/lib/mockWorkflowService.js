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

/**
 * @param {string} docId
 * @param {{ userId: string, displayName?: string, roles?: string[] }} session
 */
export function submitDocumentForReview(docId, session) {
  const list = loadMockDrafts()
  const doc = list.find((d) => d.id === docId)
  if (!doc) return { ok: false, message: 'Document not found.' }
  if (doc.status !== 'DRAFT' && doc.status !== 'REJECTED') {
    return { ok: false, message: 'Only drafts or rejected documents can be submitted.' }
  }
  if (!canAuthorSubmit(session, doc)) {
    return { ok: false, message: 'You do not have permission to submit this document.' }
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
  if (!canReview(session)) {
    return { ok: false, message: 'Reviewer permissions required.' }
  }
  const list = loadMockDrafts()
  const doc = list.find((d) => d.id === docId)
  if (!doc) return { ok: false, message: 'Document not found.' }
  if (doc.status !== 'SUBMITTED') {
    return { ok: false, message: 'Only submitted documents can be approved.' }
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
  if (!canReview(session)) {
    return { ok: false, message: 'Reviewer permissions required.' }
  }
  const list = loadMockDrafts()
  const doc = list.find((d) => d.id === docId)
  if (!doc) return { ok: false, message: 'Document not found.' }
  if (doc.status !== 'SUBMITTED') {
    return { ok: false, message: 'Only submitted documents can be rejected.' }
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
