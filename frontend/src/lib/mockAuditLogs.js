/**
 * Audit trail aligned with AuditLog.java: id, user (actor display), action, timestamp, details.
 * Optional category/type support the admin UI filters.
 */

/** @typedef {'USER' | 'DOCUMENT' | 'ADMIN'} AuditCategory */
/** @typedef {'SUCCESS' | 'INFO' | 'WARNING' | 'DANGER'} AuditLogType */

/**
 * @typedef {{
 *   id: string,
 *   timestamp: string,
 *   user: string,
 *   userId?: string,
 *   action: string,
 *   details: Record<string, unknown>,
 *   category: AuditCategory,
 *   type: AuditLogType,
 * }} AuditLogEntry
 */

export const MOCK_GLOBAL_AUDIT_LOGS_KEY = 'mock_global_audit_logs'

/** @param {unknown} v */
function isAuditEntry(v) {
  if (!v || typeof v !== 'object') return false
  const o = /** @type {Record<string, unknown>} */ (v)
  return typeof o.id === 'string' && typeof o.timestamp === 'string' && typeof o.action === 'string'
}

/** @returns {AuditLogEntry[]} */
export function getDefaultMockAuditLogs() {
  const base = new Date('2026-04-15T12:00:00.000Z').getTime()
  /** @type {AuditLogEntry[]} */
  const rows = [
    {
      id: 'aud_seed_01',
      timestamp: new Date(base - 1000 * 60 * 5).toISOString(),
      category: 'DOCUMENT',
      type: 'SUCCESS',
      user: 'Elena Stoyanova',
      userId: 'usr_adm_elena',
      action: 'Approved document "Company Vision 2026"',
      details: { documentId: 'doc_company_vision_2026', oldValue: { status: 'SUBMITTED' }, newValue: { status: 'APPROVED' } },
    },
    {
      id: 'aud_seed_02',
      timestamp: new Date(base - 1000 * 60 * 35).toISOString(),
      category: 'ADMIN',
      type: 'DANGER',
      user: 'Dimitar Petrov',
      userId: 'usr_adm_dimitar',
      action: 'Deactivated user Vladimir Tsvetanov',
      details: { targetUserId: 'usr_deact_vladimir', oldValue: { isActive: true }, newValue: { isActive: false } },
    },
    {
      id: 'aud_seed_03',
      timestamp: new Date(base - 1000 * 60 * 50).toISOString(),
      category: 'DOCUMENT',
      type: 'INFO',
      user: 'Ivan Ivanov',
      userId: 'usr_auth_ivan',
      action: 'Created draft "Sofia Office Operations Playbook"',
      details: { documentId: 'doc_sofia_ops_playbook', newValue: { status: 'DRAFT' } },
    },
    {
      id: 'aud_seed_04',
      timestamp: new Date(base - 1000 * 60 * 120).toISOString(),
      category: 'DOCUMENT',
      type: 'SUCCESS',
      user: 'Mariya Georgieva',
      userId: 'usr_auth_mariya',
      action: 'Submitted document "Internal Security Protocol v2" for review',
      details: { documentId: 'doc_internal_security_v2', oldValue: { status: 'DRAFT' }, newValue: { status: 'SUBMITTED' } },
    },
    {
      id: 'aud_seed_05',
      timestamp: new Date(base - 1000 * 60 * 180).toISOString(),
      category: 'DOCUMENT',
      type: 'DANGER',
      user: 'Nikolay Kolev',
      userId: 'usr_rev_nikolay',
      action: 'Rejected document "Marketing Campaign Budget"',
      details: {
        documentId: 'doc_marketing_budget',
        oldValue: { status: 'SUBMITTED' },
        newValue: { status: 'REJECTED', comment: 'Please reduce Digital Ads cost by 15%' },
      },
    },
    {
      id: 'aud_seed_06',
      timestamp: new Date(base - 1000 * 60 * 200).toISOString(),
      category: 'DOCUMENT',
      type: 'SUCCESS',
      user: 'Petya Uzunova',
      userId: 'usr_rev_petya',
      action: 'Approved document "Employee Onboarding Guide"',
      details: { documentId: 'doc_onboarding_guide', oldValue: { status: 'SUBMITTED' }, newValue: { status: 'APPROVED' } },
    },
    {
      id: 'aud_seed_07',
      timestamp: new Date(base - 1000 * 60 * 240).toISOString(),
      category: 'DOCUMENT',
      type: 'SUCCESS',
      user: 'Ivan Ivanov',
      userId: 'usr_auth_ivan',
      action: 'Submitted document "Monthly Financial Report - Q2" for review',
      details: { documentId: 'doc_monthly_financial_q2', oldValue: { status: 'DRAFT' }, newValue: { status: 'SUBMITTED' } },
    },
    {
      id: 'aud_seed_08',
      timestamp: new Date(base - 1000 * 60 * 300).toISOString(),
      category: 'USER',
      type: 'SUCCESS',
      user: 'Elena Stoyanova',
      userId: 'usr_adm_elena',
      action: 'Updated roles for Stefan Marinov',
      details: {
        targetUserId: 'usr_multi_stefan',
        oldValue: { roles: ['AUTHOR'] },
        newValue: { roles: ['AUTHOR', 'REVIEWER'] },
      },
    },
    {
      id: 'aud_seed_09',
      timestamp: new Date(base - 1000 * 60 * 360).toISOString(),
      category: 'DOCUMENT',
      type: 'INFO',
      user: 'Stefan Marinov',
      userId: 'usr_multi_stefan',
      action: 'Created draft "GDPR Data Processing Register"',
      details: { documentId: 'doc_gdpr_register', newValue: { status: 'DRAFT' } },
    },
    {
      id: 'aud_seed_10',
      timestamp: new Date(base - 1000 * 60 * 400).toISOString(),
      category: 'ADMIN',
      type: 'INFO',
      user: 'Dimitar Petrov',
      userId: 'usr_adm_dimitar',
      action: 'Viewed system audit index',
      details: { targetId: 'audit_ui' },
    },
    {
      id: 'aud_seed_11',
      timestamp: new Date(base - 1000 * 60 * 480).toISOString(),
      category: 'DOCUMENT',
      type: 'SUCCESS',
      user: 'Elena Stoyanova',
      userId: 'usr_adm_elena',
      action: 'Approved document "Winter Sales Initiative Brief"',
      details: { documentId: 'doc_winter_sales_brief', oldValue: { status: 'SUBMITTED' }, newValue: { status: 'APPROVED' } },
    },
    {
      id: 'aud_seed_12',
      timestamp: new Date(base - 1000 * 60 * 520).toISOString(),
      category: 'USER',
      type: 'WARNING',
      user: 'System',
      action: 'Recorded failed login attempt (mock)',
      details: { username: 'unknown_user', ip: '192.0.2.10' },
    },
    {
      id: 'aud_seed_13',
      timestamp: new Date(base - 1000 * 60 * 600).toISOString(),
      category: 'DOCUMENT',
      type: 'INFO',
      user: 'Mariya Georgieva',
      userId: 'usr_auth_mariya',
      action: 'Updated draft "Supplier Quality Checklist"',
      details: { documentId: 'doc_supplier_quality', newValue: { lastSaved: true } },
    },
    {
      id: 'aud_seed_14',
      timestamp: new Date(base - 1000 * 60 * 660).toISOString(),
      category: 'USER',
      type: 'INFO',
      user: 'System',
      action: 'Recorded access request: Hristo Bonev requested AUTHOR role',
      details: { targetUserId: 'usr_pend_hristo', newValue: { requestedRole: 'AUTHOR' } },
    },
    {
      id: 'aud_seed_15',
      timestamp: new Date(base - 1000 * 60 * 720).toISOString(),
      category: 'DOCUMENT',
      type: 'INFO',
      user: 'Ivan Ivanov',
      userId: 'usr_auth_ivan',
      action: 'Created draft "Network Access Policy"',
      details: { documentId: 'doc_network_access', newValue: { status: 'DRAFT' } },
    },
    {
      id: 'aud_seed_16',
      timestamp: new Date(base - 1000 * 60 * 800).toISOString(),
      category: 'ADMIN',
      type: 'INFO',
      user: 'Dimitar Petrov',
      userId: 'usr_adm_dimitar',
      action: 'Sent policy reminder to deactivated account Vladimir Tsvetanov (mock)',
      details: { targetUserId: 'usr_deact_vladimir' },
    },
    {
      id: 'aud_seed_17',
      timestamp: new Date(base - 1000 * 60 * 900).toISOString(),
      category: 'DOCUMENT',
      type: 'INFO',
      user: 'Dimitar Petrov',
      userId: 'usr_adm_dimitar',
      action: 'Commented on document "Monthly Financial Report - Q2"',
      details: { documentId: 'doc_monthly_financial_q2', newValue: { note: 'Awaiting final attachments' } },
    },
    {
      id: 'aud_seed_18',
      timestamp: new Date(base - 1000 * 60 * 960).toISOString(),
      category: 'USER',
      type: 'INFO',
      user: 'Nikolay Kolev',
      userId: 'usr_rev_nikolay',
      action: 'Opened document "Monthly Financial Report - Q2" for review',
      details: { documentId: 'doc_monthly_financial_q2' },
    },
    {
      id: 'aud_seed_19',
      timestamp: new Date(base - 1000 * 60 * 1000).toISOString(),
      category: 'DOCUMENT',
      type: 'INFO',
      user: 'Elena Stoyanova',
      userId: 'usr_adm_elena',
      action: 'Created draft "IT Transformation Roadmap 2026"',
      details: { documentId: 'doc_it_roadmap', newValue: { status: 'DRAFT' } },
    },
    {
      id: 'aud_seed_20',
      timestamp: new Date(base - 1000 * 60 * 1080).toISOString(),
      category: 'USER',
      type: 'SUCCESS',
      user: 'Dimitar Petrov',
      userId: 'usr_adm_dimitar',
      action: 'Updated roles for Mariya Georgieva',
      details: { targetUserId: 'usr_auth_mariya', oldValue: { roles: ['READER'] }, newValue: { roles: ['AUTHOR'] } },
    },
    {
      id: 'aud_seed_21',
      timestamp: new Date(base - 1000 * 60 * 1140).toISOString(),
      category: 'DOCUMENT',
      type: 'INFO',
      user: 'Petya Uzunova',
      userId: 'usr_rev_petya',
      action: 'Opened document "Internal Security Protocol v2" for review',
      details: { documentId: 'doc_internal_security_v2' },
    },
    {
      id: 'aud_seed_22',
      timestamp: new Date(base - 1000 * 60 * 1200).toISOString(),
      category: 'ADMIN',
      type: 'WARNING',
      user: 'Elena Stoyanova',
      userId: 'usr_adm_elena',
      action: 'Bulk export attempted (mock)',
      details: { targetId: 'export_job_tmp', newValue: { rows: 120 } },
    },
  ]
  return rows.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

/**
 * @returns {AuditLogEntry[]}
 */
export function loadMockAuditLogs() {
  try {
    const raw = localStorage.getItem(MOCK_GLOBAL_AUDIT_LOGS_KEY)
    if (raw == null || raw === '') {
      const defaults = getDefaultMockAuditLogs()
      localStorage.setItem(MOCK_GLOBAL_AUDIT_LOGS_KEY, JSON.stringify(defaults))
      return defaults
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      const defaults = getDefaultMockAuditLogs()
      localStorage.setItem(MOCK_GLOBAL_AUDIT_LOGS_KEY, JSON.stringify(defaults))
      return defaults
    }
    return /** @type {AuditLogEntry[]} */ (parsed.filter(isAuditEntry))
  } catch {
    const defaults = getDefaultMockAuditLogs()
    try {
      localStorage.setItem(MOCK_GLOBAL_AUDIT_LOGS_KEY, JSON.stringify(defaults))
    } catch {
      // ignore
    }
    return defaults
  }
}

/**
 * @param {AuditLogEntry[]} logs
 */
export function persistMockAuditLogs(logs) {
  try {
    localStorage.setItem(MOCK_GLOBAL_AUDIT_LOGS_KEY, JSON.stringify(logs))
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sap_dm_mock_audit_logs_updated'))
  }
}

/**
 * @param {{
 *   actorUserId?: string | null,
 *   actorDisplayName: string,
 *   action: string,
 *   details?: Record<string, unknown>,
 *   category?: AuditCategory,
 *   type?: AuditLogType,
 * }} p
 */
export function appendMockAuditLog(p) {
  const logs = loadMockAuditLogs()
  const id = `aud_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  /** @type {AuditLogEntry} */
  const entry = {
    id,
    timestamp: new Date().toISOString(),
    user: p.actorDisplayName,
    userId: p.actorUserId ?? undefined,
    action: p.action,
    details: p.details && typeof p.details === 'object' ? p.details : {},
    category: p.category ?? 'DOCUMENT',
    type: p.type ?? 'INFO',
  }
  persistMockAuditLogs([entry, ...logs])
}

/** @returns {AuditLogEntry[]} Newest first */
export function getMockAuditLogs() {
  return [...loadMockAuditLogs()].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )
}
