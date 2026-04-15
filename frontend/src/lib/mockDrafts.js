/**
 * Global mock documents (localStorage). Mirrors DocumentEntity.java:
 * id, title, author (User snapshot), status, versions (VersionEntity[]), activeVersionId.
 * Denormalized snippet/body/description/updatedAt support the existing UI.
 */

/** @typedef {'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'} DocumentStatus */

/**
 * @typedef {{
 *   id: string,
 *   versionNumber: number,
 *   createdAt: string,
 *   title: string,
 *   body: string,
 *   description: string,
 *   snippet: string,
 * }} MockVersion
 */

/** @typedef {{ reviewerName: string, timestamp: string, comment: string }} DraftFeedback */

/**
 * @typedef {{
 *   id: string,
 *   title: string,
 *   status: DocumentStatus,
 *   author: { id: string, username: string, name: string },
 *   authorId?: string,
 *   authorName?: string,
 *   versions: MockVersion[],
 *   activeVersionId: string,
 *   snippet: string,
 *   updatedAt: string,
 *   lastEditedLabel: string,
 *   feedback?: DraftFeedback,
 *   description?: string,
 *   body?: string,
 * }} MockDraft
 */

export const MOCK_GLOBAL_DOCUMENTS_KEY = 'mock_global_documents'

/** @param {Partial<MockDraft> & { id: string }} raw */
function migrateDocument(raw) {
  /** @type {DocumentStatus} */
  const rawStatus = /** @type {string} */ (raw.status)
  let status = rawStatus === 'PENDING_REVIEW' ? 'SUBMITTED' : /** @type {DocumentStatus} */ (raw.status)
  if (!['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'].includes(String(status))) {
    status = 'DRAFT'
  }

  let author = raw.author
  if (!author || typeof author !== 'object') {
    author = {
      id: String(raw.authorId ?? ''),
      username: '',
      name: String(raw.authorName ?? 'Unknown'),
    }
  }

  const updatedAt = raw.updatedAt || new Date().toISOString()
  const body = typeof raw.body === 'string' ? raw.body : ''
  const description = typeof raw.description === 'string' ? raw.description : ''
  const snippet =
    typeof raw.snippet === 'string' && raw.snippet.length > 0
      ? raw.snippet
      : buildSnippetFromBody(body || description)

  let versions = Array.isArray(raw.versions) ? raw.versions : []
  let activeVersionId = typeof raw.activeVersionId === 'string' ? raw.activeVersionId : ''
  if (versions.length === 0) {
    const vid = `ver_${raw.id}_1`
    versions = [
      {
        id: vid,
        versionNumber: 1,
        createdAt: updatedAt,
        title: String(raw.title ?? ''),
        body,
        description,
        snippet,
      },
    ]
    activeVersionId = vid
  }

  const active = versions.find((v) => v.id === activeVersionId) ?? versions[0]

  return {
    ...raw,
    status,
    author,
    authorId: author.id,
    authorName: author.name,
    versions,
    activeVersionId: active.id,
    title: raw.title ?? active.title ?? 'Untitled',
    snippet: active.snippet || snippet,
    body: active.body ?? body,
    description: active.description ?? description,
    updatedAt,
    lastEditedLabel: raw.lastEditedLabel ?? '—',
    feedback: raw.feedback,
  }
}

/** @param {unknown} d */
function isDoc(d) {
  return Boolean(d && typeof d === 'object' && typeof /** @type {{ id?: unknown }} */ (d).id === 'string')
}

/**
 * @param {MockDraft} doc
 * @param {Partial<MockVersion>} fields
 * @returns {MockDraft}
 */
export function applyActiveVersionFields(doc, fields) {
  const versions = doc.versions.map((v) =>
    v.id === doc.activeVersionId ? { ...v, ...fields } : v,
  )
  const active = versions.find((v) => v.id === doc.activeVersionId) ?? versions[0]
  return {
    ...doc,
    versions,
    title: fields.title ?? doc.title,
    snippet: fields.snippet ?? active.snippet,
    body: fields.body ?? active.body,
    description: fields.description ?? active.description,
  }
}

/** @param {MockDraft} doc */
export function documentAuthorId(doc) {
  if (doc.author && typeof doc.author.id === 'string') return doc.author.id
  return doc.authorId ?? ''
}

/** @param {MockDraft} doc */
export function documentAuthorDisplay(doc) {
  if (doc.author && typeof doc.author.name === 'string') return doc.author.name
  return doc.authorName ?? '—'
}

/** @returns {MockDraft[]} */
export function getDefaultMockDrafts() {
  const mk = (
    /** @type {string} */ id,
    /** @type {string} */ title,
    /** @type {DocumentStatus} */ status,
    /** @type {{ id: string, username: string, name: string }} */ author,
    /** @type {string} */ body,
    /** @type {string} */ description,
    /** @type {string} */ updatedAt,
    /** @type {string} */ lastEditedLabel,
    /** @type {DraftFeedback | undefined} */ feedback,
  ) => {
    const snippet = buildSnippetFromBody(body || description)
    const vid = `ver_${id}_1`
    /** @type {MockDraft} */
    const doc = {
      id,
      title,
      status,
      author,
      authorId: author.id,
      authorName: author.name,
      versions: [
        {
          id: vid,
          versionNumber: 1,
          createdAt: updatedAt,
          title,
          body,
          description,
          snippet,
        },
      ],
      activeVersionId: vid,
      snippet,
      body,
      description,
      updatedAt,
      lastEditedLabel,
      feedback,
    }
    return doc
  }

  const ivan = { id: 'usr_auth_ivan', username: 'auth_ivan', name: 'Ivan Ivanov' }
  const mariya = { id: 'usr_auth_mariya', username: 'auth_mariya', name: 'Mariya Georgieva' }
  const stefan = { id: 'usr_multi_stefan', username: 'multi_stefan', name: 'Stefan Marinov' }
  const elena = { id: 'usr_adm_elena', username: 'adm_elena', name: 'Elena Stoyanova' }

  return [
    mk(
      'doc_monthly_financial_q2',
      'Monthly Financial Report - Q2',
      'SUBMITTED',
      ivan,
      '<p>Consolidated P&amp;L for Q2 with variance commentary for Sofia and Plovdiv cost centers.</p>',
      'Finance — internal distribution only.',
      '2026-04-14T09:00:00.000Z',
      'Apr 14, 2026',
      undefined,
    ),
    mk(
      'doc_internal_security_v2',
      'Internal Security Protocol v2',
      'SUBMITTED',
      mariya,
      '<p>Revised access tiers, badge policy, and visitor escort rules aligned with group standards.</p>',
      'Security program update.',
      '2026-04-14T11:30:00.000Z',
      'Apr 14, 2026',
      undefined,
    ),
    mk(
      'doc_company_vision_2026',
      'Company Vision 2026',
      'APPROVED',
      stefan,
      '<p>Strategic pillars: customer trust, operational excellence, and sustainable growth in SEE markets.</p>',
      'Leadership communication pack.',
      '2026-04-10T16:00:00.000Z',
      'Apr 10, 2026',
      undefined,
    ),
    mk(
      'doc_onboarding_guide',
      'Employee Onboarding Guide',
      'APPROVED',
      mariya,
      '<p>Week-one checklist, systems access order, and buddy program expectations for new hires.</p>',
      'HR — onboarding.',
      '2026-04-09T14:20:00.000Z',
      'Apr 9, 2026',
      undefined,
    ),
    mk(
      'doc_marketing_budget',
      'Marketing Campaign Budget',
      'REJECTED',
      ivan,
      '<p>Planned spend across TV, print, and digital channels for autumn brand push.</p>',
      'Marketing proposal.',
      '2026-04-08T10:15:00.000Z',
      'Apr 8, 2026',
      {
        reviewerName: 'Nikolay Kolev',
        timestamp: 'Apr 8, 2026 · 11:02 AM',
        comment: 'Please reduce Digital Ads cost by 15%.',
      },
    ),
    mk(
      'doc_sofia_ops_playbook',
      'Sofia Office Operations Playbook',
      'DRAFT',
      ivan,
      '<p>Facilities contacts, desk booking norms, and incident escalation for the Sofia hub.</p>',
      'Operations draft.',
      '2026-04-13T08:20:00.000Z',
      '2 days ago',
      undefined,
    ),
    mk(
      'doc_supplier_quality',
      'Supplier Quality Checklist',
      'DRAFT',
      mariya,
      '<p>Incoming inspection steps and non-conformance logging for regional suppliers.</p>',
      'Quality draft.',
      '2026-04-12T11:00:00.000Z',
      'Apr 12, 2026',
      undefined,
    ),
    mk(
      'doc_gdpr_register',
      'GDPR Data Processing Register',
      'DRAFT',
      stefan,
      '<p>ROPA-style table of purposes, lawful bases, and retention for core business systems.</p>',
      'Compliance working draft.',
      '2026-04-11T15:40:00.000Z',
      'Apr 11, 2026',
      undefined,
    ),
    mk(
      'doc_winter_sales_brief',
      'Winter Sales Initiative Brief',
      'APPROVED',
      elena,
      '<p>Channel priorities, targets, and partner incentives for the winter sales cycle.</p>',
      'Commercial brief.',
      '2026-04-07T13:00:00.000Z',
      'Apr 7, 2026',
      undefined,
    ),
    mk(
      'doc_it_roadmap',
      'IT Transformation Roadmap 2026',
      'DRAFT',
      elena,
      '<p>Modernization waves, dependency map, and risk mitigations for legacy retirement.</p>',
      'IT strategy draft.',
      '2026-04-05T09:30:00.000Z',
      'Apr 5, 2026',
      undefined,
    ),
  ]
}

export function getMockDraftsStorageKey() {
  return MOCK_GLOBAL_DOCUMENTS_KEY
}

/** @returns {MockDraft[]} */
export function loadMockDrafts() {
  const key = getMockDraftsStorageKey()
  try {
    const raw = localStorage.getItem(key)
    if (raw == null || raw === '') {
      const defaults = getDefaultMockDrafts().map(migrateDocument)
      localStorage.setItem(key, JSON.stringify(defaults))
      return defaults
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      const defaults = getDefaultMockDrafts().map(migrateDocument)
      localStorage.setItem(key, JSON.stringify(defaults))
      return defaults
    }
    return /** @type {MockDraft[]} */ (parsed.filter(isDoc).map((d) => migrateDocument(/** @type {MockDraft} */ (d))))
  } catch {
    const defaults = getDefaultMockDrafts().map(migrateDocument)
    try {
      localStorage.setItem(key, JSON.stringify(defaults))
    } catch {
      // ignore
    }
    return defaults
  }
}

/**
 * @param {MockDraft[]} drafts
 */
export function persistMockDrafts(drafts) {
  try {
    localStorage.setItem(getMockDraftsStorageKey(), JSON.stringify(drafts))
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sap_dm_mock_documents_updated'))
  }
}

/**
 * @param {string} body
 * @param {number} [maxLen]
 */
export function buildSnippetFromBody(body, maxLen = 160) {
  const flat = String(body ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!flat) return 'No content yet.'
  if (flat.length <= maxLen) return flat
  return `${flat.slice(0, maxLen).trim()}…`
}
